import { PrismaClient } from '@prisma/client';
import { computeVerificationDeadline } from '../services/moveInVerificationService.js';
import { applyAdminDecision } from '../services/moveInDecisionService.js';

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

    if (!isTenant && !isLandlord) {
      return res.status(403).json({
        error: 'Not allowed',
        message: 'Only participants can comment on this issue',
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

    if (!isTenant && !isLandlord) {
      return res.status(403).json({
        error: 'Not allowed',
        message: 'Only participants can view this issue',
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
      const { offerId, title, description } = req.body;
      const userId = req.user.id;

      // Handle file uploads for initial issue creation
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

  if (!offerId || !title || !description) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Offer ID, title, and description are required',
    });
  }

    // Find the offer and verify user authorization
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
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
        leases: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!offer) {
      return res.status(404).json({
        error: 'Offer not found',
        message: 'The specified offer does not exist',
      });
    }

    // Check if user is authorized to create an issue for this offer
    const isTenant = offer.tenantGroup.members.some(
      (member) => member.userId === userId
    );
    const isLandlord = offer.property?.organization.members.some(
      (member) => member.userId === userId
    );

    if (!isTenant && !isLandlord) {
      return res.status(403).json({
        error: 'Not allowed',
        message: 'Only participants can create issues for this offer',
      });
    }

    // Validate move-in window
    if (!offer.leaseStartDate) {
      return res.status(400).json({
        error: 'Move-in date not set',
        message: 'Cannot create move-in issue: move-in date has not been set for this offer',
      });
    }

    const now = new Date();
    const windowClose = computeVerificationDeadline(offer.leaseStartDate);

    if (now < offer.leaseStartDate) {
      return res.status(400).json({
        error: 'Issue window not open yet',
        message: 'Cannot create move-in issue: the move-in window has not opened yet',
      });
    }

    if (now >= windowClose) {
      return res.status(400).json({
        error: 'Issue window closed',
        message: 'Cannot create move-in issue: the move-in window has already closed',
      });
    }

    // Get or create a lease for this offer
    let lease = offer.leases[0];
    
    if (!lease) {
      console.log('🔍 No existing lease found, creating new lease for offer:', offerId);
      
      // First, check if a unit exists for this property, create one if it doesn't
      let unit = await prisma.unit.findFirst({
        where: { propertyId: offer.propertyId }
      });
      
      if (!unit) {
        console.log('🔍 No unit found for property, creating default unit');
        // Create a default unit for the property
        unit = await prisma.unit.create({
          data: {
            unitNumber: '1', // Default unit number
            floor: 1, // Default floor
            bedrooms: offer.property?.bedrooms || 1,
            bathrooms: offer.property?.bathrooms || 1,
            area: offer.property?.size || 50, // Default area
            rentAmount: offer.rentAmount,
            status: 'OCCUPIED', // Since it's being leased
            propertyId: offer.propertyId,
          },
        });
        console.log('✅ Created unit:', unit.id);
      } else {
        console.log('✅ Found existing unit:', unit.id);
      }
      
      // Create a lease linked to the unit
      lease = await prisma.lease.create({
        data: {
          startDate: offer.availableFrom,
          endDate: new Date(new Date(offer.availableFrom).getTime() + offer.leaseDuration * 30 * 24 * 60 * 60 * 1000), // Add months
          rentAmount: offer.rentAmount,
          depositAmount: offer.depositAmount || offer.rentAmount,
          status: 'ACTIVE',
          offerId: offer.id,
          propertyId: offer.propertyId,
          tenantGroupId: offer.tenantGroupId,
          organizationId: offer.organizationId,
          unitId: unit.id, // Link to the unit
        },
      });
      console.log('✅ Created lease:', lease.id, 'linked to unit:', unit.id);
    } else {
      console.log('✅ Using existing lease:', lease.id);
    }

    // Check if there's already an open move-in issue for this lease
    const existingOpenIssue = await prisma.moveInIssue.findFirst({
      where: { 
        leaseId: lease.id, 
        status: { in: ['OPEN', 'IN_PROGRESS'] } 
      }
    });

    if (existingOpenIssue) {
      console.log('🔄 Found existing open issue:', existingOpenIssue.id, 'reusing instead of creating new one');
      return res.status(200).json({
        success: true,
        issueId: existingOpenIssue.id,
        reused: true,
        message: 'An open move-in issue already exists for this lease',
        issue: existingOpenIssue
      });
    }

    // Create the move-in issue
    const moveInIssue = await prisma.moveInIssue.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        leaseId: lease.id,
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

    // Create initial comment with evidence if files were uploaded
    if (evidence.length > 0) {
      await prisma.moveInIssueComment.create({
        data: {
          content: `Issue reported with evidence: ${evidence.length} file(s)`,
          evidence,
          evidenceType,
          authorId: userId,
          issueId: moveInIssue.id,
        },
      });
    }

    // Create notifications for other participants
    const otherParticipants = new Set();
    
    // Add tenant group members
    offer.tenantGroup.members.forEach((member) => {
      if (member.userId !== userId) {
        otherParticipants.add(member.userId);
      }
    });
    
    // Add landlord
    if (offer.property?.organization?.members) {
      offer.property.organization.members.forEach((member) => {
        if (member.userId !== userId) {
          otherParticipants.add(member.userId);
        }
      });
    }

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

    if (!isTenant && !isLandlord) {
      return res.status(403).json({
        error: 'Not allowed',
        message: 'Only participants can update this issue',
      });
    }

    // Role-based status transition control
    const currentStatus = issue.status;
    
    // Check if user is admin (for RESOLVED/CLOSED statuses)
    const isAdmin = req.user.role === 'ADMIN';
    
    // Tenants: cannot change status (only comment)
    if (isTenant) {
      return res.status(403).json({
        error: 'Not allowed',
        message: 'Tenants cannot change issue status',
      });
    }
    
    // Landlords: can only set IN_PROGRESS
    if (isLandlord && !isAdmin) {
      if (status !== 'IN_PROGRESS') {
        return res.status(403).json({
          error: 'Not allowed',
          message: 'Landlords can only mark issues as IN_PROGRESS',
        });
      }
      // Only allow transition from OPEN to IN_PROGRESS
      if (currentStatus !== 'OPEN') {
        return res.status(403).json({
          error: 'Not allowed',
          message: 'Can only mark OPEN issues as IN_PROGRESS',
        });
      }
    }
    
    // Admin: can set RESOLVED or CLOSED (final statuses)
    if (status === 'RESOLVED' || status === 'CLOSED') {
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Not allowed',
          message: 'Only admins can resolve or close issues',
        });
      }
      // Set resolvedAt and resolvedByUserId for final statuses
      const updateData = { 
        status,
        updatedAt: new Date(),
        resolvedAt: new Date(),
        resolvedByUserId: userId,
      };
      
      // Update the issue status
      const updatedIssue = await prisma.moveInIssue.update({
        where: { id: issueId },
        data: updateData,
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

      // Create notifications for all participants
      const allParticipants = new Set();
      
      // Add tenant group members
      issue.lease.tenantGroup.members.forEach((member) => {
        allParticipants.add(member.userId);
      });
      
      // Add landlord
      issue.lease.property.organization.members.forEach((member) => {
        allParticipants.add(member.userId);
      });

      // Create notifications
      const notificationPromises = Array.from(allParticipants).map((participantId) =>
        prisma.notification.create({
          data: {
            userId: participantId,
            type: 'SYSTEM_ANNOUNCEMENT',
            entityId: issueId,
            title: 'Move-in issue resolved',
            body: `The move-in issue "${issue.title}" has been ${status.toLowerCase()}`,
          },
        })
      );

      await Promise.all(notificationPromises);

      return res.json({
        success: true,
        message: `Issue ${status.toLowerCase()} successfully`,
        issue: updatedIssue,
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

    if (!isTenant && !isLandlord) {
      return res.status(403).json({
        error: 'Not allowed',
        message: 'Only participants can view issues for this lease',
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

    // Verify admin role (route already uses requireAdmin middleware, but verify here too)
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Not allowed',
        message: 'Only administrators can make decisions on move-in issues',
      });
    }

    // Validate decision
    const validDecisions = ['ACCEPTED', 'REJECTED', 'ESCALATED', 'RESOLVED_APPROVED', 'RESOLVED_REJECTED', 'APPROVE', 'REJECT'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({
        error: 'Invalid decision',
        message: 'Decision must be one of: ACCEPTED, REJECTED, ESCALATED, RESOLVED_APPROVED, RESOLVED_REJECTED, APPROVE, REJECT',
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
               decision === 'REJECTED' ? 'ADMIN_REJECTED' : 
               decision === 'RESOLVED_APPROVED' ? 'RESOLVED' :
               decision === 'RESOLVED_REJECTED' ? 'CLOSED' : 
               decision === 'APPROVE' ? 'RESOLVED' :
               decision === 'REJECT' ? 'CLOSED' : 'ESCALATED',
        adminDecision: decision,
        adminDecisionAt: new Date(),
        adminDecisionBy: adminId,
        adminNotes: notes || null,
        refundAmount: decision === 'ACCEPTED' ? refundAmount : null,
        propertyHoldUntil: decision === 'ACCEPTED' ? propertyHoldUntil : null,
        updatedAt: new Date(),
      },
    });

    // Apply business logic for admin decision
    try {
      const businessLogicResult = await applyAdminDecision({
        issueId,
        decision,
        adminId,
        notes: notes || '',
      });
      console.log('✅ Business logic applied successfully:', businessLogicResult);
    } catch (error) {
      console.error('❌ Error applying business logic:', error);
      // Continue with notifications even if business logic fails
      // The issue status has already been updated
    }

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

/**
 * Request admin review for a move-in issue
 * POST /api/move-in-issues/:issueId/request-admin-review
 */
export const requestAdminReview = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

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

    // Check if user is a tenant member
    const isTenant = issue.lease.tenantGroup.members.some(
      (member) => member.userId === userId
    );

    if (!isTenant) {
      return res.status(403).json({
        error: 'Not allowed',
        message: 'Only tenants can request admin review',
      });
    }

    // Create a comment with admin review request tag
    const comment = await prisma.moveInIssueComment.create({
      data: {
        content: `[ADMIN_REVIEW_REQUEST] ${reason || 'Requesting administrator review of this issue'}`,
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

    // Create notification for admins (you may want to implement admin notification system)
    // For now, we'll create a system notification
    await prisma.notification.create({
      data: {
        userId: userId, // Notify the requesting tenant
        type: 'SYSTEM_ANNOUNCEMENT',
        entityId: issueId,
        title: 'Admin review requested',
        body: 'Your request for admin review has been submitted. An administrator will review your issue soon.',
      },
    });

    res.json({
      success: true,
      message: 'Admin review requested successfully',
      comment,
    });
  } catch (error) {
    console.error('Request admin review error:', error);
    res.status(500).json({
      error: 'Failed to request admin review',
      message: 'An error occurred while requesting admin review',
    });
  }
};

/**
 * Get move-in issues for admin review (paginated)
 * GET /api/admin/move-in/issues
 */
export const getAdminMoveInIssues = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause for status filtering
    const whereClause = {};
    if (status && ['OPEN', 'ESCALATED'].includes(status)) {
      whereClause.status = status;
    } else {
      // Default to both statuses if none specified
      whereClause.status = { in: ['OPEN', 'ESCALATED'] };
    }

    // Get issues with pagination
    const [issues, total] = await Promise.all([
      prisma.moveInIssue.findMany({
        where: whereClause,
        include: {
          lease: {
            include: {
              tenantGroup: {
                include: {
                  members: {
                    select: {
                      user: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          email: true,
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
                  address: true,
                },
                organization: {
                  select: {
                    id: true,
                    name: true,
                    members: {
                      where: { role: 'OWNER' },
                      select: {
                        user: {
                          select: {
                            id: true,
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
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limitNum,
      }),
      prisma.moveInIssue.count({ where: whereClause }),
    ]);

    // Format the response
    const formattedIssues = issues.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      tenant: issue.lease.tenantGroup.members[0]?.user || null,
      landlord: issue.lease.property.organization.members[0]?.user || null,
      property: issue.lease.property,
      lastCommentAt: issue.comments[0]?.createdAt || null,
    }));

    return res.json({
      success: true,
      data: {
        issues: formattedIssues,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error getting admin move-in issues:', error);
    return res.status(500).json({
      error: 'Failed to get admin move-in issues',
      message: 'An error occurred while fetching the issues',
    });
  }
};
