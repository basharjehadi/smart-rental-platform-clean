import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
const prisma = new PrismaClient();

class TenantGroupController {
  // Helper to ensure invitations table exists (raw SQL to avoid schema migration)
  async ensureInvitationsTable() {
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
  }

  generateToken() {
    return crypto.randomBytes(24).toString('hex');
  }

  /**
   * Create a new tenant group
   * Creates group and adds current user as primary member
   */
  async createTenantGroup(req, res) {
    try {
      const userId = req.user.id;
      const { name } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Tenant group name is required'
        });
      }

      // Check if user already has a tenant group
      const existingMembership = await prisma.tenantGroupMember.findFirst({
        where: { userId },
        include: { tenantGroup: true }
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of a tenant group',
          tenantGroup: existingMembership.tenantGroup
        });
      }

      // Create new tenant group
      const tenantGroup = await prisma.tenantGroup.create({
        data: { name }
      });

      // Add user as primary member
      await prisma.tenantGroupMember.create({
        data: {
          userId,
          tenantGroupId: tenantGroup.id,
          isPrimary: true
        }
      });

      // Get updated tenant group with member details
      const updatedTenantGroup = await prisma.tenantGroup.findUnique({
        where: { id: tenantGroup.id },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } }
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Tenant group created successfully',
        data: updatedTenantGroup
      });

    } catch (error) {
      console.error('Error creating tenant group:', error);
      res.status(500).json({ success: false, message: 'Failed to create tenant group', error: error.message });
    }
  }

  /**
   * Invite user to tenant group by email
   * Creates invitation and sends notification
   */
  async inviteUserToGroup(req, res) {
    try {
      const userId = req.user.id;
      const { tenantGroupId } = req.params;
      const { email, message } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required to send invitation' });
      }

      // Check membership
      const currentMembership = await prisma.tenantGroupMember.findFirst({ where: { userId, tenantGroupId } });
      if (!currentMembership) {
        return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this tenant group.' });
      }

      // Find user by email
      const invitedUser = await prisma.user.findUnique({ where: { email } });
      if (!invitedUser) {
        return res.status(404).json({ success: false, message: 'User with this email not found' });
      }

      // Already member?
      const existingMembership = await prisma.tenantGroupMember.findFirst({ where: { userId: invitedUser.id, tenantGroupId } });
      if (existingMembership) {
        return res.status(400).json({ success: false, message: 'User is already a member of this tenant group' });
      }

      // Ensure invitations table exists
      await this.ensureInvitationsTable();

      // Create or reuse pending invitation
      const token = this.generateToken();
      const id = this.generateToken();
      await prisma.$executeRawUnsafe(
        `INSERT INTO tenant_group_invitations (id, token, tenant_group_id, invited_user_id, inviter_user_id, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
        id, token, tenantGroupId, invitedUser.id, userId
      );

      res.status(200).json({
        success: true,
        message: 'Invitation created successfully',
        data: {
          token,
          tenantGroupId,
          invitedUser: { id: invitedUser.id, name: invitedUser.name, email: invitedUser.email },
          inviterUserId: userId,
          note: message || null
        }
      });

    } catch (error) {
      console.error('Error inviting user to group:', error);
      res.status(500).json({ success: false, message: 'Failed to send invitation', error: error.message });
    }
  }

  /**
   * Accept invitation by token (adds user to group, removes invitation)
   */
  async acceptInvitationByToken(req, res) {
    try {
      const userId = req.user.id;
      const { token } = req.body;
      if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

      await this.ensureInvitationsTable();
      const invitation = await prisma.$queryRawUnsafe(
        `SELECT token, tenant_group_id AS "tenantGroupId", invited_user_id AS "invitedUserId", status
         FROM tenant_group_invitations WHERE token = $1 LIMIT 1`,
        token
      );
      const invite = Array.isArray(invitation) ? invitation[0] : null;
      if (!invite) return res.status(404).json({ success: false, message: 'Invitation not found or already handled' });
      if (invite.invitedUserId !== userId) return res.status(403).json({ success: false, message: 'This invitation is not for the current user' });
      if (invite.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Invitation is not pending' });

      // Check not already a member
      const existingMembership = await prisma.tenantGroupMember.findFirst({ where: { userId, tenantGroupId: invite.tenantGroupId } });
      if (existingMembership) {
        await prisma.$executeRawUnsafe(`DELETE FROM tenant_group_invitations WHERE token = $1`, token);
        return res.status(200).json({ success: true, message: 'Already a member. Invitation removed.' });
      }

      await prisma.tenantGroupMember.create({ data: { userId, tenantGroupId: invite.tenantGroupId, isPrimary: false } });
      await prisma.$executeRawUnsafe(`DELETE FROM tenant_group_invitations WHERE token = $1`, token);

      const group = await prisma.tenantGroup.findUnique({ where: { id: invite.tenantGroupId } });
      return res.status(200).json({ success: true, message: 'Invitation accepted', data: { tenantGroup: group } });
    } catch (error) {
      console.error('Error accepting invitation by token:', error);
      return res.status(500).json({ success: false, message: 'Failed to accept invitation', error: error.message });
    }
  }

  /**
   * Decline invitation by token (deletes the invitation)
   */
  async declineInvitationByToken(req, res) {
    try {
      const userId = req.user.id;
      const { token } = req.body;
      if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

      await this.ensureInvitationsTable();
      const invitation = await prisma.$queryRawUnsafe(
        `SELECT token, invited_user_id AS "invitedUserId" FROM tenant_group_invitations WHERE token = $1 LIMIT 1`,
        token
      );
      const invite = Array.isArray(invitation) ? invitation[0] : null;
      if (!invite) return res.status(404).json({ success: false, message: 'Invitation not found' });
      if (invite.invitedUserId !== userId) return res.status(403).json({ success: false, message: 'This invitation is not for the current user' });

      await prisma.$executeRawUnsafe(`DELETE FROM tenant_group_invitations WHERE token = $1`, token);
      return res.status(200).json({ success: true, message: 'Invitation declined' });
    } catch (error) {
      console.error('Error declining invitation by token:', error);
      return res.status(500).json({ success: false, message: 'Failed to decline invitation', error: error.message });
    }
  }

  /**
   * List pending invitations for current user
   */
  async getMyInvitations(req, res) {
    try {
      const userId = req.user.id;
      await this.ensureInvitationsTable();
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
      return res.status(500).json({ success: false, message: 'Failed to fetch invitations', error: error.message });
    }
  }

  /**
   * Accept invitation to join tenant group (by group id) - legacy
   */
  async acceptGroupInvitation(req, res) {
    try {
      const userId = req.user.id;
      const { tenantGroupId } = req.params;

      const existingMembership = await prisma.tenantGroupMember.findFirst({ where: { userId } });
      if (existingMembership) {
        return res.status(400).json({ success: false, message: 'User is already a member of a tenant group' });
      }

      const tenantGroup = await prisma.tenantGroup.findUnique({ where: { id: tenantGroupId } });
      if (!tenantGroup) {
        return res.status(404).json({ success: false, message: 'Tenant group not found' });
      }

      await prisma.tenantGroupMember.create({ data: { userId, tenantGroupId, isPrimary: false } });

      const updatedTenantGroup = await prisma.tenantGroup.findUnique({
        where: { id: tenantGroupId },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } }
            }
          }
        }
      });

      res.status(200).json({ success: true, message: 'Successfully joined tenant group', data: updatedTenantGroup });

    } catch (error) {
      console.error('Error accepting group invitation:', error);
      res.status(500).json({ success: false, message: 'Failed to join tenant group', error: error.message });
    }
  }

  /**
   * View members of a tenant group
   * Shows all members with their roles and details
   */
  async getGroupMembers(req, res) {
    try {
      const userId = req.user.id;
      const { tenantGroupId } = req.params;

      // Check if current user is a member of this tenant group
      const currentMembership = await prisma.tenantGroupMember.findFirst({
        where: {
          userId,
          tenantGroupId
        }
      });

      if (!currentMembership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this tenant group.'
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
                  profileImage: true
                }
              }
            },
            orderBy: [
              { isPrimary: 'desc' }, // Primary members first
              { joinedAt: 'asc' }     // Then by join date
            ]
          }
        }
      });

      if (!tenantGroup) {
        return res.status(404).json({
          success: false,
          message: 'Tenant group not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: tenantGroup.id,
          name: tenantGroup.name,
          description: tenantGroup.description,
          createdAt: tenantGroup.createdAt,
          members: tenantGroup.members
        }
      });

    } catch (error) {
      console.error('Error fetching group members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch group members',
        error: error.message
      });
    }
  }

  /**
   * Get current user's tenant group
   * Shows the group the user belongs to
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
                      profileImage: true
                    }
                  }
                },
                orderBy: [
                  { isPrimary: 'desc' },
                  { joinedAt: 'asc' }
                ]
              },
              rentalRequests: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  location: true,
                  budget: true,
                  status: true,
                  createdAt: true
                }
              },
              offers: {
                select: {
                  id: true,
                  propertyId: true,
                  rentAmount: true,
                  status: true,
                  createdAt: true
                }
              },
              leases: {
                select: {
                  id: true,
                  propertyId: true,
                  startDate: true,
                  endDate: true,
                  rentAmount: true,
                  status: true,
                  createdAt: true
                }
              }
            }
          }
        }
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'User is not a member of any tenant group'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          membership: {
            id: membership.id,
            isPrimary: membership.isPrimary,
            joinedAt: membership.joinedAt
          },
          tenantGroup: membership.tenantGroup
        }
      });

    } catch (error) {
      console.error('Error fetching tenant group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tenant group details',
        error: error.message
      });
    }
  }

  /**
   * Update tenant group details
   * Only primary members can update group details
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
          isPrimary: true
        }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only primary members can update group details.'
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
                  role: true
                }
              }
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Tenant group updated successfully',
        data: updatedTenantGroup
      });

    } catch (error) {
      console.error('Error updating tenant group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update tenant group',
        error: error.message
      });
    }
  }

  /**
   * Leave tenant group
   * User can leave the group (primary members can't leave if they're the only primary)
   */
  async leaveTenantGroup(req, res) {
    try {
      const userId = req.user.id;
      const { tenantGroupId } = req.params;

      // Check if user is a member of this tenant group
      const membership = await prisma.tenantGroupMember.findFirst({
        where: {
          userId,
          tenantGroupId
        }
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'User is not a member of this tenant group'
        });
      }

      // Prevent primary members from leaving if they're the only primary
      if (membership.isPrimary) {
        const primaryMemberCount = await prisma.tenantGroupMember.count({
          where: {
            tenantGroupId,
            isPrimary: true
          }
        });

        if (primaryMemberCount === 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot leave the group. You are the only primary member. Please transfer ownership or delete the group.'
          });
        }
      }

      // Remove user from the group
      await prisma.tenantGroupMember.delete({
        where: { id: membership.id }
      });

      res.status(200).json({
        success: true,
        message: 'Successfully left the tenant group'
      });

    } catch (error) {
      console.error('Error leaving tenant group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to leave tenant group',
        error: error.message
      });
    }
  }

  /**
   * Transfer primary membership to another member
   * Current primary member can transfer their role
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
          isPrimary: true
        }
      });

      if (!currentMembership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only primary members can transfer ownership.'
        });
      }

      // Check if new primary user is a member of this group
      const newPrimaryMembership = await prisma.tenantGroupMember.findFirst({
        where: {
          userId: newPrimaryUserId,
          tenantGroupId
        }
      });

      if (!newPrimaryMembership) {
        return res.status(404).json({
          success: false,
          message: 'Target user is not a member of this tenant group'
        });
      }

      // Transfer primary membership
      await prisma.$transaction([
        // Remove primary from current user
        prisma.tenantGroupMember.update({
          where: { id: currentMembership.id },
          data: { isPrimary: false }
        }),
        // Make new user primary
        prisma.tenantGroupMember.update({
          where: { id: newPrimaryMembership.id },
          data: { isPrimary: true }
        })
      ]);

      res.status(200).json({
        success: true,
        message: 'Primary membership transferred successfully'
      });

    } catch (error) {
      console.error('Error transferring primary membership:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to transfer primary membership',
        error: error.message
      });
    }
  }
}

export default new TenantGroupController();
