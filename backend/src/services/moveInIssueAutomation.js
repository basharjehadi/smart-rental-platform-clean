import { prisma } from '../utils/prisma.js';

/**
 * Automated Move-In Issue Management Service
 * Handles automatic escalation, status updates, and notifications
 */

// Auto-escalate issues to admin if no landlord response within 24 hours
export const autoEscalateIssues = async () => {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    // Find issues that are OPEN and created more than 24 hours ago
    const staleIssues = await prisma.moveInIssue.findMany({
      where: {
        status: 'OPEN',
        createdAt: {
          lte: twentyFourHoursAgo
        }
      },
      include: {
        lease: {
          include: {
            offer: {
              include: {
                tenantGroup: {
                  include: {
                    members: {
                      select: { userId: true }
                    }
                  }
                },
                property: {
                  include: {
                    organization: {
                      include: {
                        members: {
                          where: { role: 'OWNER' },
                          select: { userId: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        comments: {
          where: {
            author: {
              role: 'LANDLORD'
            }
          },
          take: 1
        }
      }
    });

    for (const issue of staleIssues) {
      // Check if landlord has responded (has any comments)
      const hasLandlordResponse = issue.comments.length > 0;
      
      if (!hasLandlordResponse) {
        // Auto-escalate to admin
        await prisma.moveInIssue.update({
          where: { id: issue.id },
          data: { 
            status: 'ESCALATED',
            updatedAt: new Date()
          }
        });

        // Create auto-escalation comment
        await prisma.moveInIssueComment.create({
          data: {
            content: '⚠️ **AUTO-ESCALATED**: This issue has been automatically escalated to admin review due to no landlord response within 24 hours.',
            authorId: 'system', // System user ID
            issueId: issue.id,
          }
        });

        // Create notifications for all participants
        const participants = new Set();
        
        // Add tenant group members
        issue.lease.offer.tenantGroup.members.forEach((member) => {
          participants.add(member.userId);
        });
        
        // Add landlord
        if (issue.lease.offer.property?.organization?.members) {
          issue.lease.offer.property.organization.members.forEach((member) => {
            participants.add(member.userId);
          });
        }

        // Create notifications
        const notificationPromises = Array.from(participants).map((participantId) =>
          prisma.notification.create({
            data: {
              userId: participantId,
              type: 'MOVE_IN_ISSUE_UPDATED',
              entityId: issue.id,
              title: 'Issue Auto-Escalated to Admin',
              body: `Issue "${issue.title}" has been automatically escalated due to no landlord response.`,
            },
          })
        );

        await Promise.all(notificationPromises);

        // Emit socket events
        if (global.io) {
          Array.from(participants).forEach((participantId) => {
            global.io.to(`user:${participantId}`).emit('move-in-issue:updated', {
              issueId: issue.id,
              status: 'ESCALATED',
              reason: 'auto-escalated',
              message: 'Issue auto-escalated to admin due to no landlord response'
            });
          });
        }

        console.log(`🚨 Auto-escalated issue ${issue.id}: "${issue.title}"`);
      }
    }

    console.log(`✅ Auto-escalation check completed. Processed ${staleIssues.length} issues.`);
  } catch (error) {
    console.error('❌ Auto-escalation error:', error);
  }
};

// Auto-mark issues as IN_PROGRESS when landlord responds
export const autoMarkInProgress = async (issueId, landlordUserId) => {
  try {
    const issue = await prisma.moveInIssue.findUnique({
      where: { id: issueId },
      include: {
        lease: {
          include: {
            offer: {
              include: {
                tenantGroup: {
                  include: {
                    members: {
                      select: { userId: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!issue || issue.status !== 'OPEN') {
      return;
    }

    // Check if this is the first landlord comment
    const landlordComments = await prisma.moveInIssueComment.count({
      where: {
        issueId: issueId,
        authorId: landlordUserId
      }
    });

    if (landlordComments === 1) { // First landlord comment
      // Auto-mark as IN_PROGRESS
      await prisma.moveInIssue.update({
        where: { id: issueId },
        data: { 
          status: 'IN_PROGRESS',
          updatedAt: new Date()
        }
      });

      // Create auto-progress comment
      await prisma.moveInIssueComment.create({
        data: {
          content: '🔄 **AUTO-UPDATED**: Issue status automatically changed to IN_PROGRESS as landlord has responded.',
          authorId: 'system', // System user ID
          issueId: issueId,
        }
      });

      // Create notifications for tenant group members
      const tenantMembers = issue.lease.offer.tenantGroup.members;
      const notificationPromises = tenantMembers.map((member) =>
        prisma.notification.create({
          data: {
            userId: member.userId,
            type: 'MOVE_IN_ISSUE_UPDATED',
            entityId: issueId,
            title: 'Issue Status Updated',
            body: `Issue "${issue.title}" is now being addressed by the landlord.`,
          },
        })
      );

      await Promise.all(notificationPromises);

      // Emit socket events
      if (global.io) {
        tenantMembers.forEach((member) => {
          global.io.to(`user:${member.userId}`).emit('move-in-issue:updated', {
            issueId: issueId,
            status: 'IN_PROGRESS',
            reason: 'landlord-responded',
            message: 'Issue marked as in progress - landlord is addressing it'
          });
        });
      }

      console.log(`🔄 Auto-marked issue ${issueId} as IN_PROGRESS`);
    }
  } catch (error) {
    console.error('❌ Auto-progress error:', error);
  }
};

// Auto-close resolved issues after 7 days of no activity
export const autoCloseResolvedIssues = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const resolvedIssues = await prisma.moveInIssue.findMany({
      where: {
        status: 'RESOLVED',
        updatedAt: {
          lte: sevenDaysAgo
        }
      },
      include: {
        lease: {
          include: {
            offer: {
              include: {
                tenantGroup: {
                  include: {
                    members: {
                      select: { userId: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    for (const issue of resolvedIssues) {
      await prisma.moveInIssue.update({
        where: { id: issue.id },
        data: { 
          status: 'CLOSED',
          updatedAt: new Date()
        }
      });

      // Create auto-close comment
      await prisma.moveInIssueComment.create({
        data: {
          content: '✅ **AUTO-CLOSED**: This issue has been automatically closed after 7 days of resolution.',
          authorId: 'system',
          issueId: issue.id,
        }
      });

      console.log(`✅ Auto-closed resolved issue ${issue.id}: "${issue.title}"`);
    }

    console.log(`✅ Auto-close check completed. Processed ${resolvedIssues.length} issues.`);
  } catch (error) {
    console.error('❌ Auto-close error:', error);
  }
};

// Start the automation scheduler
export const startMoveInIssueAutomation = () => {
  // Run every hour
  setInterval(async () => {
    try {
      await autoEscalateIssues();
      await autoCloseResolvedIssues();
    } catch (error) {
      console.error('❌ Move-in issue automation error:', error);
    }
  }, 60 * 60 * 1000); // Every hour

  console.log('🤖 Move-in issue automation scheduler started (every hour)');
};

