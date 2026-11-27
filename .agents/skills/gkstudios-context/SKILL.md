# GK STUDIOS - Application and Database Context

Use this file as the architecture reference for GK STUDIOS. It describes the verified repository state.

## 1. Project Overview and Tech Stack

- **Name:** GK STUDIOS ("Creating Memories")
- **Location:** Chennai Highway, Kandarakkottai, Panruti, Tamil Nadu
- **Region:** Panruti, Cuddalore, Villupuram, Tindivanam, Chennai, and Tamil Nadu
- **Framework:** Next.js 16 App Router, React 19, TypeScript
- **Styling:** Tailwind CSS 4, Radix UI Dialog/Tabs, custom Emerald/Gold theme
- **Animation:** `motion/react`
- **Notifications:** Sonner
- **Icons:** Lucide React
- **Database:** MongoDB 7-compatible driver with Mongoose 9
- **State:** React context (`StudioContext`) plus server-side data access
- **Validation:** manual request checks and TypeScript types; there is no Zod dependency or shared Zod schema layer
- **TypeScript:** strict mode is disabled in `tsconfig.json`; prefer explicit types and guards

### Environment keys

Names only:

- `MONGODB_URI`
- `MONGODB_STANDARD_URI`
- `MONGODB_DATABASE`
- `ADMIN_PIN`
- `ADMIN_SESSION_SECRET`
- `PORT`
- `DEFAULT_APP_PORT`
- `NGINX_PORT`

Mongo code prefers `MONGODB_STANDARD_URI`, then `MONGODB_URI`. The database default is `gkstudios_dev`. The scripts use `gk_studios` as their local fallback only. Admin PIN must be exactly six digits. `ADMIN_SESSION_SECRET` must be a random value of at least 32 characters; without it, admin sign-in and protected mutations fail closed.

## 2. Directory and File Architecture

```text
src/app/
  page.tsx                         Public studio page
  layout.tsx                       Fonts, StudioProvider, root metadata
  admin/page.tsx                   Admin shell
  packages/proposal/page.tsx       Proposal route wrapper
  bills/[id]/page.tsx              Public bill view
  api/
    studio/                        Combined studio state
    bookings/                      Inquiry CRUD and booking actions
    schedule/                      Calendar upsert/delete
    events/                        Event catalog CRUD and production project actions
    services/                      Master service pricing
    packages/                      Package CRUD/reorder
    bills/                         Bill lookup
    portfolio/                     Portfolio CRUD
    admin/auth/                    Six-digit PIN auth
src/components/
  PublicStudioPage.tsx             Public section orchestration
  PortfolioSection.tsx
  PackagesSection.tsx
  BookingSection.tsx               Legacy inquiry component; not rendered in the public home flow
  packages/                        Proposal/intake/customizer components
  admin/                          Leads, calendar, timeline, gallery, packages, services
src/context/StudioContext.tsx      Public/admin client state and mutations
src/server/mongodb.ts               Mongoose schemas and connection helpers
src/server/studioStore.ts           Unified Mongo/disk state and business operations
src/lib/pricing.ts                 Service/package/customization calculations
src/lib/utils.ts                   Dates, currency, WhatsApp links
src/types/studio.ts                Shared interfaces and enums
src/data/initialStudioData.ts      Fallback seed state and studio constants
src/i18n/translations.ts           Public EN/TA text
data/studio-db.json                Static portfolio and fallback seed data
```

The public routes are:

- `/` public studio
- `/packages/proposal` interactive proposal/customizer
- `/bills/[id]` bill view
- `/admin` PIN-protected operations dashboard

## 3. MongoDB Database Structure

Database name: `MONGODB_DATABASE` or `gkstudios_dev`.

MongoDB collection names and Mongoose models:

| Collection | Mongoose model | Primary purpose |
|---|---|---|
| `booking_requests` | `BookingRequest` | Leads, inquiries, booking snapshots |
| `calendar_schedule` | `CalendarSchedule` | Booked/limited schedule entries |
| `event_projects` | `EventProject` | Delivery stages, financials, embedded payments |
| `bills` | `Bill` | Generated historical bill snapshots |
| `events` | `StudioEvent` | Event catalog and event ordering |
| `packages` | `Package` | Package tiers and service links |
| `services` | `Service` | Master pricing catalog |

