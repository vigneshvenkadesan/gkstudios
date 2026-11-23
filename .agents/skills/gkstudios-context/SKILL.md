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
- `PORT`
- `DEFAULT_APP_PORT`
- `NGINX_PORT`

Mongo code prefers `MONGODB_STANDARD_URI`, then `MONGODB_URI`. The database default is `gkstudios_dev`. The scripts use `gk_studios` as their local fallback only. Admin PIN must be exactly six digits.

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
    events/                        Event definitions and production projects
    services/                      Master service pricing
    packages/                      Package CRUD/reorder
    bills/                         Bill lookup
    portfolio/                     Portfolio CRUD
    admin/auth/                    Six-digit PIN auth
src/components/
  PublicStudioPage.tsx             Public section orchestration
  PortfolioSection.tsx
  PackagesSection.tsx
  BookingSection.tsx
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
| `packages` | `Package` | Package tiers and service links |
| `services` | `Service` | Master pricing catalog |
| `events` | `Event` | Dynamic ceremony/event definitions |

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
| `eventTime` | string, optional | Stored time text/value |
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
| `eventDetails` | object | Event name, Tamil name, date, time, venue, plan |
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
| `pricing` | object/null | `{ threeHours, halfDay, fullDay }` |
| `isActive` | boolean | Public/admin availability |
| `displayOrder` | number | Sort order |
| `createdAt` | string | Optional |
| `updatedAt` | string | Optional |

Default/fallback services include traditional/candid photography and videography, drone, LED wall, TV, album, outdoor shoot, and other add-ons. Service slugs are immutable package mapping keys when service names change.

