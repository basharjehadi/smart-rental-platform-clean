# Refunds Architecture

This document explains how refunds are handled after a move‑in cancellation approval.

## Overview

When an admin approves a reported move‑in issue, the booking is unwound and refunds are triggered for all booking payments.

- Entry point: `adminApproveCancellation` in `backend/src/controllers/moveInVerificationController.js`
- Refund orchestration: `refundOfferPayments(offerId)` in `backend/src/controllers/paymentController.js`
- Pluggable providers: `backend/src/services/refundProviders/index.js`

## Providers

Refunds are delegated based on `payment.gateway`:

- Stripe (live): Uses Stripe Refund API
- PayU (stub): Marks payment as CANCELLED (replace with real PayU API)
- Przelewy24 / P24 (stub): Marks payment as CANCELLED (replace with real P24 API)
- Tpay (stub): Marks payment as CANCELLED (replace with real Tpay API)

You can replace the stubs with real REST integrations per provider.

## Stripe Setup

Environment variables (backend):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Refund flow:
- Provider: `STRIPE`
- `refundOfferPayments` routes to Stripe provider
- Creates `refund` via `stripe.refunds.create({ payment_intent })`
- Marks local `Payment.status = CANCELLED` and stores `REFUNDED:<refundId>` in `errorMessage`

## Mock/Other Gateways

Current default behavior for PayU / P24 / Tpay is to mark `Payment.status = CANCELLED` and set `errorMessage = 'REFUNDED:<provider>'`.

Replace the stub logic in `backend/src/services/refundProviders/index.js`:
- Implement provider auth (client id/secret)
- Call refund endpoint
- Map provider refund id and status to local model

## Realtime Notifications

- After refund processing, summary notifications are sent to tenant and landlord.
- See `refundOfferPayments` for the emit logic via Socket.IO.

## Future Enhancements

- Add a `Refund` model in Prisma to store provider refund ids, status, and links to `Payment`.
- Add provider webhooks to reconcile asynchronous refund states (partial, failed, completed).
- Admin refunds dashboard with filters by provider and status.
