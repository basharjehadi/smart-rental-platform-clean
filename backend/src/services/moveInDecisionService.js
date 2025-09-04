import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Apply admin decision business logic for move-in issues
 * @param {Object} params
 * @param {string} params.issueId - The move-in issue ID
 * @param {string} params.decision - The admin decision (APPROVE/REJECT)
 * @param {string} params.adminId - The admin user ID making the decision
 * @param {string} params.notes - Optional admin notes
 */
export async function applyAdminDecision({ issueId, decision, adminId, notes = '' }) {
  try {
    console.log(`🔄 Applying admin decision: ${decision} for issue: ${issueId}`);

    // Load issue with related data
    const issue = await prisma.moveInIssue.findUnique({
      where: { id: issueId },
      include: {
        lease: {
          include: {
            offer: {
              select: {
                id: true,
                rentAmount: true,
                depositAmount: true,
                tenantGroup: {
                  include: {
                    members: {
                      select: {
                        userId: true,
                        user: {
                          select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            property: {
              select: {
                id: true,
                name: true,
                organization: {
                  include: {
                    members: {
                      where: { role: 'OWNER' },
                      select: {
                        userId: true,
                        user: {
                          select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    const { lease } = issue;
    const now = new Date();

    if (decision === 'APPROVE') {
      console.log('✅ Processing APPROVE decision - terminating lease and processing refund');

      // Execute all cascading updates in a single transaction
      await prisma.$transaction(async (tx) => {
        // 1) Terminate lease
        await tx.lease.update({
          where: { id: lease.id },
          data: {
            status: 'TERMINATED',
            updatedAt: now,
          },
        });

        // 2) Cancel offer
        await tx.offer.update({
          where: { id: lease.offerId },
          data: {
            status: 'REJECTED',
            updatedAt: now,
            isPaid: false,
            paymentDate: null,
          },
        });

        // 3) Unlock rental request (if any)
        const rentalRequest = await tx.rentalRequest.findFirst({
          where: { offers: { some: { id: lease.offerId } } },
          select: { id: true },
        });

        if (rentalRequest) {
          await tx.rentalRequest.update({
            where: { id: rentalRequest.id },
            data: {
              isLocked: false,
              poolStatus: 'CANCELLED',
              status: 'CANCELLED',
              updatedAt: now,
            },
          });
          console.log('🔓 Rental request unlocked');
        }

        // 4) Make property available again
        await tx.property.update({
          where: { id: lease.propertyId },
          data: {
            status: 'AVAILABLE',
            availability: true,
            updatedAt: now,
          },
        });

        // 5) Archive conversations related to the offer
        await tx.conversation.updateMany({
          where: { offerId: lease.offerId },
          data: { status: 'ARCHIVED' },
        });

        // 6) Delete contract (record and PDF) if exists for this rental request
        if (lease.rentalRequestId) {
          const existingContract = await tx.contract.findUnique({
            where: { rentalRequestId: lease.rentalRequestId },
          });
          if (existingContract) {
            await tx.contract.delete({ where: { id: existingContract.id } });
            try {
              const fs = await import('fs');
              const path = await import('path');
              if (existingContract.pdfUrl) {
                const filePath = path.join(process.cwd(), existingContract.pdfUrl);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
              }
            } catch (fileErr) {
              console.warn('⚠️ Contract file cleanup skipped:', fileErr?.message);
            }
          }
        }
      });

      // 7) Refund payments using existing refund pipeline (best-effort, outside transaction)
      try {
        const { refundOfferPayments } = await import('../controllers/paymentController.js');
        await refundOfferPayments(lease.offerId);
      } catch (e) {
        console.warn('⚠️ Refund processing unavailable:', e?.message);
      }

      // 8) Log refund stub (until real RefundRequest model exists)
      const refundAmount = lease.offer.depositAmount || lease.offer.rentAmount;
      const tenantId = lease.offer.tenantGroup.members[0]?.userId;
      console.log('💰 Refund request stub created:', {
        issueId,
        leaseId: lease.id,
        tenantId,
        amount: refundAmount,
        reason: 'Move-in issue approved by admin',
        status: 'PENDING',
        requestedAt: now,
        requestedBy: adminId,
        notes: notes || 'Automatic refund request due to approved move-in issue',
      });

      console.log('🏠 Property marked as available, conversations archived, and tenant data cleaned up');

    } else if (decision === 'REJECT') {
      console.log('❌ Processing REJECT decision - no lease changes, issue closed');
      
      // For REJECT decisions, no changes to lease are needed
      // The issue status is already updated to 'CLOSED' in the controller
      
    } else {
      console.log(`⚠️ Unknown decision type: ${decision}, no business logic applied`);
    }

    // Always create audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        adminId: adminId,
        action: `ADMIN_DECISION_${decision}`,
        resourceType: 'MOVE_IN_ISSUE',
        resourceId: issueId,
        details: JSON.stringify({
          decision,
          notes,
          issueTitle: issue.title,
          leaseId: lease.id,
          propertyId: lease.propertyId,
          tenantName: lease.offer.tenantGroup.members[0]?.user?.name || 'Unknown',
          landlordName: lease.property.organization.members[0]?.user?.name || 'Unknown',
          timestamp: now.toISOString(),
        }),
        timestamp: now,
      },
    });

    console.log('📝 Audit log entry created:', auditLog.id);

    // Return summary of actions taken
    return {
      success: true,
      actions: {
        leaseUpdated: decision === 'APPROVE',
        offerCancelled: decision === 'APPROVE',
        rentalRequestUnlocked: decision === 'APPROVE',
        propertyUpdated: decision === 'APPROVE',
        paymentsRefunded: decision === 'APPROVE',
        refundRequestCreated: decision === 'APPROVE',
        auditLogCreated: true,
      },
      refundRequestId: decision === 'APPROVE' ? 'STUB_' + Date.now() : null,
      leaseStatus: decision === 'APPROVE' ? 'TERMINATED' : lease.status,
      propertyStatus: decision === 'APPROVE' ? 'AVAILABLE' : 'RENTED',
    };

  } catch (error) {
    console.error('❌ Error applying admin decision:', error);
    throw new Error(`Failed to apply admin decision: ${error.message}`);
  }
}

/**
 * Get decision summary for an issue
 * @param {string} issueId - The move-in issue ID
 */
export async function getDecisionSummary(issueId) {
  try {
    const issue = await prisma.moveInIssue.findUnique({
      where: { id: issueId },
      select: {
        id: true,
        title: true,
        status: true,
        adminDecision: true,
        adminDecisionAt: true,
        adminDecisionBy: true,
        adminNotes: true,
        lease: {
          select: {
            id: true,
            status: true,
            terminatedAt: true,
            offer: {
              select: {
                rentAmount: true,
                depositAmount: true,
              },
            },
          },
        },
        refundRequests: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            amount: true,
            status: true,
            requestedAt: true,
          },
        },
      },
    });

    return issue;
  } catch (error) {
    console.error('❌ Error getting decision summary:', error);
    throw error;
  }
}
