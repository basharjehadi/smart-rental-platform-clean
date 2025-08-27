import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class TenantGroupController {
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
        data: {
          name
        }
      });

      // Add user as primary member
      const groupMember = await prisma.tenantGroupMember.create({
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

      res.status(201).json({
        success: true,
        message: 'Tenant group created successfully',
        data: updatedTenantGroup
      });

    } catch (error) {
      console.error('Error creating tenant group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create tenant group',
        error: error.message
      });
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

      // Validate required fields
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required to send invitation'
        });
      }

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

      // Find user by email
      const invitedUser = await prisma.user.findUnique({
        where: { email }
      });

      if (!invitedUser) {
        return res.status(404).json({
          success: false,
          message: 'User with this email not found'
        });
      }

      // Check if user is already a member
      const existingMembership = await prisma.tenantGroupMember.findFirst({
        where: {
          userId: invitedUser.id,
          tenantGroupId
        }
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this tenant group'
        });
      }

      // Check if user already has a tenant group
      const userExistingGroup = await prisma.tenantGroupMember.findFirst({
        where: { userId: invitedUser.id }
      });

      if (userExistingGroup) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of another tenant group'
        });
      }

      // For now, we'll just return success without creating notifications
      // In a real implementation, you would:
      // 1. Create an invitation record in a separate Invitation model
      // 2. Send email notifications
      // 3. Create system notifications when the notification system supports tenant group invitations

      res.status(200).json({
        success: true,
        message: 'Invitation prepared successfully',
        data: {
          invitedUser: {
            id: invitedUser.id,
            name: invitedUser.name,
            email: invitedUser.email
          },
          tenantGroupId,
          message: message || null,
          note: 'Invitation system will be implemented with proper notification support'
        }
      });

    } catch (error) {
      console.error('Error inviting user to group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation',
        error: error.message
      });
    }
  }

  /**
   * Accept invitation to join tenant group
   * Adds user to the group
   */
  async acceptGroupInvitation(req, res) {
    try {
      const userId = req.user.id;
      const { tenantGroupId } = req.params;

      // Check if user already has a tenant group
      const existingMembership = await prisma.tenantGroupMember.findFirst({
        where: { userId }
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of a tenant group'
        });
      }

      // Verify the tenant group exists
      const tenantGroup = await prisma.tenantGroup.findUnique({
        where: { id: tenantGroupId }
      });

      if (!tenantGroup) {
        return res.status(404).json({
          success: false,
          message: 'Tenant group not found'
        });
      }

      // Add user to the tenant group
      const groupMember = await prisma.tenantGroupMember.create({
        data: {
          userId,
          tenantGroupId,
          isPrimary: false // New members are not primary by default
        }
      });

      // Get updated tenant group with all members
      const updatedTenantGroup = await prisma.tenantGroup.findUnique({
        where: { id: tenantGroupId },
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
        message: 'Successfully joined tenant group',
        data: updatedTenantGroup
      });

    } catch (error) {
      console.error('Error accepting group invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join tenant group',
        error: error.message
      });
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
                  profilePicture: true
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
                      profilePicture: true
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
                  monthlyRent: true,
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
                  monthlyRent: true,
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