Events are stored in the `events` collection. Each package links to one event through `eventId`;
its `category` mirrors that event ID and `eventSortOrder` mirrors the Event's `sortOrder`.
`/api/events` provides catalog reads/CRUD while retaining POST/PATCH/DELETE actions used by
event-project workflows.

`portfolio` is not currently a MongoDB collection. Portfolio items come from `data/studio-db.json`, `INITIAL_STUDIO_STATE`, and in-memory/disk state mutations. It does not have a Mongoose schema. There is no Mongo-backed `users`, `admins`, or `settings` collection. Admin authentication uses an HTTP-only application cookie with a fixed value plus server-side `ADMIN_PIN` verification.

### `booking_requests`

Exact schema fields:

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique, for example `bk-173...` |
| `referenceCode` | string | For example `GK-2611-102` |
| `clientName` | string | Required |
| `phone` | string | Required |
| `eventType` | string/EventCategory | Required |
| `preferredDate` | string | `YYYY-MM-DD` |
| `endDate` | string, optional | Multi-day end date |
| `eventTime` | string, optional | Event start time |
| `eventEndTime` | string, optional | Event end time |
| `venue` | string | Required |
| `packageId` | string | Package ID or `custom-package` |
| `packageName` | string | Required |
| `quotedAmount` | number | Required |
| `requestedServices` | string[] | Legacy selected service names |
| `durationTier` | `threeHours \| halfDay \| fullDay` | Optional |
| `optedServices` | mixed[] | Historical `OptedServiceSnapshot[]` |
| `totalAmount` | number | Optional/booking total |
| `notes` | string | Inquiry notes |
| `status` | string | Pending, In Discussion, Acknowledged, Confirmed, Declined |
| `source` | string | Optional lead source |
| `assignedCrew` | string | Optional |
| `acknowledgementNote` | string | Optional |
| `termsAccepted` | boolean | Optional |
| `termsAcceptedAt` | string | Optional |
| `termsVersion` | string | Optional |
| `packageSnapshot` | mixed | Historical package snapshot |
| `proposalToken` | string | Optional 256-bit random capability token; omitted from plain studio-state responses |
| `proposalDraft` | mixed | Optional client-resubmitted proposal awaiting admin review; does not replace the current quote until admin saves |
| `proposalUpdatedAt` | string | Optional ISO timestamp of the latest admin save or client submission |
| `proposalSubmittedAt` | string | Optional ISO timestamp of the latest client resubmission |
| `proposalRevision` | number | Optional proposal edit/submission revision counter |
| `createdAt` | string | ISO timestamp |

Example:

```json
{
  "id": "bk-1730000000000",
  "referenceCode": "GK-2611-102",
  "clientName": "Example Client",
  "phone": "9876543210",
  "eventType": "Weddings",
  "preferredDate": "2026-12-14",
  "endDate": "2026-12-15",
  "eventTime": "06:00",
  "venue": "Example Mandapam",
  "packageId": "pkg-signature-wedding",
  "packageName": "Signature Wedding",
  "quotedAmount": 65000,
  "durationTier": "fullDay",
  "requestedServices": ["Traditional Camera", "Candid Camera", "Drone"],
  "optedServices": [],
  "totalAmount": 65000,
  "notes": "Morning and evening ceremonies",
  "status": "Pending",
  "source": "Website Inquiry",
  "termsAccepted": true,
  "createdAt": "2026-11-23T06:47:02.306+05:30"
}
```

### `calendar_schedule`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique schedule entry ID |
| `date` | string | `YYYY-MM-DD` |
| `status` | string | `Limited` or `Booked` |
| `title` | string | Required |
| `eventType` | string | Core/legacy event category or schedule label |
| `clientName` | string | Optional |
| `venue` | string | Optional |
| `assignedCrew` | string | Optional |
| `notes` | string | Optional |
| `bookingId` | string | Relationship to `booking_requests.id` |
| `phone` | string | Optional |
| `time` | string | Optional |
| `requestedServices` | string[] | Legacy service names |
| `durationTier` | string | Optional duration tier |
| `optedServices` | mixed[] | Historical service snapshots |
| `packageId` | string | Optional |
| `packageName` | string | Optional UI field |
| `packageTier` | string | `Essential`, `Signature`, or `Premium` |
| `totalPackageAmount` | number | Optional |
| `totalAmount` | number | Optional |
| `paymentStatus` | string | Optional |

