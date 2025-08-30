import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new comment on a move-in issue
 * POST /api/move-in-issues/:issueId/comments
 */
export const createComment = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    // Handle file uploads
    let evidence = [];
    let evidenceType = null;
    
    if (req.files && req.files.length > 0) {
      evidence = req.files.map(file => `/uploads/move_in_evidence/${file.filename}`);
      
      // Determine evidence type based on first file
      const firstFile = req.files[0];
      if (firstFile.mimetype.startsWith('image/')) {
        evidenceType = 'IMAGE';
      } else if (firstFile.mimetype.startsWith('video/')) {
        evidenceType = 'VIDEO';
      } else {
        evidenceType = 'DOCUMENT';
      }
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Comment content is required',
        message: 'Please provide a comment',
      });
    }

    // Find the move-in issue
    const issue = await prisma.moveInIssue.findUnique({
      where: { id: issueId },
      include: {
        lease: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  select: { userId: true },
                },
              },
            },
            property: {
              include: {
                organization: {
                  include: {
                    members: {
                      where: { role: 'OWNER' },
                      select: { userId: true },
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
      return res.status(404).json({
        error: 'Move-in issue not found',
        message: 'The specified move-in issue does not exist',
      });
    }

    // Check if user is authorized to comment
    const isTenant = issue.lease.tenantGroup.members.some(
      (member) => member.userId === userId
    );
    const isLandlord = issue.lease.property.organization.members.some(
      (member) => member.userId === userId
    );
    const isAdmin = req.user.role === 'ADMIN';

    if (!isTenant && !isLandlord && !isAdmin) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You are not authorized to comment on this issue',
      });
    }

    // Create the comment
    const comment = await prisma.moveInIssueComment.create({
      data: {
        content: content.trim(),
        evidence,
        evidenceType,
        authorId: userId,
        issueId: issueId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            profileImage: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update the issue's updatedAt timestamp
    await prisma.moveInIssue.update({
      where: { id: issueId },
      data: { updatedAt: new Date() },
    });

    // Create notifications for other participants
    const otherParticipants = new Set();
    
    // Add tenant group members
    issue.lease.tenantGroup.members.forEach((member) => {
      if (member.userId !== userId) {
        otherParticipants.add(member.userId);
      }
    });
    
    // Add landlord
    issue.lease.property.organization.members.forEach((member) => {
      if (member.userId !== userId) {
        otherParticipants.add(member.userId);
      }
    });

    // Create notifications
    const notificationPromises = Array.from(otherParticipants).map((participantId) =>
      prisma.notification.create({
        data: {
          userId: participantId,
          type: 'SYSTEM_ANNOUNCEMENT',
          entityId: issueId,
          title: 'New comment on move-in issue',
          body: `A new comment was added to the move-in issue: "${issue.title}"`,
        },
      })
    );

    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      error: 'Failed to create comment',
      message: 'An error occurred while creating the comment',
    });
  }
};

/**
 * Get a single move-in issue with all comments and author profiles
 * GET /api/move-in-issues/:issueId
 */
export const getMoveInIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const userId = req.user.id;

    // Find the move-in issue with all related data
    const issue = await prisma.moveInIssue.findUnique({
      where: { id: issueId },
      include: {
        lease: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  select: { userId: true },
                },
              },
            },
            property: {
              include: {
                organization: {
                  include: {
                    members: {
                      where: { role: 'OWNER' },
                      select: { userId: true },
                    },
                  },
                },
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                profileImage: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({
        error: 'Move-in issue not found',
        message: 'The specified move-in issue does not exist',
      });
    }

    // Check if user is authorized to view this issue
    const isTenant = issue.lease.tenantGroup.members.some(
      (member) => member.userId === userId
    );
    const isLandlord = issue.lease.property.organization.members.some(
      (member) => member.userId === userId
    );
    const isAdmin = req.user.role === 'ADMIN';

    if (!isTenant && !isLandlord && !isAdmin) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You are not authorized to view this issue',
      });
    }

    res.json({
      success: true,
      issue,
    });
  } catch (error) {
    console.error('Get move-in issue error:', error);
    res.status(500).json({
      error: 'Failed to get move-in issue',
      message: 'An error occurred while fetching the issue',
    });
  }
};

