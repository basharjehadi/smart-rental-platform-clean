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
      
      // Mark lease as terminated
      await prisma.lease.update({
        where: { id: lease.id },
        data: {
          status: 'TERMINATED',
          terminatedAt: now,
          updatedAt: now,
        },
      });

      // Create refund request record (stub for now)
      // TODO: Implement RefundRequest model when payment system is ready
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

      // For now, we'll just log the refund action
      // In production, this would create a RefundRequest record and integrate with payment provider

      // Update property status to available (since lease is terminated)
      await prisma.property.update({
        where: { id: lease.propertyId },
        data: {
          status: 'AVAILABLE',
          availability: true,
          updatedAt: now,
        },
      });

      console.log('🏠 Property marked as available');

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
        refundRequestCreated: decision === 'APPROVE',
        propertyUpdated: decision === 'APPROVE',
        auditLogCreated: true,
      },
      refundRequestId: decision === 'APPROVE' ? 'STUB_' + Date.now() : null,
      leaseStatus: decision === 'APPROVE' ? 'TERMINATED' : lease.status,
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