The calendar supports concurrent crews and multiple entries on the same date.

### `event_projects`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique |
| `bookingId` | string | Relationship to booking |
| `calendarEntryId` | string | Relationship to calendar entry |
| `referenceCode` | string | Booking reference |
| `clientName` | string | Required |
| `phone` | string | Required |
| `eventType` | string | Required |
| `eventDate` | string | `YYYY-MM-DD` |
| `endDate` | string | Optional |
| `venue` | string | Required |
| `packageName` | string | Required |
| `assignedCrew` | string | Required |
| `currentStage` | string | One of six lifecycle stages |
| `stageUpdates` | object | `{ [stage]: { completedAt, note } }` |
| `agreedAmount` | number | Contract amount |
| `extraCharges` | number | Additions |
| `discount` | number | Reduction |
| `payments` | array | Embedded `PaymentRecord[]` |
| `deliveryNotes` | string | Required |
| `requestedServices` | string[] | Optional legacy names |
| `durationTier` | string | Optional |
| `optedServices` | mixed[] | Historical snapshots |
| `totalAmount` | number | Optional |
| `packageSnapshot` | mixed | Historical package snapshot |

Lifecycle stages:

1. `Booking Confirmed`
2. `Pre-Shoot Briefing`
3. `Shoot Completed`
4. `Editing & Selection`
5. `Album & Film Ready`
6. `Delivered`

Financial formula:

- Net total = agreed amount + extra charges - discount
- Paid total = sum of embedded payments
- Balance due = max(0, net total - paid total)

### `bills`

The bill collection stores one immutable snapshot per payment entry.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique, `bill-*` |
| `billNumber` | string | Unique, `GKS-YYYY-0001` |
| `billDate` | string | Optional |
| `bookingId` | string | Booking or project relationship |
| `paymentId` | string | Related payment |
| `clientName` | string | Snapshot |
| `clientPhone` | string | Snapshot |
| `eventDetails` | object | Event name, Tamil name, start/end date and time, venue, plan |
| `packageDetails` | object | Package/tier/duration/services/deliverables/crew/addons/exclusions |
| `financials` | object | Totals paid now, cumulative paid, balance due, stage |
| `termsAndConditions` | array | `{ en, ta }[]` |
| `optedServices` | mixed[] | Historical itemized service snapshots |
| `createdAt` | string | ISO timestamp |

`packageDetails.includedServices` is a snapshot line-item array:

```json
[
  { "key": "traditionalPhoto", "en": "Traditional Photography", "ta": "பாரம்பரியப் புகைப்படம்", "selected": true },
  { "key": "drone", "en": "Drone Aerial Cinematography", "ta": "ட்ரோன் வான்வழிப் படப்பிடிப்பு", "selected": true }
]
```

### `services`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Optional display ID |
| `name` | string | Required |
| `slug` | string | Required, unique, package mapping key |
| `tamilName` | string | Optional |
| `category` | string | Required |
| `description` | string | Optional |
| `pricingType` | `tiered \| per_unit` | Required |
| `unitLabel` | string | Unit, camera, photographer, wall, sheets |
| `unitPrice` | number/null | Used by `per_unit` |
| `minQuantity` | number | Minimum quantity for `per_unit` |
| `pricing` | object/null | Tiered services use `{ halfDay, fullDay }`; the legacy three-hour package duration uses the half-day service rate |
| `isActive` | boolean | Public/admin availability |
| `displayOrder` | number | Sort order |
| `createdAt` | string | Optional |
| `updatedAt` | string | Optional |

Default/fallback services include traditional/candid photography and videography, drone, LED wall, TV, album, outdoor shoot, and other add-ons. Service slugs are immutable package mapping keys when service names change.