### `packages`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique, normally `pkg-*` |
| `eventId` | string | Event definition ID or legacy category mapping |
| `tier` | string | `essential`, `signature`, `premium` |
| `name` | string | Required |
| `audience` | string | Required in UI schema |
| `price` | number | Dynamically calculated, sorting/display |
| `currency` | string | Default `INR` |
| `priceLabel` | string | Display label |
| `duration` | string | Display text |
| `durationTier` | `threeHours \| halfDay \| fullDay` | Defaults/inferred for legacy packages |
| `includedServices` | `{ serviceSlug: string, quantity: number }[]` | Drives coverage display and base pricing |
| `availableAddons` | `{ serviceSlug: string, defaultQuantity?: number, label?: string }[]` | Legacy field; no longer configured in the Package Manager |
| `highlighted` | boolean | Most-popular flag |
| `featured` | boolean | Featured flag |
| `deliverables` | `Record<string, string>` | Custom text only: `Deliverables` plus custom categories; coverage/albums are derived from services |
| `customizer` | mixed | Legacy/customizer data |
| `imageUrl` | string | Public image URL |
| `image` | string | Legacy alias |
| `category` | string | Category text |
| `status` | `active \| inactive` | Default active |
| `displayOnPortfolio` | boolean | Public package visibility |
| `sortOrder` | number | 1, 2, 3 convention |
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
    { "serviceSlug": "traditional-camera", "quantity": 1 },
    { "serviceSlug": "candid-photography", "quantity": 1 }
  ],
  "availableAddons": [
    { "serviceSlug": "drone-aerial-coverage", "defaultQuantity": 1, "label": "Drone Aerial Coverage" }
  ],
  "deliverables": {
    "Deliverables": "4K cinematic highlight film",
    "Outdoor Portraits": "A dedicated couple portrait session"
  },
  "status": "active",
  "displayOnPortfolio": true,
  "sortOrder": 2
}
```

### `events`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable event identifier |
| `name` | string | Display name |
| `tamilName` | string | Optional |
| `category` | string | Group ID such as `wedding` or `birthday-kids` |
| `status` | `active \| inactive` | |
| `sortOrder` | number | |
| `createdAt` | string | |
| `updatedAt` | string | |

### Portfolio fallback structure

`PortfolioItem` fields: `id`, `title`, `category`, `location`, `imageUrl`, `shootNotes`, `exif`, `dateLabel`, `isHeroFeatured`, `isVisible`, `aspect` (`wide|standard`).

`data/studio-db.json` is a static seed/fallback file. Its current portfolio data is not a Mongo collection.

## 4. Core Workflows and Business Rules

### Single-source pricing

1. `services` is the pricing master for all live package/customizer calculations.
2. Tiered services use `pricing.threeHours`, `pricing.halfDay`, or `pricing.fullDay`.
3. Per-unit services use `unitPrice * quantity`, with `minQuantity` applied.
4. `calculatePackageBasePrice` in `src/lib/pricing.ts` sums package `includedServices`.
5. Legacy packages without `includedServices` use backward-compatible tier synthesis.
6. Package updates recalculate `price`; they do not independently trust a submitted package price.
7. `buildOptedServicesForPackage` and `calculateCustomizedEventPrice` create historical service snapshots.
8. `getDynamicPackageDisplaySections` derives “Event Coverage & Crew” and “Albums” from active service items for public cards, proposal customizer, and admin views. These derived sections must never be persisted in `packages.deliverables`; legacy documents are sanitized on package reads and writes.
9. `/api/packages/[id]` supports GET, PATCH/PUT, and DELETE by custom package `id`, with Mongo `_id` lookup as a fallback. Mutations require the `gk_admin_session=admin-session-v2` cookie; shared client requests include credentials.
10. The Admin Package Manager configures base services through `includedServices` and base feature toggles; it does not expose custom proposal add-on/downgrade editing or package-image upload. Existing package image data remains available to package cards. Proposal upgrades are built from active `services` catalog entries not included in the base, with prices recalculated from the selected duration tier and service quantity. Legacy `availableAddons` data is preserved but is not used to build the proposal upgrade list.

### Historical snapshot rule

Future service/package price edits must not rewrite old bookings or bills. Store:

- `durationTier`
- `optedServices` with service slug, name, category, pricing type, unit label, unit price, quantity, and line total
- `packageSnapshot`
- Bill package details and bill financial values

Past snapshots remain authoritative. A bill is a snapshot at payment time, and future service edits must not alter it.

Current implementation note: the public `/api/bookings` POST route declares and creates the booking but currently forwards no `durationTier`, `optedServices`, or `totalAmount` fields. Preserve these fields in route parsing/calls before making a public customizer snapshot implementation-dependent. `packageSnapshot` is forwarded.

### Public flow

1. `/` renders `PublicStudioPage`.
2. Package section offers a fast two-question intake: milestone event, then guest count.
3. Current guest categories are `<200`, `200-600`, and `>600`.
4. Proposal customizer allows event, base plan, service selections, quantities/add-ons, and review.
5. Booking submission creates `booking_requests` with Pending status by default.
6. Direct offline leads use the same booking model and historical snapshot helpers.

### Leads to calendar

1. Admin processes a booking with `In Discussion`, `Acknowledged`, or `Confirmed`.
2. Confirmation updates the booking.
3. Processing can create/update `calendar_schedule` entries for the start and end date range.
4. Confirmation creates `event_projects` at `Booking Confirmed` if none exists.
5. Multiple bookings can use the same date; date blocking is not a uniqueness constraint.

### Payments and bills

1. Record payment in an event project's embedded `payments` array.
2. Generate a sequential `GKS-YYYY-NNNN` bill.
3. Copy project, booking, calendar, and package snapshot data into `bills`.
4. Store paid-now, cumulative-paid, balance-due, and payment stage.
5. Link payment -> bill with `billId` and `billNumber`.
6. Deleting a payment removes its associated bill and payment entry.
7. The bilingual modal prints only `#printable-bill-content`.

## 5. API Route Reference

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/studio` | Combined studio state |
| POST | `/api/bookings` | Create inquiry/lead |
| PATCH | `/api/bookings/[id]` | Status update or process/confirm booking |
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

Mutating package, service, and package-reorder routes require `gk_admin_session=admin-session-v2`. The value is created only after a valid six-digit `ADMIN_PIN`.

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

- `/api/bookings` currently drops `durationTier`, `optedServices`, and `totalAmount` even though `StudioContext.submitBooking` sends them. This is a route-parity issue; update the route together with server code if changed.
- Package prices are recalculated dynamically and do not represent immutable historical package prices.
- `bills` generation uses legacy `BookingServiceOption` names plus modern `optedServices`; both flows may coexist.
- Some bill fields are derived heuristically from package name, customizer snapshot, booking notes, and calendar entry.
- `packageSnapshot` and `optedServices` should be the preferred historical sources for future bill improvements.
- Portfolio mutations are not backed by a `Portfolio` Mongoose model.
- `strict: false` is used in Mongo schemas, so unknown/legacy fields can exist; verify both TypeScript and runtime shape.
