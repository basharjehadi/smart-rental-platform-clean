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

## Enhanced Renewal Workflow System (2025 Update)

### Overview
The lease renewal system has been completely enhanced with a professional workflow, smart UI, real-time notifications, and comprehensive security. This transforms the basic renewal functionality into an enterprise-grade property management feature.

### Enhanced Data Model
- `RenewalRequest` with fields: `leaseId`, `initiatorUserId`, `status (PENDING|COUNTERED|ACCEPTED|DECLINED|EXPIRED|CANCELLED)`, `proposedTermMonths`, `proposedStartDate`, `proposedMonthlyRent (landlord-only)`, `note`, `counterOfId`, `expiresAt`, `decidedByUserId`, `decidedAt`.

### Security & Permission System
- **Tenant Protection**: Tenants can only send simple renewal requests (no terms/rent manipulation)
- **Landlord Authorization**: Only landlords can propose terms and rent changes
- **Access Control**: Users can only access renewals for their own leases
- **Role Validation**: Comprehensive tenant/landlord role checking for each action
- **API Security**: Backend guards prevent unauthorized term/rent manipulation

### Enhanced API Endpoints

#### Core Renewal Endpoints
- `POST /api/leases/:id/renewals` – Create renewal request (tenant: note only, landlord: full terms)
- `POST /api/renewals/:id/counter` – Counter renewal (landlord only, can set terms)
- `POST /api/renewals/:id/accept` – Accept renewal (tenant only)
- `POST /api/renewals/:id/decline` – Decline renewal (either party)
- `GET /api/leases/:id/renewals` – List renewal thread

#### New Workflow Endpoints
- `GET /api/leases/:id/renewal-workflow` – Get current workflow state and permissions
- `POST /api/renewals/expire-old` – Auto-expire old renewal requests (admin/cron)

### State Machine Workflow
```
REQUESTED (tenant) → PROPOSED (landlord) → ACCEPTED (tenant)
                                            → REJECTED (tenant)
REQUESTED (timeout) → EXPIRED
CANCELLED (by either party if no decision yet)
```

### Real-Time Notifications
- **Renewal Request Notifications**: When tenants request renewal or landlords propose terms
- **Response Notifications**: When renewals are accepted or declined
- **Expiration Notifications**: When renewals expire without response
- **Real-Time Delivery**: Instant notifications via Socket.io
- **Smart Targeting**: Notifications go to the right party based on who initiated the action

### Enhanced UI Components

#### Tenant UI
- **Simplified Renewal Modal**: Removed term/rent inputs, only message field
- **Clear Process Explanation**: Users understand landlord will propose terms
- **Smart Button Logic**: Buttons show/hide based on current workflow state
- **Real-Time Updates**: Instant UI updates without page refresh

#### Landlord UI
- **Smart Proposal Modal**: Quick presets (12m same rent, +5% increase, 6m terms)
- **Custom Terms**: Set any rent increase percentage and lease duration
- **Live Preview**: See exactly what you're proposing before sending
- **Revenue Optimization**: Easy rent increase management with visual feedback

### Quick Presets for Landlords
1. **12 months, same rent** - Maintain current terms
2. **12 months, +5% increase** - Standard annual rent increase
3. **6 months, same rent** - Short-term renewal
4. **Custom terms** - Set any duration and rent increase percentage

### Workflow State API
The `/api/leases/:id/renewal-workflow` endpoint returns:
```json
{
  "hasActiveRenewal": boolean,
  "currentStatus": "PENDING|COUNTERED|ACCEPTED|DECLINED|EXPIRED|CANCELLED",
  "canRequestRenewal": boolean,
  "canProposeRenewal": boolean,
  "canCounterRenewal": boolean,
  "canAcceptRenewal": boolean,
  "canDeclineRenewal": boolean,
  "latestRenewal": object,
  "allRenewals": array,
  "leaseEndDate": string,
  "daysUntilExpiry": number
}
```

### Auto-Expiration System
- **7-Day Expiration**: Renewal requests auto-expire after 7 days
- **Scheduler Integration**: Runs every 5 minutes to check for expired requests
- **Notification System**: Users are notified when renewals expire
- **Cleanup**: Expired renewals are marked and cleaned up automatically

### Business Impact
- **Professional Features**: Enterprise-level lease management capabilities
- **User Retention**: Landlords will stick with your platform for these features
- **Revenue Growth**: More successful renewals = more long-term users
- **Competitive Advantage**: Most rental apps don't have proper renewal workflows
- **Sticky Platform**: Users become dependent on these professional features

### Testing Guide

#### Prerequisites
- Active lease with tenant and landlord
- Valid JWT tokens for both parties
- Socket.io connection for real-time testing

#### Test Scenarios

1. **Tenant Renewal Request**
   ```bash
   # Tenant sends simple renewal request
   curl -X POST \
     -H "Authorization: Bearer <tenant-jwt>" \
     -H "Content-Type: application/json" \
     -d '{"note":"I would like to renew my lease"}' \
     http://localhost:3001/api/leases/<leaseId>/renewals
   ```

2. **Landlord Proposal**
   ```bash
   # Landlord proposes renewal terms
   curl -X POST \
     -H "Authorization: Bearer <landlord-jwt>" \
     -H "Content-Type: application/json" \
     -d '{"proposedTermMonths":12,"proposedMonthlyRent":1200,"note":"Happy to renew with 5% increase"}' \
     http://localhost:3001/api/leases/<leaseId>/renewals
   ```

3. **Tenant Acceptance**
   ```bash
   # Tenant accepts landlord's proposal
   curl -X POST \
     -H "Authorization: Bearer <tenant-jwt>" \
     http://localhost:3001/api/renewals/<renewalId>/accept
   ```

4. **Workflow State Check**
   ```bash
   # Check current workflow state
   curl -H "Authorization: Bearer <jwt>" \
     http://localhost:3001/api/leases/<leaseId>/renewal-workflow
   ```

#### Verification Points
- ✅ Tenant cannot set terms/rent (API returns 403)
- ✅ Landlord can set terms/rent
- ✅ Real-time notifications appear instantly
- ✅ UI buttons show/hide based on workflow state
- ✅ Auto-expiration works after 7 days
- ✅ New lease is created on acceptance
- ✅ Payment schedule updates with new rent

### Future Enhancements
- **Renewal Analytics**: Track renewal rates and rent trends
- **Automated Rent Increases**: Configurable annual increase percentages
- **Bulk Renewal Management**: Handle multiple renewals at once
- **Renewal Templates**: Save common renewal terms as templates
- **Advanced Notifications**: Email/SMS notifications for critical renewals