### `packages`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique, normally `pkg-*` |
| `eventId` | string | Foreign key matching `events.id` |
| `category` | string | Mirrors `eventId` |
| `tier` | string | `essential`, `signature`, `premium` |
| `name` | string | Required |
| `audience` | string | Required in UI schema |
| `price` | number/null/omitted | Optional override; otherwise calculated from included services |
| `currency` | string | Default `INR` |
| `priceLabel` | string | Display label |
| `duration` | string | Display text |
| `durationTier` | `threeHours \| halfDay \| fullDay` | Defaults/inferred for legacy packages |
| `includedServices` | `{ serviceSlug: string, quantity: number, durationTier?: threeHours \| halfDay \| fullDay }[]` | Drives coverage, album, and deliverable display plus base pricing; item tier falls back to package tier |
| `highlighted` | boolean | Most-popular flag |
| `featured` | boolean | Featured flag |
| `deliverables` | `{ Deliverables: string }` | Standard and custom text is stored in this existing field; coverage/albums are derived from services |
| `customizer` | mixed | Legacy/customizer data |
| `imageUrl` | string | Public image URL |
| `image` | string | Legacy alias |
| `status` | `active \| inactive` | Default active |
| `displayOnPortfolio` | boolean | Public package visibility |
| `sortOrder` | number | 1, 2, 3 convention |
| `eventSortOrder` | number | Ceremony order, shared by packages with the same `eventId` |
| `createdAt` | string | Optional |
| `updatedAt` | string | Optional |

Example:

```json
{
  "id": "pkg-signature-wedding",
  "eventId": "wedding",
  "tier": "signature",
  "name": "Signature Wedding",
  "audience": "Complete wedding ritual coverage",
  "currency": "INR",
  "duration": "Full Day",
  "durationTier": "fullDay",
  "includedServices": [
    { "serviceSlug": "traditional-camera", "quantity": 1, "durationTier": "fullDay" },
    { "serviceSlug": "candid-photography", "quantity": 1, "durationTier": "halfDay" }
  ],
  "deliverables": {
    "Deliverables": "4K cinematic highlight film; dedicated couple portrait session"
  },
  "status": "active",
  "displayOnPortfolio": true,
  "sortOrder": 2,
  "eventSortOrder": 1
}
```

### `events`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique event slug and package foreign key |
| `name` | string | English display name |
| `tamilName` | string | Tamil display name |
| `category` | `wedding \| baby-kids \| outdoor \| family-milestones` | Event grouping |
| `status` | `active \| inactive` | Defaults to active; inactive events are hidden publicly |
| `sortOrder` | number | Event-tab/card order; mirrored to linked packages |

Admin CRUD is available at `/admin/events`. Renaming an event ID and changing its order/category
updates linked packages; changing status also toggles linked package status. Events with packages
cannot be deleted.

### Package pricing and services

When `packages.price` is absent, package price is calculated from `includedServices`: `unitPrice ×
quantity` for `per_unit` services, or the selected duration-tier price times quantity for `tiered`
services. The services catalog supports legacy `photo-album` plus `photo-album-8x12`,
`photo-album-10x30`, `photo-album-16x24`, `photo-album-12x36`, `photo-album-18x24`, and
`photo-album-18x24-combo-box` slugs.

### Portfolio fallback structure

`PortfolioItem` fields: `id`, optional `eventId`, `title`, `category`, `location`, `imageUrl`, `shootNotes`, `exif`, `dateLabel`, `isHeroFeatured`, `isVisible`, `aspect` (`wide|standard`). The portfolio filter uses active events; legacy items without `eventId` are grouped by category.

`data/studio-db.json` is a static seed/fallback file. Its current portfolio data is not a Mongo collection.

## 4. Core Workflows and Business Rules

### Single-source pricing

1. `services` is the pricing master for all live package/customizer calculations.
2. Tiered services use `pricing.halfDay` or `pricing.fullDay`. Legacy `threeHours` duration selections resolve to the half-day service rate; new service pricing has no three-hour rate.
3. Per-unit services use `unitPrice * quantity`, with `minQuantity` applied.
4. `calculatePackageBasePrice` in `src/lib/pricing.ts` sums package `includedServices`, resolving each tiered item from its own `durationTier` first, then an explicitly supplied whole-event tier, the package tier, and finally `fullDay`. Per-unit services use their unit price and quantity regardless of tier.
5. Legacy packages without `includedServices` use backward-compatible tier synthesis.
6. A stored package price is an optional override; without one, the effective price is calculated from included services. Admin forms distinguish the override from the resolved display price.
7. `buildOptedServicesForPackage` and `calculateCustomizedEventPrice` create historical service snapshots.
8. `getDynamicPackageDisplaySections` derives “Event Coverage & Crew”, “Albums”, and service-category “Deliverables” from active service items for public cards, proposal customizer, and admin views. These derived sections must never be persisted in `packages.deliverables`; legacy documents are sanitized on package reads and writes.
9. `/api/packages/[id]` supports GET, PATCH/PUT, and DELETE by custom package `id`, with Mongo `_id` lookup as a fallback. Mutations require a valid signed admin session cookie; shared client requests include credentials.
10. The Admin Package Manager configures event-linked packages, included services and quantities, deliverables, and optional price overrides. Per-unit quantities start at each service's minimum and adjust one unit at a time. Legacy customizer inclusion flags remain stored and are preserved when editing packages, but are no longer separately editable in the package form. The proposal customizer shows all included package services, including deliverables outside the legacy feature groups, and offers active catalog services not included in the base as upgrades; per-service duration selectors recalculate tiered prices. Booking, inquiry, calendar, and proposal snapshots record each tiered service's resolved tier and current catalog price.