/**
 * Create a new move-in issue
 * POST /api/move-in-issues
 */
export const createMoveInIssue = async (req, res) => {
  try {
      const { leaseId, title, description } = req.body;
  const userId = req.user.id;

  if (!leaseId || !title || !description) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Lease ID, title, and description are required',
    });
  }

    // Find the lease and verify user authorization
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenantGroup: {
          include: {
            members: {
              select: { userId: true },
            },
          },
        },
        property: {
          include: {
            organization: {
              include: {
                members: {
                  where: { role: 'OWNER' },
                  select: { userId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!lease) {
      return res.status(404).json({
        error: 'Lease not found',
        message: 'The specified lease does not exist',
      });
    }

    // Check if user is authorized to create an issue for this lease
    const isTenant = lease.tenantGroup.members.some(
      (member) => member.userId === userId
    );
    const isLandlord = lease.property.organization.members.some(
      (member) => member.userId === userId
    );
    const isAdmin = req.user.role === 'ADMIN';

    if (!isTenant && !isLandlord && !isAdmin) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You are not authorized to create issues for this lease',
      });
    }

    // Create the move-in issue
    const moveInIssue = await prisma.moveInIssue.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        leaseId,
      },
      include: {
        lease: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  select: { userId: true },
                },
              },
            },
            property: {
              include: {
                organization: {
                  include: {
                    members: {
                      where: { role: 'OWNER' },
                      select: { userId: true },
                    },
                  },
                },
              },
            },
          },
        },
        comments: [],
      },
    });

    // Create notifications for other participants
    const otherParticipants = new Set();
    
    // Add tenant group members
    lease.tenantGroup.members.forEach((member) => {
      if (member.userId !== userId) {
        otherParticipants.add(member.userId);
      }
    });
    
    // Add landlord
    lease.property.organization.members.forEach((member) => {
      if (member.userId !== userId) {
        otherParticipants.add(member.userId);
      }
    });

    // Create notifications
    const notificationPromises = Array.from(otherParticipants).map((participantId) =>
      prisma.notification.create({
        data: {
          userId: participantId,
          type: 'SYSTEM_ANNOUNCEMENT',
          entityId: moveInIssue.id,
          title: 'New move-in issue reported',
          body: `A new move-in issue has been reported: "${title}"`,
        },
      })
    );

    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      message: 'Move-in issue created successfully',
      issue: moveInIssue,
    });
  } catch (error) {
    console.error('Create move-in issue error:', error);
    res.status(500).json({
      error: 'Failed to create move-in issue',
      message: 'An error occurred while creating the issue',
    });
  }
};

/**
 * Update move-in issue status
 * PUT /api/move-in-issues/:issueId/status
 */
