import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { canSubmitReview } from '../../src/middleware/reviews/canSubmitReview';

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    lease: {
      findUnique: vi.fn(),
    },
  })),
}));

import { PrismaClient } from '@prisma/client';

const mockPrisma = new PrismaClient() as any;

describe('canSubmitReview Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: { leaseId: 'lease-123' },
      user: {
        id: 'user-123',
        role: 'TENANT',
      },
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Parameter Validation', () => {
    it('should return 400 if leaseId is missing', async () => {
      delete mockRequest.params.leaseId;

      await canSubmitReview(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Lease ID is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Lease Existence', () => {
    it('should return 404 if lease does not exist', async () => {
      mockPrisma.lease.findUnique.mockResolvedValue(null);

      await canSubmitReview(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Lease not found',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Lease Status Validation', () => {
    it('should return 403 if lease is not active', async () => {
      const mockLease = {
        id: 'lease-123',
        status: 'EXPIRED',
        startDate: new Date('2024-01-01'),
        tenantGroup: { members: [] },
        organization: { members: [] },
        payments: [],
      };

      mockPrisma.lease.findUnique.mockResolvedValue(mockLease);

      await canSubmitReview(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Cannot submit review for inactive lease',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Lease Start Date Validation', () => {
    it('should return 403 if lease start date is in the future', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const mockLease = {
        id: 'lease-123',
        status: 'ACTIVE',
        startDate: futureDate,
        tenantGroup: { members: [] },
        organization: { members: [] },
        payments: [],
      };

      mockPrisma.lease.findUnique.mockResolvedValue(mockLease);

      await canSubmitReview(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Cannot submit review before lease start date',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Payment Validation', () => {
    it('should return 403 if lease has no successful payments', async () => {
      const mockLease = {
        id: 'lease-123',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        tenantGroup: { members: [] },
        organization: { members: [] },
        payments: [], // No payments
      };

      mockPrisma.lease.findUnique.mockResolvedValue(mockLease);

      await canSubmitReview(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Cannot submit review for lease without platform payments',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow review if lease has successful payments', async () => {
      const mockLease = {
        id: 'lease-123',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        tenantGroup: {
          members: [
            {
              user: {
                id: 'user-123',
                role: 'TENANT',
              },
            },
          ],
        },
        organization: { members: [] },
        payments: [{ status: 'SUCCEEDED' }], // Has successful payment
      };

      mockPrisma.lease.findUnique.mockResolvedValue(mockLease);

      await canSubmitReview(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.lease).toBeDefined();
      expect(mockRequest.userRoleInLease).toBe('TENANT');
    });
  });

  describe('User Role Validation', () => {
    it('should return 403 if user is not a tenant or landlord in the lease', async () => {
      const mockLease = {
        id: 'lease-123',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        tenantGroup: {
          members: [
            {
              user: {
                id: 'other-user',
                role: 'TENANT',
              },
            },
          ],
        },
        organization: {
          members: [
            {
              user: {
                id: 'other-landlord',
                role: 'LANDLORD',
              },
            },
          ],
        },
        payments: [{ status: 'SUCCEEDED' }],
      };

      mockPrisma.lease.findUnique.mockResolvedValue(mockLease);

      await canSubmitReview(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          'User must be a tenant or landlord in the lease to submit a review',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow tenant to submit review', async () => {
      const mockLease = {
        id: 'lease-123',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        tenantGroup: {
          members: [
            {
              user: {
                id: 'user-123',
                role: 'TENANT',
              },
            },
          ],
        },
        organization: { members: [] },
        payments: [{ status: 'SUCCEEDED' }],
      };

      mockPrisma.lease.findUnique.mockResolvedValue(mockLease);

      await canSubmitReview(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.userRoleInLease).toBe('TENANT');
    });

    it('should allow landlord to submit review', async () => {
      mockRequest.user.role = 'LANDLORD';

      const mockLease = {
        id: 'lease-123',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        tenantGroup: { members: [] },
        organization: {
          members: [
            {
              user: {
                id: 'user-123',
                role: 'LANDLORD',
              },
            },
          ],
        },
        payments: [{ status: 'SUCCEEDED' }],
      };

      mockPrisma.lease.findUnique.mockResolvedValue(mockLease);

      await canSubmitReview(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.userRoleInLease).toBe('LANDLORD');
    });
  });

  describe('Success Case', () => {
    it('should call next() and add lease data to request when all validations pass', async () => {
      const mockLease = {
        id: 'lease-123',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        tenantGroup: {
          members: [
            {
              user: {
                id: 'user-123',
                role: 'TENANT',
              },
            },
          ],
        },
        organization: { members: [] },
        payments: [{ status: 'SUCCEEDED' }],
      };

      mockPrisma.lease.findUnique.mockResolvedValue(mockLease);

      await canSubmitReview(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.lease).toBe(mockLease);
      expect(mockRequest.userRoleInLease).toBe('TENANT');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      mockPrisma.lease.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await canSubmitReview(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
