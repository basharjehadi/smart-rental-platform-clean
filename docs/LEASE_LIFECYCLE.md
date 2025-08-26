## Lease Renewal & Termination - Implementation Guide

### Overview
This document describes the backend and frontend additions enabling non‑reversible lease termination notices, renewal declines, and immediate property marketing, plus an automatic termination executor.

Scope:
- Data model additions (Prisma)
- API endpoints (irreversible)
- Scheduler execution on effective date
- Notifications and real‑time behavior
- Frontend indicators and guards
- Testing notes and edge cases

---

### Data Model Changes (Prisma)

Updated in `backend/prisma/schema.prisma`:

- Property
  - `isMarketing Boolean @default(false)` – shows property is being marketed for next tenant after termination/decline.

- Lease
  - Links (optional): `rentalRequestId Int?`, `offerId String?`, `propertyId String?`
  - Termination:
    - `terminationNoticeByUserId String?`
    - `terminationNoticeDate DateTime?`
    - `terminationEffectiveDate DateTime?`
    - `terminationReason String?`
  - Renewal:
    - `renewalStatus LeaseRenewalStatus @default(NONE)` (values: `NONE`, `DECLINED`)
    - `renewalDeclinedAt DateTime?`
    - `renewalDeclinedByUserId String?`

- Enums
  - `enum LeaseRenewalStatus { NONE, DECLINED }`

Relations were added so `RentalRequest`, `Offer`, and `Property` can reference `Lease` (read‑only backrefs).

Migration: `prisma migrate dev` created `20250826172834_lease_renewal`.

---

### API Endpoints

Base mount: `backend/src/routes/index.js` → `router.use('/leases', leaseRoutes);`

Routes in `backend/src/routes/leaseRoutes.js` (auth: JWT required):

1) POST `/api/leases/:id/termination/notice`
   - Irreversible. Allowed by Tenant or Landlord of the lease.
   - Body: `{ reason?: string, effectiveDate?: string(ISO) }`
   - Effects:
     - Set termination notice fields on `Lease`.
     - Immediately set `Property.isMarketing = true` and `Property.status = AVAILABLE` (matchable now).
     - Create notifications for tenant and landlord.

   Example:
```bash
curl -X POST \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"reason":"moving out","effectiveDate":"2025-10-01T00:00:00.000Z"}' \
  http://localhost:3001/api/leases/<leaseId>/termination/notice
```

2) POST `/api/leases/:id/renewal/decline`
   - Irreversible. Allowed by Tenant or Landlord of the lease.
   - Body: `{}` (no payload required)
   - Effects:
     - `Lease.renewalStatus = DECLINED`, record timestamps.
     - Immediately set `Property.isMarketing = true` and `Property.status = AVAILABLE`.
     - Create notifications for tenant and landlord.

   Example:
```bash
curl -X POST \
  -H "Authorization: Bearer <JWT>" \
  http://localhost:3001/api/leases/<leaseId>/renewal/decline
```

Controller: `backend/src/controllers/leaseController.js`.

Notes:
- Both endpoints are idempotent at the UX level (second call returns an error indicating it’s already set).
- Both endpoints are non‑reversible by design.

---

### Scheduler (Termination Execution)

File: `backend/src/services/leaseLifecycleService.js`
- Interval: every 5 minutes.
- Finds leases with `terminationEffectiveDate <= now` and `status in (ACTIVE,PENDING)`.
- For each lease:
  - Set `Lease.status = TERMINATED`.
  - Hard‑delete related `Contract` rows for the associated `rentalRequestId` and delete their PDFs (best‑effort file removal).
  - Archive related `Conversation`s for the `offerId`.
  - Set `Property.status = AVAILABLE` and `isMarketing = false`.
  - Create notifications for tenant and landlord.

Scheduler is started from `backend/src/server.js`:
- `startLeaseLifecycleScheduler()` alongside move‑in verification scheduler.

---

### Notifications & Real‑time