### Historical snapshot rule

Future service/package price edits must not rewrite old bookings or bills. Store:

- `durationTier`
- `optedServices` with service slug, name, category, pricing type, unit label, unit price, quantity, and line total
- `packageSnapshot`
- Bill package details and bill financial values

Past snapshots remain authoritative. A bill is a snapshot at payment time, and future service edits must not alter it.

The public `/api/bookings` POST route forwards `durationTier`, `optedServices`, `totalAmount`, and `packageSnapshot` into the booking record.

### Public flow

1. `/` renders `PublicStudioPage`.
2. The homepage shows standard package cards by default; visitors can switch to the optional custom intake. Package cards and public availability/category actions route to `/packages/proposal`; package selection passes `event`, `tier`, exact `package` ID, and an inquiry-open flag in the query.
3. Proposal page loads that package and opens its date-check and booking inquiry form. It is the only public inquiry form rendered from the homepage; `BookingSection.tsx` remains as an unused legacy component.
4. The proposal summary omits duration. The public package intake and proposal intake ask guest count for regular events, but ask Indoor, Outdoor, or Indoor & Outdoor instead when the lowercased event name contains “outdoor” or “shoot”; the package intake passes this setting to the proposal, where it is required for inquiry submission and saved in booking notes. Premium is recommended for more than 600 guests or an Indoor & Outdoor shoot. Public duration controls offer Half Day and Full Day. A package's studio-configured 3-hour service tier remains honored but is not selectable by public users.
5. Booking submission creates `booking_requests` with Pending status, resolved service-tier snapshots, and package snapshot data; the confirmation's Done button returns the user to `/`.
6. Direct offline leads use the same booking model and historical snapshot helpers.
7. Admins can create a stable, tokenized proposal URL from Leads & Inquiries. The admin editor is the public proposal customizer with an admin-only save action; admin saves update the original inquiry's package, quote, service snapshots, and customizer state.
8. A client opening the token link can revise and resubmit to that same inquiry. The submitted data is stored in `proposalDraft`, moves the inquiry to In Discussion, and triggers the persistent admin alert. It does not replace the current approved quote or confirm the booking.

### Leads to calendar

1. Admin processes a booking with `In Discussion`, `Acknowledged`, or `Confirmed`.
2. Confirmation updates the booking.
3. Processing can create/update `calendar_schedule` entries for the start and end date range.
4. Confirmation creates `event_projects` at `Booking Confirmed` if none exists.
5. Multiple bookings can use the same date; date blocking is not a uniqueness constraint.
6. Removing a calendar entry cascades through its linked multi-day schedule entries, `event_projects`, payment bills, and linked `booking_requests`; unrelated entries on the same date remain.
7. A booking with an unreviewed `proposalDraft` cannot be confirmed. Admins must open the proposal editor and save the reviewed proposal first; final confirmation remains an explicit Leads & Inquiries action.
8. While authenticated, the Admin Dashboard refreshes studio state every five minutes. Leads & Inquiries also has a manual Refresh action; pending inquiries and newly resubmitted proposals trigger a persistent, manually dismissible alert.

### Payments and bills

1. Record payment in an event project's embedded `payments` array.
2. Generate a sequential `GKS-YYYY-NNNN` bill.
3. Copy project, booking, calendar, and package snapshot data into `bills`.
4. Store payment history, the current payment, cumulative-paid balance calculation, balance due, and payment stage. Bill ledgers display individual payments oldest to newest with dates and omit a cumulative-payment row.
5. Link payment -> bill with `billId` and `billNumber`.
6. Deleting a payment removes its associated bill and payment entry.
7. The bilingual modal prints only `#printable-bill-content`.