export const updateIssueStatus = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status) {
      return res.status(400).json({
        error: 'Status is required',
        message: 'Please provide a status',
      });
    }

    // Validate status
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED',
      });
    }

    // Find the move-in issue
    const issue = await prisma.moveInIssue.findUnique({
      where: { id: issueId },
      include: {
        lease: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  select: { userId: true },
                },
              },
            },
            property: {
              include: {
                organization: {
                  include: {
                    members: {
                      where: { role: 'OWNER' },
                      select: { userId: true },
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
      return res.status(404).json({
        error: 'Move-in issue not found',
        message: 'The specified move-in issue does not exist',
      });
    }

    // Check if user is authorized to update this issue
    const isTenant = issue.lease.tenantGroup.members.some(
      (member) => member.userId === userId
    );
    const isLandlord = issue.lease.property.organization.members.some(
      (member) => member.userId === userId
    );
    const isAdmin = req.user.role === 'ADMIN';

    if (!isTenant && !isLandlord && !isAdmin) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You are not authorized to update this issue',
      });
    }

    // Update the issue status
    const updatedIssue = await prisma.moveInIssue.update({
      where: { id: issueId },
      data: { 
        status,
        updatedAt: new Date(),
      },
      include: {
        lease: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  select: { userId: true },
                },
              },
            },
            property: {
              include: {
                organization: {
                  include: {
                    members: {
                      where: { role: 'OWNER' },
                      select: { userId: true },
                    },
                  },
                },
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                profileImage: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Create notifications for other participants
    const otherParticipants = new Set();
    
    // Add tenant group members
    issue.lease.tenantGroup.members.forEach((member) => {
      if (member.userId !== userId) {
        otherParticipants.add(member.userId);
      }
    });
    
    // Add landlord
    issue.lease.property.organization.members.forEach((member) => {
      if (member.userId !== userId) {
        otherParticipants.add(member.userId);
      }
    });

    // Create notifications
    const notificationPromises = Array.from(otherParticipants).map((participantId) =>
      prisma.notification.create({
        data: {
          userId: participantId,
          type: 'SYSTEM_ANNOUNCEMENT',
          entityId: issueId,
          title: 'Move-in issue status updated',
          body: `The status of move-in issue "${issue.title}" has been updated to ${status}`,
        },
      })
    );

    await Promise.all(notificationPromises);

    res.json({
      success: true,
      message: 'Issue status updated successfully',
      issue: updatedIssue,
    });
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({
      error: 'Failed to update issue status',
      message: 'An error occurred while updating the issue status',
    });
  }
};

/**
 * List move-in issues for a specific lease
 * GET /api/leases/:leaseId/move-in-issues
 */
export const listLeaseMoveInIssues = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const userId = req.user.id;

    // Find the lease and verify user authorization
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenantGroup: {
          include: {
            members: {
              select: { userId: true },
            },
          },
        },
        property: {
          include: {
            organization: {
              include: {
                members: {
                  where: { role: 'OWNER' },
                  select: { userId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!lease) {
      return res.status(404).json({
        error: 'Lease not found',
        message: 'The specified lease does not exist',
      });
    }

    // Check if user is authorized to view issues for this lease
    const isTenant = lease.tenantGroup.members.some(
      (member) => member.userId === userId
    );
    const isLandlord = lease.property.organization.members.some(
      (member) => member.userId === userId
    );
    const isAdmin = req.user.role === 'ADMIN';

    if (!isTenant && !isLandlord && !isAdmin) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You are not authorized to view issues for this lease',
      });
    }

    // Get all move-in issues for this lease
    const issues = await prisma.moveInIssue.findMany({
      where: { leaseId },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get only the latest comment for preview
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                profileImage: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      issues,
    });
  } catch (error) {
    console.error('List lease move-in issues error:', error);
    res.status(500).json({
      error: 'Failed to list move-in issues',
      message: 'An error occurred while fetching the issues',
    });
  }
};

/**
 * Admin decision on move-in issue
 * POST /api/move-in-issues/:issueId/admin-decision
 */
export const adminDecision = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { decision, notes, refundAmount } = req.body;
    const adminId = req.user.id;

    // Verify admin role
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Only administrators can make decisions on move-in issues',
      });
    }

    // Validate decision
    const validDecisions = ['ACCEPTED', 'REJECTED', 'ESCALATED'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({
        error: 'Invalid decision',
        message: 'Decision must be one of: ACCEPTED, REJECTED, ESCALATED',
      });
    }

    // Validate refund amount for ACCEPTED decisions
    if (decision === 'ACCEPTED' && (!refundAmount || refundAmount <= 0)) {
      return res.status(400).json({
        error: 'Invalid refund amount',
        message: 'Refund amount is required and must be greater than 0 for ACCEPTED decisions',
      });
    }

    // Find the move-in issue with related data
    const issue = await prisma.moveInIssue.findUnique({
      where: { id: issueId },
      include: {
        lease: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  select: { userId: true },
                },
              },
            },
            property: {
              include: {
                organization: {
                  include: {
                    members: {
                      where: { role: 'OWNER' },
                      select: { userId: true },
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
      return res.status(404).json({
        error: 'Move-in issue not found',
        message: 'The specified move-in issue does not exist',
      });
    }

    // Check if issue is already decided
    if (issue.adminDecision) {
      return res.status(400).json({
        error: 'Issue already decided',
        message: 'This issue has already been decided by an administrator',
      });
    }

    // Calculate property hold period (30 days from now)
    const propertyHoldUntil = new Date();
    propertyHoldUntil.setDate(propertyHoldUntil.getDate() + 30);

    // Update the issue with admin decision
    const updatedIssue = await prisma.moveInIssue.update({
      where: { id: issueId },
      data: {
        status: decision === 'ACCEPTED' ? 'ADMIN_APPROVED' : 
               decision === 'REJECTED' ? 'ADMIN_REJECTED' : 'ESCALATED',
        adminDecision: decision,
        adminDecisionAt: new Date(),
        adminDecisionBy: adminId,
        adminNotes: notes || null,
        refundAmount: decision === 'ACCEPTED' ? refundAmount : null,
        propertyHoldUntil: decision === 'ACCEPTED' ? propertyHoldUntil : null,
        updatedAt: new Date(),
      },
    });

    // If admin accepted the issue, perform automatic actions
    if (decision === 'ACCEPTED') {
      try {
        // 1. Cancel the rental request/lease
        await prisma.lease.update({
          where: { id: issue.leaseId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date(),
          },
        });

        // 2. Update property status to HOLD
        await prisma.property.update({
          where: { id: issue.lease.propertyId },
          data: {
            status: 'HOLD',
            updatedAt: new Date(),
          },
        });

        // 3. Create refund record (you'll need to implement this based on your payment system)
        // For now, we'll create a notification about the refund
        await prisma.notification.create({
          data: {
            userId: issue.lease.tenantGroup.members[0].userId,
            type: 'SYSTEM_ANNOUNCEMENT',
            entityId: issueId,
            title: 'Move-in issue approved - Refund processing',
            body: `Your move-in issue has been approved by an administrator. A refund of $${refundAmount} is being processed.`,
          },
        });

        // 4. Notify landlord about property hold
        issue.lease.property.organization.members.forEach(async (member) => {
          await prisma.notification.create({
            data: {
              userId: member.userId,
              type: 'SYSTEM_ANNOUNCEMENT',
              entityId: issueId,
              title: 'Property on hold - Update required',
              body: `Your property has been placed on hold until ${propertyHoldUntil.toLocaleDateString()}. Please update your property listing during this period.`,
            },
          });
        });

      } catch (error) {
        console.error('Error performing automatic actions:', error);
        // Continue with the response even if automatic actions fail
      }
    }

    // Create notifications for all participants
    const otherParticipants = new Set();
    
    // Add tenant group members
    issue.lease.tenantGroup.members.forEach((member) => {
      otherParticipants.add(member.userId);
    });
    
    // Add landlord
    issue.lease.property.organization.members.forEach((member) => {
      otherParticipants.add(member.userId);
    });

    // Create notifications
    const notificationPromises = Array.from(otherParticipants).map((participantId) =>
      prisma.notification.create({
        data: {
          userId: participantId,
          type: 'SYSTEM_ANNOUNCEMENT',
          entityId: issueId,
          title: `Admin decision: ${decision}`,
          body: `An administrator has made a decision on your move-in issue: ${decision}. ${notes ? `Notes: ${notes}` : ''}`,
        },
      })
    );

    await Promise.all(notificationPromises);

    res.json({
      success: true,
      message: `Move-in issue ${decision.toLowerCase()} successfully`,
      issue: updatedIssue,
    });
  } catch (error) {
    console.error('Admin decision error:', error);
    res.status(500).json({
      error: 'Failed to process admin decision',
      message: 'An error occurred while processing the decision',
    });
  }
};
