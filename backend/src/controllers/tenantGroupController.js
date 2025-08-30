import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
const prisma = new PrismaClient();

// Module-scoped helpers to avoid losing `this` in route handlers
/**
 * Ensures the tenant_group_invitations table exists in the database.
 * Creates the table if it doesn't exist to support invitation functionality.
 *
 * @returns {Promise<void>} Resolves when table is ready
 */
const ensureInvitationsTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS tenant_group_invitations (
      id TEXT PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      tenant_group_id TEXT NOT NULL,
      invited_user_id TEXT NOT NULL,
      inviter_user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE NULL
    );
  `);
};

/**
 * Generates a cryptographically secure random token for invitation links.
 *
 * @returns {string} 48-character hexadecimal token
 */
const generateToken = () => crypto.randomBytes(24).toString('hex');

class TenantGroupController {
  // class no longer needs generateToken

  /**
   * Creates a new tenant group and adds the current user as the primary member.
   * Prevents users from being members of multiple tenant groups simultaneously.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.name - Tenant group name (required)
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with created tenant group details
   * @throws {Error} 400 if name is missing or user already has a tenant group
   * @throws {Error} 500 if database operations fail
   */
  async createTenantGroup(req, res) {
    try {
      const userId = req.user.id;
      const { name } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Tenant group name is required',
        });
      }

      // Check if user already has a tenant group
      const existingMembership = await prisma.tenantGroupMember.findFirst({
        where: { userId },
        include: { tenantGroup: true },
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of a tenant group',
          tenantGroup: existingMembership.tenantGroup,
        });
      }

      // Create new tenant group
      const tenantGroup = await prisma.tenantGroup.create({
        data: { name },
      });

      // Add user as primary member
      await prisma.tenantGroupMember.create({
        data: {
          userId,
          tenantGroupId: tenantGroup.id,
          isPrimary: true,
        },
      });

      // Get updated tenant group with member details
      const updatedTenantGroup = await prisma.tenantGroup.findUnique({
        where: { id: tenantGroup.id },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Tenant group created successfully',
        data: updatedTenantGroup,
      });
    } catch (error) {
      console.error('Error creating tenant group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create tenant group',
        error: error.message,
      });
    }
  }

  /**
   * Invites a user to join a tenant group by email address.
   * Creates a unique invitation token and prevents duplicate pending invitations.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID of the inviter
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.tenantGroupId - Tenant group ID to invite to
   * @param {Object} req.body - Request body
   * @param {string} req.body.email - Email address of the user to invite (required)
   * @param {string} [req.body.message] - Optional invitation message
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with invitation details
   * @throws {Error} 400 if email is missing
   * @throws {Error} 403 if user is not a member of the tenant group
   * @throws {Error} 404 if invited user not found
   * @throws {Error} 400 if user is already a member
   * @throws {Error} 500 if database operations fail
   */
  async inviteUserToGroup(req, res) {
    try {
      const userId = req.user.id;
      const { tenantGroupId } = req.params;
      const { email, message } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required to send invitation',
        });
      }

      // Check membership
      const currentMembership = await prisma.tenantGroupMember.findFirst({
        where: { userId, tenantGroupId },
      });
      if (!currentMembership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this tenant group.',
        });
      }

      // Find user by email
      const invitedUser = await prisma.user.findUnique({ where: { email } });
      if (!invitedUser) {
        return res
          .status(404)
          .json({ success: false, message: 'User with this email not found' });
      }

      // Already member?
      const existingMembership = await prisma.tenantGroupMember.findFirst({
        where: { userId: invitedUser.id, tenantGroupId },
      });
      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this tenant group',
        });
      }

      // Ensure invitations table exists
      await ensureInvitationsTable();

      // Prevent duplicate pending invitations for the same group-user pair
      const existing = await prisma.$queryRawUnsafe(
        `SELECT token
           FROM tenant_group_invitations
          WHERE tenant_group_id = $1
            AND invited_user_id = $2
            AND status = 'PENDING'
          ORDER BY created_at DESC
          LIMIT 1`,
        tenantGroupId,
        invitedUser.id
      );

      if (Array.isArray(existing) && existing.length > 0) {
        const existingToken = existing[0].token;
        return res.status(200).json({
          success: true,
          message:
            'An invitation is already pending for this user. Reusing existing invite.',
          data: {
            token: existingToken,
            tenantGroupId,
            invitedUser: {
              id: invitedUser.id,
              name: invitedUser.name,
              email: invitedUser.email,
            },
            inviterUserId: userId,
            note: message || null,
          },
        });
      }

      // Create new pending invitation
      const token = generateToken();
      const id = generateToken();
      await prisma.$executeRawUnsafe(
        `INSERT INTO tenant_group_invitations (id, token, tenant_group_id, invited_user_id, inviter_user_id, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
        id,
        token,
        tenantGroupId,
        invitedUser.id,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Invitation created successfully',
        data: {
          token,
          tenantGroupId,
          invitedUser: {
            id: invitedUser.id,
            name: invitedUser.name,
            email: invitedUser.email,
          },
          inviterUserId: userId,
          note: message || null,
        },
      });
    } catch (error) {
      console.error('Error inviting user to group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation',
        error: error.message,
      });
    }
  }

  /**
   * Accepts an invitation to join a tenant group using a valid invitation token.
   * Adds the user to the group and removes the invitation from the database.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID accepting the invitation
   * @param {Object} req.body - Request body
   * @param {string} req.body.token - Invitation token (required)
   * @param {Object} res - Express response object
   * @returns {Object} JSON response confirming invitation acceptance
   * @throws {Error} 400 if token is missing
   * @throws {Error} 404 if invitation not found or already handled
   * @throws {Error} 403 if invitation is not for the current user
   * @throws {Error} 400 if invitation is not pending
   * @throws {Error} 500 if database operations fail
   */
  async acceptInvitationByToken(req, res) {
    try {
      const userId = req.user.id;
      const { token } = req.body;
      if (!token)
        return res
          .status(400)
          .json({ success: false, message: 'Token is required' });

      await ensureInvitationsTable();
      const invitation = await prisma.$queryRawUnsafe(
        `SELECT token, tenant_group_id AS "tenantGroupId", invited_user_id AS "invitedUserId", status
         FROM tenant_group_invitations WHERE token = $1 LIMIT 1`,
        token
      );
      const invite = Array.isArray(invitation) ? invitation[0] : null;
      if (!invite)
        return res.status(404).json({
          success: false,
          message: 'Invitation not found or already handled',
        });
      if (invite.invitedUserId !== userId)
        return res.status(403).json({
          success: false,
          message: 'This invitation is not for the current user',
        });
      if (invite.status !== 'PENDING')
        return res
          .status(400)
          .json({ success: false, message: 'Invitation is not pending' });

      // Check not already a member
      const existingMembership = await prisma.tenantGroupMember.findFirst({
        where: { userId, tenantGroupId: invite.tenantGroupId },
      });
      if (existingMembership) {
        await prisma.$executeRawUnsafe(
          `DELETE FROM tenant_group_invitations WHERE token = $1`,
          token
        );
        return res.status(200).json({
          success: true,
          message: 'Already a member. Invitation removed.',
        });
      }

      await prisma.tenantGroupMember.create({
        data: { userId, tenantGroupId: invite.tenantGroupId, isPrimary: false },
      });
      await prisma.$executeRawUnsafe(
        `DELETE FROM tenant_group_invitations WHERE token = $1`,
        token
      );

      const group = await prisma.tenantGroup.findUnique({
        where: { id: invite.tenantGroupId },
      });
      return res.status(200).json({
        success: true,
        message: 'Invitation accepted',
        data: { tenantGroup: group },
      });
    } catch (error) {
      console.error('Error accepting invitation by token:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to accept invitation',
        error: error.message,
      });
    }
  }

  /**
   * Declines an invitation to join a tenant group using a valid invitation token.
   * Removes the invitation from the database without adding the user to the group.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID declining the invitation
   * @param {Object} req.body - Request body
   * @param {string} req.body.token - Invitation token (required)
   * @param {Object} res - Express response object
   * @returns {Object} JSON response confirming invitation decline
   * @throws {Error} 400 if token is missing
   * @throws {Error} 404 if invitation not found
   * @throws {Error} 500 if database operations fail
   */
  async declineInvitationByToken(req, res) {
    try {
      const userId = req.user.id;
      const { token } = req.body;
      if (!token)
        return res
          .status(400)
          .json({ success: false, message: 'Token is required' });

      await ensureInvitationsTable();
      const invitation = await prisma.$queryRawUnsafe(
        `SELECT token, tenant_group_id AS "tenantGroupId", invited_user_id AS "invitedUserId", status
         FROM tenant_group_invitations WHERE token = $1 LIMIT 1`,
        token
      );
      const invite = Array.isArray(invitation) ? invitation[0] : null;
      if (!invite)
        return res.status(404).json({
          success: false,
          message: 'Invitation not found',
        });

      // Remove the invitation
      await prisma.$executeRawUnsafe(
        `DELETE FROM tenant_group_invitations WHERE token = $1`,
        token
      );

      return res.status(200).json({
        success: true,
        message: 'Invitation declined and removed',
      });
    } catch (error) {
      console.error('Error declining invitation by token:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to decline invitation',
        error: error.message,
      });
    }
  }

  /**
   * Lists all pending invitations for the current user.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with list of pending invitations
   * @throws {Error} 500 if database operations fail
   */
  async getMyInvitations(req, res) {
    try {
      const userId = req.user.id;
      await ensureInvitationsTable();
      const rows = await prisma.$queryRawUnsafe(
        `SELECT i.token,
                i.created_at AS "createdAt",
                tg.id AS "tenantGroupId",
                tg.name AS "groupName",
                u.id AS "inviterUserId",
                u.name AS "inviterName"
         FROM tenant_group_invitations i
         JOIN tenant_groups tg ON tg.id = i.tenant_group_id
         JOIN users u ON u.id = i.inviter_user_id
         WHERE i.invited_user_id = $1 AND i.status = 'PENDING'
         ORDER BY i.created_at DESC`,
        userId
      );
      return res.status(200).json({ success: true, invitations: rows });
    } catch (error) {
      console.error('Error fetching invitations:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch invitations',
        error: error.message,
      });
    }
  }

  /**
   * Accepts an invitation to join a tenant group (by group id) - legacy
   * This function is deprecated and should be replaced by acceptInvitationByToken.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.tenantGroupId - Tenant group ID to accept invitation for
   * @param {Object} res - Express response object
   * @returns {Object} JSON response confirming group acceptance
   * @throws {Error} 400 if user is already a member
   * @throws {Error} 404 if tenant group not found
   * @throws {Error} 500 if database operations fail
   */
  async acceptGroupInvitation(req, res) {
    try {
      const userId = req.user.id;
      const { tenantGroupId } = req.params;

      const existingMembership = await prisma.tenantGroupMember.findFirst({
        where: { userId },
      });
      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of a tenant group',
        });
      }

      const tenantGroup = await prisma.tenantGroup.findUnique({
        where: { id: tenantGroupId },
      });
      if (!tenantGroup) {
        return res
          .status(404)
          .json({ success: false, message: 'Tenant group not found' });
      }

      await prisma.tenantGroupMember.create({
        data: { userId, tenantGroupId, isPrimary: false },
      });

      const updatedTenantGroup = await prisma.tenantGroup.findUnique({
        where: { id: tenantGroupId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: 'Successfully joined tenant group',
        data: updatedTenantGroup,
      });
    } catch (error) {
      console.error('Error accepting group invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join tenant group',
        error: error.message,
      });
    }
  }

  /**
   * Views all members of a tenant group, including their roles and details.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.tenantGroupId - Tenant group ID to view members for
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with tenant group members
   * @throws {Error} 403 if user is not a member of the tenant group
   * @throws {Error} 404 if tenant group not found
   * @throws {Error} 500 if database operations fail
   */
  async getGroupMembers(req, res) {
    try {
      const userId = req.user.id;
      const { tenantGroupId } = req.params;

      // Check if current user is a member of this tenant group
      const currentMembership = await prisma.tenantGroupMember.findFirst({
        where: {
          userId,
          tenantGroupId,
        },
      });

      if (!currentMembership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this tenant group.',
        });
      }

      // Get tenant group with all members
      const tenantGroup = await prisma.tenantGroup.findUnique({
        where: { id: tenantGroupId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  phoneNumber: true,
                  profileImage: true,
                },
              },
            },
            orderBy: [
              { isPrimary: 'desc' }, // Primary members first
              { joinedAt: 'asc' }, // Then by join date
            ],
          },
        },
      });

      if (!tenantGroup) {
        return res.status(404).json({
          success: false,
          message: 'Tenant group not found',
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: tenantGroup.id,
          name: tenantGroup.name,
          description: tenantGroup.description,
          createdAt: tenantGroup.createdAt,
          members: tenantGroup.members,
        },
      });
    } catch (error) {
      console.error('Error fetching group members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch group members',
        error: error.message,
      });
    }
  }

  /**
   * Gets the current user's tenant group.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with current user's tenant group details
   * @throws {Error} 404 if user is not a member of any tenant group
   * @throws {Error} 500 if database operations fail
   */
  async getMyTenantGroup(req, res) {
    try {
      const userId = req.user.id;

      const membership = await prisma.tenantGroupMember.findFirst({
        where: { userId },
        include: {
          tenantGroup: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      role: true,
                      phoneNumber: true,
                      profileImage: true,
                    },
                  },
                },
                orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
              },
              rentalRequests: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  location: true,
                  budget: true,
                  status: true,
                  createdAt: true,
                },
              },
              offers: {
                select: {
                  id: true,
                  propertyId: true,
                  rentAmount: true,
                  status: true,
                  createdAt: true,
                },
              },
              leases: {
                select: {
                  id: true,
                  propertyId: true,
                  startDate: true,
                  endDate: true,
                  rentAmount: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'User is not a member of any tenant group',
        });
      }

      res.status(200).json({
        success: true,
        data: {
          membership: {
            id: membership.id,
            isPrimary: membership.isPrimary,
            joinedAt: membership.joinedAt,
          },
          tenantGroup: membership.tenantGroup,
        },
      });
    } catch (error) {
      console.error('Error fetching tenant group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tenant group details',
        error: error.message,
      });
    }
  }

  /**
   * Updates the details of a tenant group.
   * Only primary members can update group details.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.tenantGroupId - Tenant group ID to update
   * @param {Object} req.body - Request body
   * @param {Object} req.body - Updated data for the tenant group
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with updated tenant group details
   * @throws {Error} 403 if user is not a primary member
   * @throws {Error} 404 if tenant group not found
   * @throws {Error} 500 if database operations fail
   */
  async updateTenantGroup(req, res) {
    try {
      const userId = req.user.id;
      const { tenantGroupId } = req.params;
      const updateData = req.body;

      // Check if user is a primary member of this tenant group
      const membership = await prisma.tenantGroupMember.findFirst({
        where: {
          userId,
          tenantGroupId,
          isPrimary: true,
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied. Only primary members can update group details.',
        });
      }

      // Update tenant group
      const updatedTenantGroup = await prisma.tenantGroup.update({
        where: { id: tenantGroupId },
        data: updateData,
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: 'Tenant group updated successfully',
        data: updatedTenantGroup,
      });
    } catch (error) {
      console.error('Error updating tenant group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update tenant group',
        error: error.message,
      });
    }
  }

  /**
   * Allows a user to leave a tenant group.
   * Primary members cannot leave if they are the only primary.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.tenantGroupId - Tenant group ID to leave
   * @param {Object} res - Express response object
   * @returns {Object} JSON response confirming group leave
   * @throws {Error} 404 if user is not a member of the tenant group
   * @throws {Error} 400 if primary member cannot leave
   * @throws {Error} 500 if database operations fail
   */
  async leaveTenantGroup(req, res) {
    try {
      const userId = req.user.id;
      const { tenantGroupId } = req.params;

      // Check if user is a member of this tenant group
      const membership = await prisma.tenantGroupMember.findFirst({
        where: {
          userId,
          tenantGroupId,
        },
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'User is not a member of this tenant group',
        });
      }

      // If primary: allow leaving only if they are the sole member; in that case delete the group
      if (membership.isPrimary) {
        const [primaryCount, memberCount] = await Promise.all([
          prisma.tenantGroupMember.count({
            where: { tenantGroupId, isPrimary: true },
          }),
          prisma.tenantGroupMember.count({ where: { tenantGroupId } }),
        ]);

        if (memberCount > 1 && primaryCount === 1) {
          return res.status(400).json({
            success: false,
            message:
              'Cannot leave the group. You are the only primary member. Please transfer ownership first.',
          });
        }

        if (memberCount === 1) {
          // Delete membership and the empty group in a transaction
          await prisma.$transaction([
            prisma.tenantGroupMember.delete({ where: { id: membership.id } }),
            prisma.tenantGroup.delete({ where: { id: tenantGroupId } }),
          ]);

          return res.status(200).json({
            success: true,
            message: 'Group deleted and left successfully',
          });
        }
      }

      // Non-primary or multiple primaries: remove membership only
      await prisma.tenantGroupMember.delete({ where: { id: membership.id } });

      res
        .status(200)
        .json({ success: true, message: 'Successfully left the tenant group' });
    } catch (error) {
      console.error('Error leaving tenant group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to leave tenant group',
        error: error.message,
      });
    }
  }

  /**
   * Transfers primary membership to another member.
   * Current primary member can transfer their role.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.tenantGroupId - Tenant group ID to transfer primary membership for
   * @param {Object} req.body - Request body
   * @param {string} req.body.newPrimaryUserId - User ID of the new primary member (required)
   * @param {Object} res - Express response object
   * @returns {Object} JSON response confirming primary membership transfer
   * @throws {Error} 403 if current user is not a primary member
   * @throws {Error} 404 if target user is not a member of this tenant group
   * @throws {Error} 500 if database operations fail
   */
  async transferPrimaryMembership(req, res) {
    try {
      const userId = req.user.id;
      const { tenantGroupId } = req.params;
      const { newPrimaryUserId } = req.body;

      // Check if current user is a primary member
      const currentMembership = await prisma.tenantGroupMember.findFirst({
        where: {
          userId,
          tenantGroupId,
          isPrimary: true,
        },
      });

      if (!currentMembership) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied. Only primary members can transfer ownership.',
        });
      }

      // Check if new primary user is a member of this group
      const newPrimaryMembership = await prisma.tenantGroupMember.findFirst({
        where: {
          userId: newPrimaryUserId,
          tenantGroupId,
        },
      });

      if (!newPrimaryMembership) {
        return res.status(404).json({
          success: false,
          message: 'Target user is not a member of this tenant group',
        });
      }

      // Transfer primary membership
      await prisma.$transaction([
        // Remove primary from current user
        prisma.tenantGroupMember.update({
          where: { id: currentMembership.id },
          data: { isPrimary: false },
        }),
        // Make new user primary
        prisma.tenantGroupMember.update({
          where: { id: newPrimaryMembership.id },
          data: { isPrimary: true },
        }),
      ]);

      res.status(200).json({
        success: true,
        message: 'Primary membership transferred successfully',
      });
    } catch (error) {
      console.error('Error transferring primary membership:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to transfer primary membership',
        error: error.message,
      });
    }
  }
}

export default new TenantGroupController();