## 5. API Route Reference

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/studio` | Combined studio state |
| POST | `/api/bookings` | Create inquiry/lead |
| PATCH | `/api/bookings/[id]` | Status update or process/confirm booking |
| POST | `/api/bookings/[id]/proposal` | Admin-only stable proposal-token creation |
| GET/PATCH | `/api/proposals/[token]` | Read a single shared proposal; client resubmission or admin-only save |
| PUT/DELETE | `/api/schedule` | Upsert/delete calendar entry |
| GET | `/api/events` | List event definitions |
| POST | `/api/events` | Create event project or dynamic event |
| PATCH/DELETE | `/api/events/[id]` | Event project action or event definition update/delete |
| GET | `/api/services` | List/filter services |
| POST | `/api/services` | Admin create service |
| GET/PATCH/PUT/DELETE | `/api/services/[id]` | Get/update/delete service |
| GET/POST | `/api/packages` | List/create packages |
| PATCH/PUT/DELETE | `/api/packages/[id]` | Update/delete package |
| POST | `/api/packages/reorder` | Reorder package sort values |
| GET | `/api/bills` | List/filter bills |
| GET | `/api/bills/[id]` | Get one bill |
| POST | `/api/admin/bookings/[id]/payments` | Record payment and generate bill |
| POST/GET/DELETE | `/api/admin/auth` | PIN login/status/logout |
| POST | `/api/portfolio` | Add portfolio item |
| PATCH/DELETE | `/api/portfolio/[id]` | Update/delete portfolio item |

Mutating schedule, payment, event-project, package, service, and package-reorder routes, booking status/process actions, and proposal-token creation require a valid signed `gk_admin_session` cookie. The cookie is issued only after a valid six-digit `ADMIN_PIN` and expires after 12 hours. Configure `ADMIN_SESSION_SECRET` with a random value of at least 32 characters. On `/api/proposals/[token]`, client PATCH requests can only save an unapproved `proposalDraft`; admin PATCH requests require that cookie and commit the reviewed proposal to the inquiry.

## 6. UI and Development Conventions

- Public theme: deep emerald `#092E2B` / `#072421`, temple gold `#C5B378` / `#D8C78E`.
- Use Cormorant Garamond for display serif, Plus Jakarta Sans for body, Noto Serif Tamil for Tamil, and JetBrains Mono for technical/EXIF values.
- Use Radix dialogs and `max-h-[90vh]`/`max-h-[90dvh]` scroll containers.
- Prevent dialog close while asynchronous save/payment actions are in progress by handling pointer outside and Escape events.
- Radix/Bill modal cleanup must remove body `pointer-events` and `overflow` only after no dialogs remain.
- `@media print` hides surrounding UI and exposes `#printable-bill-content` only.
- Bill print layout uses A4 portrait, `8mm 10mm` margins, page-break guards, and bilingual line items.
- Time values should remain explicit string values; confirm display versus storage format before changing picker logic.
- Keep `strict: false` in mind; validate runtime values in API/server mutations even when TypeScript accepts them.
- Do not expose PIN or Mongo credentials. Documentation and logs must contain variable names only.
- Preserve slug/ID relationships: renaming a service must not change package links.
- Preserve text deliverables: package `deliverables` is a key-value text map and must not be replaced by an inferred list.
- Keep static fallback behavior intact: Mongo unavailable should fall back to defaults/disks rather than manufacturing successful writes.
- Do not infer a Mongo portfolio/admin/settings collection that does not exist.

## 7. Known Implementation Pitfalls

- `/api/bookings` forwards `durationTier`, `optedServices`, `totalAmount`, and `packageSnapshot`. Keep its input aligned with `createBookingOnServer` when adding booking fields.
- Package prices are recalculated dynamically and do not represent immutable historical package prices.
- `bills` generation uses legacy `BookingServiceOption` names plus modern `optedServices`; both flows may coexist.
- Some bill fields are derived heuristically from package name, customizer snapshot, booking notes, and calendar entry.
- `packageSnapshot` and `optedServices` should be the preferred historical sources for future bill improvements.
- Portfolio mutations are not backed by a `Portfolio` Mongoose model.
- `strict: false` is used in Mongo schemas, so unknown/legacy fields can exist; verify both TypeScript and runtime shape.
