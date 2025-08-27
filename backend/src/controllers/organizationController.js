import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class OrganizationController {
  /**
   * Upgrade user account to business account
   * Creates organization and migrates existing properties
   */
  async upgradeToBusinessAccount(req, res) {
    try {
      const userId = req.user.id;
      const {
        name,
        taxId,
        regNumber,
        address,
        signatureBase64
      } = req.body;

      // Validate required fields
      if (!name || !address) {
        return res.status(400).json({
          success: false,
          message: 'Organization name and address are required'
        });
      }

      // Check if user already has an organization
      const existingMembership = await prisma.organizationMember.findFirst({
        where: { userId },
        include: { organization: true }
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: 'User is already associated with an organization',
          organization: existingMembership.organization
        });
      }

      // Create new organization
      const organization = await prisma.organization.create({
        data: {
          name,
          taxId: taxId || null,
          regNumber: regNumber || null,
          address,
          signatureBase64: signatureBase64 || null
        }
      });

      // Add user as organization owner
      const organizationMember = await prisma.organizationMember.create({
        data: {
          userId,
          organizationId: organization.id,
          role: 'OWNER'
        }
      });

      // Find all properties currently owned by the user
      const userProperties = await prisma.property.findMany({
        where: { organizationId: null }, // Properties without organization
        include: {
          // Include any existing relationships that might need updating
          offers: true,
          matches: true
        }
      });

      // Migrate properties to the new organization
      let migratedProperties = [];
      if (userProperties.length > 0) {
        for (const property of userProperties) {
          // Update property ownership
          await prisma.property.update({
            where: { id: property.id },
            data: { organizationId: organization.id }
          });

          // Update related offers if they exist
          if (property.offers && property.offers.length > 0) {
            for (const offer of property.offers) {
              await prisma.offer.update({
                where: { id: offer.id },
                data: { organizationId: organization.id }
              });
            }
          }

          // Update related matches if they exist
          if (property.matches && property.matches.length > 0) {
            for (const match of property.matches) {
              await prisma.landlordRequestMatch.update({
                where: { id: match.id },
                data: { organizationId: organization.id }
              });
            }
          }

          migratedProperties.push(property.id);
        }
      }

      // Get updated organization with member details
      const updatedOrganization = await prisma.organization.findUnique({
        where: { id: organization.id },
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
          },
          properties: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              monthlyRent: true,
              status: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Successfully upgraded to business account',
        data: {
          organization: updatedOrganization,
          migratedProperties: migratedProperties.length,
          propertyIds: migratedProperties
        }
      });

    } catch (error) {
      console.error('Error upgrading to business account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upgrade to business account',
        error: error.message
      });
    }
  }

  /**
   * Get organization details for the current user
   */
  async getMyOrganization(req, res) {
    try {
      const userId = req.user.id;

      const membership = await prisma.organizationMember.findFirst({
        where: { userId },
        include: {
          organization: {
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
              },
              properties: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
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
          message: 'User is not associated with any organization'
        });
      }

      res.status(200).json({
        success: true,
        data: membership.organization
      });

    } catch (error) {
      console.error('Error fetching organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization details',
        error: error.message
      });
    }
  }

  /**
   * Get all organizations (admin only)
   */
  async getAllOrganizations(req, res) {
    try {
      const organizations = await prisma.organization.findMany({
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
          },
          properties: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              monthlyRent: true,
              status: true
            }
          },
          _count: {
            select: {
              properties: true,
              members: true
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        data: organizations
      });

    } catch (error) {
      console.error('Error fetching organizations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organizations',
        error: error.message
      });
    }
  }

  /**
   * Update organization details
   */
  async updateOrganization(req, res) {
    try {
      const userId = req.user.id;
      const { organizationId } = req.params;
      const updateData = req.body;

      // Check if user is a member of this organization
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId,
          organizationId,
          role: { in: ['OWNER', 'ADMIN'] }
        }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only owners and admins can update organization details.'
        });
      }

      // Update organization
      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
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
        message: 'Organization updated successfully',
        data: updatedOrganization
      });

    } catch (error) {
      console.error('Error updating organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update organization',
        error: error.message
      });
    }
  }

  /**
   * Add member to organization
   */
  async addOrganizationMember(req, res) {
    try {
      const userId = req.user.id;
      const { organizationId } = req.params;
      const { memberUserId, role = 'AGENT' } = req.body;

      // Check if current user is owner or admin
      const currentMembership = await prisma.organizationMember.findFirst({
        where: {
          userId,
          organizationId,
          role: { in: ['OWNER', 'ADMIN'] }
        }
      });

      if (!currentMembership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only owners and admins can add members.'
        });
      }

      // Check if user is already a member
      const existingMembership = await prisma.organizationMember.findFirst({
        where: {
          userId: memberUserId,
          organizationId
        }
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this organization'
        });
      }

      // Add new member
      const newMember = await prisma.organizationMember.create({
        data: {
          userId: memberUserId,
          organizationId,
          role
        },
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
      });

      res.status(201).json({
        success: true,
        message: 'Member added successfully',
        data: newMember
      });

    } catch (error) {
      console.error('Error adding organization member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add organization member',
        error: error.message
      });
    }
  }

  /**
   * Remove member from organization
   */
  async removeOrganizationMember(req, res) {
    try {
      const userId = req.user.id;
      const { organizationId, memberUserId } = req.params;

      // Check if current user is owner or admin
      const currentMembership = await prisma.organizationMember.findFirst({
        where: {
          userId,
          organizationId,
          role: { in: ['OWNER', 'ADMIN'] }
        }
      });

      if (!currentMembership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only owners and admins can remove members.'
        });
      }

      // Prevent removing the last owner
      if (currentMembership.role === 'OWNER') {
        const ownerCount = await prisma.organizationMember.count({
          where: {
            organizationId,
            role: 'OWNER'
          }
        });

        if (ownerCount === 1) {
          const targetMember = await prisma.organizationMember.findFirst({
            where: {
              userId: memberUserId,
              organizationId
            }
          });

          if (targetMember && targetMember.role === 'OWNER') {
            return res.status(400).json({
              success: false,
              message: 'Cannot remove the last owner of the organization'
            });
          }
        }
      }

      // Remove member
      await prisma.organizationMember.deleteMany({
        where: {
          userId: memberUserId,
          organizationId
        }
      });

      res.status(200).json({
        success: true,
        message: 'Member removed successfully'
      });

    } catch (error) {
      console.error('Error removing organization member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove organization member',
        error: error.message
      });
    }
  }
}

export default new OrganizationController();