- On notice/decline: create `SYSTEM_ANNOUNCEMENT` notifications for both parties.
- On execution day: create `SYSTEM_ANNOUNCEMENT` notifications for both parties.
- Socket emissions reuse existing notification pipeline; unread bell count already sums totals.

---

### Frontend Updates

- Tenant (`frontend/src/pages/TenantDashboard.jsx`)
  - Shows chips under the move‑in card:
    - “Termination notice • effective <date>” when applicable
    - “Renewal declined” when applicable
  - Disables Edit/Delete for the request when termination notice exists or renewal is declined (and when locked).

- Landlord (`frontend/src/pages/LandlordMyProperty.jsx`)
  - Shows a blue “MARKETING” chip when `property.isMarketing` is true (property is being marketed for next tenant).

No other pages were changed in this pass; existing dashboards and messaging continue to function.

---

### Backward Compatibility

- Existing booking, payment, contract generation, move‑in verification, and sockets remain unchanged.
- New schema fields are optional and defaulted, avoiding breaking existing queries.

---

### Testing Guide

Prereqs: Active lease object connected to an offer/property.

1) Get a JWT (login as tenant or landlord).
2) Issue termination notice:
   - Call POST `/api/leases/:id/termination/notice` (see example above).
   - Verify: `Property.isMarketing = true`, status chip appears on landlord properties.
   - Tenant dashboard shows termination chip; Edit/Delete disabled.
3) Decline renewal (optional alternative):
   - Call POST `/api/leases/:id/renewal/decline`.
   - Verify same marketing behavior; chip says “Renewal declined”.
4) Scheduler execution:
   - Set `terminationEffectiveDate` to near‑now, wait ≤5 minutes.
   - Verify `Lease.status = TERMINATED`, related contract rows/PDFs removed, conversations archived, property AVAILABLE (marketing false).
5) Notifications:
   - Confirm tenant/landlord receive bell updates when notice/decline/execution happen.

Windows note: Prisma on Windows can occasionally emit EPERM rename warnings for the client DLL. The migrations still apply correctly.

---

### Edge Cases & Idempotency

- Re‑posting notice/decline returns an error that state is already set; no duplicate effects.
- Scheduler checks status and effective date to avoid double execution.
- Contract file deletion is best‑effort; DB entries are removed first.

---

### Future Enhancements

- UI actions for tenant/landlord to initiate notice/decline directly from dashboards.
- Optional confirmation modals with additional reasons.
- Surfacing termination/renewal indicators in more landlord/tenant list views.

---

## Renewal Workflow (Requests & Counters)

### Model
- `RenewalRequest` with fields: `leaseId`, `initiatorUserId`, `status (PENDING|COUNTERED|ACCEPTED|DECLINED|EXPIRED|CANCELLED)`, `proposedTermMonths`, `proposedStartDate`, `proposedMonthlyRent (landlord-only)`, `note`, `counterOfId`, `expiresAt`, `decidedByUserId`, `decidedAt`.

### Rules
- Either party can open 1 active renewal request per lease.
- Only landlord may set or change `proposedMonthlyRent` (enforced server-side).
- Acceptance creates a new Lease from the proposed start date; contract generation can be plugged in.
- Requests auto-expire after 7 days (scheduler), or you can extend logic to cut off near lease end.

### Endpoints
- POST `/api/leases/:id/renewals` – create request (landlord price allowed)
- POST `/api/renewals/:id/counter` – counter; landlord may set price
- POST `/api/renewals/:id/accept` – accept; creates new Lease
- POST `/api/renewals/:id/decline` – decline
- GET  `/api/leases/:id/renewals` – list thread

### Scheduler
- Extends `leaseLifecycleService` to mark overdue requests as `EXPIRED`.

### UI (initial)
- Tenant Dashboard → Lease Progress card: “Decline Renewal” present; “Request Renewal” can be added to call POST `/leases/:id/renewals` without price.
- Landlord My Tenants → add “Propose Renewal” (with price input) or “Counter” when a pending request exists.


