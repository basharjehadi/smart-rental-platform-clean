import request from 'supertest';
import { app } from '../src/app.js';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// TEMP: this suite hits real Prisma and uses outdated fields; skipping until refactor
describe.skip('Messaging System Security & Payment Gating', () => {
  let tenantToken, landlordToken, adminToken;
  let tenant, landlord, property, rentalRequest, offer, conversation;
  let server;

  beforeAll(async () => {
    // Create test users
    tenant = await prisma.user.create({
      data: {
        email: 'test-tenant@example.com',
        password: 'hashedpassword',
        name: 'Test Tenant',
        role: 'TENANT',
        phoneNumber: '+48123456789',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'POLISH',
        idNumber: 'ABC123456',
      },
    });

    landlord = await prisma.user.create({
      data: {
        email: 'test-landlord@example.com',
        password: 'hashedpassword',
        name: 'Test Landlord',
        role: 'LANDLORD',
        phoneNumber: '+48987654321',
      },
    });

    admin = await prisma.user.create({
      data: {
        email: 'test-admin@example.com',
        password: 'hashedpassword',
        name: 'Test Admin',
        role: 'ADMIN',
        phoneNumber: '+48111222333',
      },
    });

    // Create test property
    property = await prisma.property.create({
      data: {
        name: 'Test Property',
        address: 'Test Address 123',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'Poland',
        propertyType: 'APARTMENT',
        numberOfBedrooms: 2,
        numberOfBathrooms: 1,
        area: 75.5,
        monthlyRent: 2500,
        securityDeposit: 2500,
        availableFrom: new Date(),
        description: 'Test property description',
        landlordId: landlord.id,
        status: 'AVAILABLE',
      },
    });

    // Create test rental request
    rentalRequest = await prisma.rentalRequest.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        status: 'PENDING',
        monthlyRent: 2500,
        securityDeposit: 2500,
        leaseDuration: '12 months',
        moveInDate: new Date(),
        additionalRequirements: 'Test requirements',
      },
    });

    // Create test offer
    offer = await prisma.offer.create({
      data: {
        rentalRequestId: rentalRequest.id,
        tenantId: tenant.id,
        landlordId: landlord.id,
        rentAmount: 2500,
        depositAmount: 2500,
        leaseDuration: 12,
        availableFrom: new Date(),
        status: 'PENDING',
      },
    });

    // Create test conversation
    conversation = await prisma.conversation.create({
      data: {
        title: 'Test Conversation',
        type: 'DIRECT',
        propertyId: property.id,
        offerId: offer.id,
        status: 'PENDING', // Initially PENDING
      },
    });

    // Add participants
    await prisma.conversationParticipant.createMany({
      data: [
        {
          conversationId: conversation.id,
          userId: tenant.id,
          role: 'MEMBER',
        },
        {
          conversationId: conversation.id,
          userId: landlord.id,
          role: 'MEMBER',
        },
      ],
    });

    // Generate tokens
    tenantToken = jwt.sign({ userId: tenant.id }, process.env.JWT_SECRET);
    landlordToken = jwt.sign({ userId: landlord.id }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ userId: admin.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: conversation.id },
    });
    await prisma.conversation.delete({ where: { id: conversation.id } });
    await prisma.offer.delete({ where: { id: offer.id } });
    await prisma.rentalRequest.delete({ where: { id: rentalRequest.id } });
    await prisma.property.delete({ where: { id: property.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [tenant.id, landlord.id, admin.id] } },
    });
    await prisma.$disconnect();
  });

  describe('Chat Guard Tests', () => {
    describe('PENDING/UNPAID → 403/blocked', () => {
      it('should block message sending when conversation is PENDING', async () => {
        const response = await request(app)
          .post(`/api/messaging/conversations/${conversation.id}/messages`)
          .set('Authorization', `Bearer ${tenantToken}`)
          .send({ content: 'Test message' });

        expect(response.status).toBe(403);
        expect(response.body.errorCode).toBe('CONVERSATION_NOT_ACTIVE');
      });

      it('should block message sending when offer is not PAID', async () => {
        // Update conversation to ACTIVE but offer still PENDING
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { status: 'ACTIVE' },
        });

        const response = await request(app)
          .post(`/api/messaging/conversations/${conversation.id}/messages`)
          .set('Authorization', `Bearer ${tenantToken}`)
          .send({ content: 'Test message' });

        expect(response.status).toBe(403);
        expect(response.body.errorCode).toBe('PAYMENT_REQUIRED');
      });

      it('should block non-participants from sending messages', async () => {
        const nonParticipant = await prisma.user.create({
          data: {
            email: 'non-participant@example.com',
            password: 'hashedpassword',
            name: 'Non Participant',
            role: 'TENANT',
            phoneNumber: '+48123456788',
          },
        });

        const nonParticipantToken = jwt.sign(
          { userId: nonParticipant.id },
          process.env.JWT_SECRET
        );

        const response = await request(app)
          .post(`/api/messaging/conversations/${conversation.id}/messages`)
          .set('Authorization', `Bearer ${nonParticipantToken}`)
          .send({ content: 'Test message' });

        expect(response.status).toBe(403);
        expect(response.body.errorCode).toBe('NOT_MEMBER');

        // Cleanup
        await prisma.user.delete({ where: { id: nonParticipant.id } });
      });
    });

    describe('After webhook (ACTIVE/PAID) → allowed', () => {
      it('should allow messaging after offer is marked PAID and conversation is ACTIVE', async () => {
        // Simulate payment webhook by updating offer status
        await prisma.offer.update({
          where: { id: offer.id },
          data: { status: 'PAID' },
        });

        // Simulate conversation activation
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { status: 'ACTIVE' },
        });

        const response = await request(app)
          .post(`/api/messaging/conversations/${conversation.id}/messages`)
          .set('Authorization', `Bearer ${tenantToken}`)
          .send({ content: 'Test message after payment' });

        expect(response.status).toBe(201);
        expect(response.body.content).toBe('Test message after payment');
      });
    });

    describe('Non-participant → 403', () => {
      it('should block non-participants from reading conversation details', async () => {
        const nonParticipant = await prisma.user.create({
          data: {
            email: 'another-user@example.com',
            password: 'hashedpassword',
            name: 'Another User',
            role: 'TENANT',
            phoneNumber: '+48123456787',
          },
        });

        const nonParticipantToken = jwt.sign(
          { userId: nonParticipant.id },
          process.env.JWT_SECRET
        );

        const response = await request(app)
          .get(`/api/messaging/conversations/${conversation.id}`)
          .set('Authorization', `Bearer ${nonParticipantToken}`);

        expect(response.status).toBe(403);
        expect(response.body.errorCode).toBe('NOT_MEMBER');

        // Cleanup
        await prisma.user.delete({ where: { id: nonParticipant.id } });
      });
    });
  });

  describe('Payment Webhook Tests', () => {
    it('should be idempotent - calling webhook twice should not create duplicate updates', async () => {
      // Create a new offer for idempotency testing
      const testOffer = await prisma.offer.create({
        data: {
          rentalRequestId: rentalRequest.id,
          tenantId: tenant.id,
          landlordId: landlord.id,
          rentAmount: 3000,
          depositAmount: 3000,
          leaseDuration: 12,
          availableFrom: new Date(),
          status: 'PENDING',
        },
      });

      const testConversation = await prisma.conversation.create({
        data: {
          title: 'Idempotency Test',
          type: 'DIRECT',
          propertyId: property.id,
          offerId: testOffer.id,
          status: 'PENDING',
        },
      });

      // Add participants
      await prisma.conversationParticipant.createMany({
        data: [
          {
            conversationId: testConversation.id,
            userId: tenant.id,
            role: 'MEMBER',
          },
          {
            conversationId: testConversation.id,
            userId: landlord.id,
            role: 'MEMBER',
          },
        ],
      });

      // First webhook call
      await prisma.offer.update({
        where: { id: testOffer.id },
        data: { status: 'PAID' },
      });

      await prisma.conversation.update({
        where: { id: testConversation.id },
        data: { status: 'ACTIVE' },
      });

      const firstStatus = await prisma.conversation.findUnique({
        where: { id: testConversation.id },
        select: { status: true },
      });

      // Second webhook call (should be idempotent)
      await prisma.offer.update({
        where: { id: testOffer.id },
        data: { status: 'PAID' }, // Same status
      });

      await prisma.conversation.update({
        where: { id: testConversation.id },
        data: { status: 'ACTIVE' }, // Same status
      });

      const secondStatus = await prisma.conversation.findUnique({
        where: { id: testConversation.id },
        select: { status: true },
      });

      // Status should remain the same
      expect(firstStatus.status).toBe('ACTIVE');
      expect(secondStatus.status).toBe('ACTIVE');

      // Cleanup
      await prisma.conversationParticipant.deleteMany({
        where: { conversationId: testConversation.id },
      });
      await prisma.conversation.delete({ where: { id: testConversation.id } });
      await prisma.offer.delete({ where: { id: testOffer.id } });
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should block messages when rate limit is exceeded', async () => {
      // This test would require socket.io testing setup
      // For now, we'll test the API rate limiting logic

      // Send multiple messages rapidly
      const promises = Array.from({ length: 15 }, (_, i) =>
        request(app)
          .post(`/api/messaging/conversations/${conversation.id}/messages`)
          .set('Authorization', `Bearer ${tenantToken}`)
          .send({ content: `Rate limit test message ${i}` })
      );

      const responses = await Promise.all(promises);

      // Some should succeed, some should be rate limited
      const successCount = responses.filter((r) => r.status === 201).length;
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;

      expect(successCount).toBeGreaterThan(0);
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Error Code Tests', () => {
    it('should return correct error codes for different scenarios', async () => {
      // Test NOT_FOUND
      const notFoundResponse = await request(app)
        .post('/api/messaging/conversations/nonexistent-id/messages')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ content: 'Test message' });

      expect(notFoundResponse.status).toBe(404);
      expect(notFoundResponse.body.errorCode).toBe('NOT_FOUND');

      // Test PAYMENT_REQUIRED
      const paymentRequiredResponse = await request(app)
        .post(`/api/messaging/conversations/${conversation.id}/messages`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ content: 'Test message' });

      expect(paymentRequiredResponse.status).toBe(403);
      expect(paymentRequiredResponse.body.errorCode).toBe('PAYMENT_REQUIRED');
    });
  });
});
