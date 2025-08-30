import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class OrganizationController {
  /**
   * Upgrades a user account to a business account by creating an organization
   * and migrating existing properties and assets from personal to business ownership.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.name - Organization name (required)
   * @param {string} [req.body.taxId] - Tax identification number
   * @param {string} [req.body.regNumber] - Business registration number
   * @param {string} req.body.address - Organization address (required)
   * @param {string} [req.body.signatureBase64] - Organization signature in base64 format
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with organization details and migration results
   * @throws {Error} 400 if required fields are missing or user already has business org
   * @throws {Error} 500 if database operations fail
   */
  async upgradeToBusinessAccount(req, res) {
    try {
      const userId = req.user.id;
      const { name, taxId, regNumber, address, signatureBase64 } = req.body;

      // Validate required fields
      if (!name || !address) {
        return res.status(400).json({
          success: false,
          message: 'Organization name and address are required',
        });
      }

      // Check if user already has an organization
      const existingMembership = await prisma.organizationMember.findFirst({
        where: { userId },
        include: { organization: true },
      });

      let personalOrgId = null;
      if (existingMembership) {
        if (existingMembership.organization?.isPersonal) {
          // User has a personal org; we will upgrade by creating a business org and migrating
          personalOrgId = existingMembership.organization.id;
        } else {
          // Already a business org member
          return res.status(400).json({
            success: false,
            message: 'User is already associated with a business organization',
            organization: existingMembership.organization,
          });
        }
      }

      // Resolve signature: prefer provided; else copy from user's saved signature
      let orgSignature = signatureBase64 || null;
      if (!orgSignature) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { signatureBase64: true },
        });
        if (user?.signatureBase64) {
          orgSignature = user.signatureBase64;
        }
      }

      // Create new organization
      const organization = await prisma.organization.create({
        data: {
          name,
          taxId: taxId || null,
          regNumber: regNumber || null,
          address,
          signatureBase64: orgSignature || null,
        },
      });

      // Add user as organization owner
      const organizationMember = await prisma.organizationMember.create({
        data: {
          userId,
          organizationId: organization.id,
          role: 'OWNER',
        },
      });

      // Find all properties currently owned by the user
      const userProperties = await prisma.property.findMany({
        where: { organizationId: null }, // Properties without organization
        include: {
          // Include any existing relationships that might need updating
          offers: true,
          matches: true,
        },
      });

      // Migrate properties to the new organization
      let migratedProperties = [];
      if (userProperties.length > 0) {
        for (const property of userProperties) {
          // Update property ownership
          await prisma.property.update({
            where: { id: property.id },
            data: { organizationId: organization.id },
          });

          // Update related offers if they exist
          if (property.offers && property.offers.length > 0) {
            for (const offer of property.offers) {
              await prisma.offer.update({
                where: { id: offer.id },
                data: { organizationId: organization.id },
              });
            }
          }

          // Update related matches if they exist
          if (property.matches && property.matches.length > 0) {
            for (const match of property.matches) {
              await prisma.landlordRequestMatch.update({
                where: { id: match.id },
                data: { organizationId: organization.id },
              });
            }
          }

          migratedProperties.push(property.id);
        }
      }

      // If user had a personal organization, migrate ALL assets from it to the new business organization
      if (personalOrgId) {
        // 1) Properties
        const personalProperties = await prisma.property.findMany({
          where: { organizationId: personalOrgId },
          select: { id: true },
        });
        if (personalProperties.length > 0) {
          await prisma.property.updateMany({
            where: { organizationId: personalOrgId },
            data: { organizationId: organization.id },
          });
          migratedProperties.push(...personalProperties.map((p) => p.id));
        }

        // 2) Offers (landlord side context)
        await prisma.offer.updateMany({
          where: { organizationId: personalOrgId },
          data: { organizationId: organization.id },
        });

        // 3) Landlord request matches
        await prisma.landlordRequestMatch.updateMany({
          where: { organizationId: personalOrgId },
          data: { organizationId: organization.id },
        });

        // 4) Leases (if any associated to organization as landlord)
        await prisma.lease.updateMany({
          where: { organizationId: personalOrgId },
          data: { organizationId: organization.id },
        });
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
                  role: true,
                },
              },
            },
          },
          properties: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              monthlyRent: true,
              status: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Successfully upgraded to business account',
        data: {
          organization: updatedOrganization,
          migratedProperties: migratedProperties.length,
          propertyIds: migratedProperties,
        },
      });
    } catch (error) {
      console.error('Error upgrading to business account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upgrade to business account',
        error: error.message,
      });
    }
  }

  /**
   * Retrieves organization details for the currently authenticated user.
   * Includes member information and property details.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with organization details
   * @throws {Error} 404 if user is not associated with any organization
   * @throws {Error} 500 if database operations fail
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
                      role: true,
                    },
                  },
                },
              },
              properties: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  monthlyRent: true,
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
          message: 'User is not associated with any organization',
        });
      }

      res.status(200).json({
        success: true,
        data: membership.organization,
      });
    } catch (error) {
      console.error('Error fetching organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization details',
        error: error.message,
      });
    }
  }

  /**
   * Retrieves all organizations in the system (admin only).
   * Includes member counts and property information for each organization.
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with all organizations
   * @throws {Error} 500 if database operations fail
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
                  role: true,
                },
              },
            },
          },
          properties: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              monthlyRent: true,
              status: true,
            },
          },
          _count: {
            select: {
              properties: true,
              members: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: organizations,
      });
    } catch (error) {
      console.error('Error fetching organizations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organizations',
        error: error.message,
      });
    }
  }

  /**
   * Updates organization details. Only owners and admins can perform updates.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.organizationId - Organization ID to update
   * @param {Object} req.body - Request body with update data
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with updated organization details
   * @throws {Error} 403 if user lacks permission to update organization
   * @throws {Error} 500 if database operations fail
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
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied. Only owners and admins can update organization details.',
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
                  role: true,
                },
              },
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: 'Organization updated successfully',
        data: updatedOrganization,
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update organization',
        error: error.message,
      });
    }
  }

  /**
   * Adds a new member to an organization. Only owners and admins can add members.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID of the person adding the member
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.organizationId - Organization ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.memberUserId - User ID to add as member
   * @param {string} [req.body.role='AGENT'] - Role for the new member
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with new member details
   * @throws {Error} 403 if user lacks permission to add members
   * @throws {Error} 400 if user is already a member
   * @throws {Error} 500 if database operations fail
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
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!currentMembership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only owners and admins can add members.',
        });
      }

      // Check if user is already a member
      const existingMembership = await prisma.organizationMember.findFirst({
        where: {
          userId: memberUserId,
          organizationId,
        },
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this organization',
        });
      }

      // Add new member
      const newMember = await prisma.organizationMember.create({
        data: {
          userId: memberUserId,
          organizationId,
          role,
        },
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
      });

      res.status(201).json({
        success: true,
        message: 'Member added successfully',
        data: newMember,
      });
    } catch (error) {
      console.error('Error adding organization member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add organization member',
        error: error.message,
      });
    }
  }

  /**
   * Removes a member from an organization. Only owners and admins can remove members.
   * Prevents removal of the last owner to maintain organization integrity.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - User ID of the person removing the member
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.organizationId - Organization ID
   * @param {string} req.params.memberUserId - User ID of the member to remove
   * @param {Object} res - Express response object
   * @returns {Object} JSON response confirming member removal
   * @throws {Error} 403 if user lacks permission to remove members
   * @throws {Error} 400 if attempting to remove the last owner
   * @throws {Error} 500 if database operations fail
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
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!currentMembership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only owners and admins can remove members.',
        });
      }

      // Prevent removing the last owner
      if (currentMembership.role === 'OWNER') {
        const ownerCount = await prisma.organizationMember.count({
          where: {
            organizationId,
            role: 'OWNER',
          },
        });

        if (ownerCount === 1) {
          const targetMember = await prisma.organizationMember.findFirst({
            where: {
              userId: memberUserId,
              organizationId,
            },
          });

          if (targetMember && targetMember.role === 'OWNER') {
            return res.status(400).json({
              success: false,
              message: 'Cannot remove the last owner of the organization',
            });
          }
        }
      }

      // Remove member
      await prisma.organizationMember.deleteMany({
        where: {
          userId: memberUserId,
          organizationId,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error) {
      console.error('Error removing organization member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove organization member',
        error: error.message,
      });
    }
  }
}

export default new OrganizationController();
