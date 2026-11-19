---
name: gkstudios-context
description: >-
  Provides comprehensive domain context, architecture, component maps, data models, and workflow guidelines for GK STUDIOS (South Indian wedding & event photography web app). Activate when working on features, bug fixes, UI enhancements, or backend logic for GK Studios.
---

# GK STUDIOS — Application Context & Architecture Guide

This skill documents the complete technical, operational, and domain context for **GK STUDIOS** to guide code development while minimizing token consumption.

---

## 1. Domain & Brand Identity

- **Studio Name**: GK STUDIOS (*"Creating Memories"*)
- **Lead Photographer & Cinematographer**: G Krishna
- **Location**: Chennai Highway, Kandarakkottai, Panruti (Tamil Nadu)
- **Service Region**: Panruti · Cuddalore · Villupuram · Tindivanam · Chennai & across Tamil Nadu
- **Contact**: `+91 7418543123` | `gkstudios@gmail.com`
- **Core Specialization**: Traditional South Indian rituals, Iyer weddings (Vratham, Kashi Yatra, Oonjal, Muhurtham), temple mandapam weddings, Kaathu Kuthi (ear piercing), Seemantham, first birthdays, and outdoor cinematic sessions.
- **Delivery Promises**:
  - Raw photo selection preview link or home visit within 7 days.
  - Complete Karizma layflat photo album & 4K cinematic highlight film delivery in 30 days.

---

## 2. Technical Stack & Key Conventions

- **Framework**: Next.js 16 (`app` router) + React 19 + TypeScript.
- **Styling**: Tailwind CSS v4 with custom brand palette:
  - Deep Emerald: `#092E2B` (primary surface), `#072421` (admin dark)
  - Temple Gold: `#C5B378`, `#D8C78E` (accents, borders, badges)
  - Light mode surface: `#F8FAF9` / `#E6ECEB`
- **Typography**:
  - Heading Serif: Cormorant Garamond (`--font-cormorant`)
  - Body Sans: Plus Jakarta Sans (`--font-plus-jakarta`)
  - Tamil Serif: Noto Serif Tamil (`--font-tamil-serif`)
  - Monospace / EXIF: JetBrains Mono (`--font-jetbrains`)
- **Animation**: `motion/react` v12 with `useReducedMotion` checking across all animated components.
- **UI & Helpers**: Lucide React, Radix UI Dialog & Tabs, Sonner toast notifications.
- **Database**: MongoDB via Mongoose 9 (`booking_requests`, `calendar_schedule`, `event_projects`).
- **Static Seed / Cache**: `data/studio-db.json` for portfolio items and package defaults.

---

## 3. Directory & File Map

```
gkstudios/
├── data/
│   └── studio-db.json               # Seed portfolio & packages
├── scripts/
│   ├── dev.mjs                      # Custom dev runner (node scripts/dev.mjs)
│   ├── start.mjs                    # Production starter
│   └── mongo-check.mjs              # MongoDB ping diagnostic
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Public homepage (renders PublicStudioPage)
│   │   ├── layout.tsx               # Root layout, Google fonts, StudioProvider
│   │   ├── globals.css              # Tailwind v4 theme, fonts, custom utilities
│   │   ├── admin/page.tsx           # Admin dashboard route (/admin)
│   │   └── api/
│   │       ├── admin/auth/route.ts  # PIN auth session (gk_admin_session cookie)
│   │       ├── bookings/            # Booking inquiry CRUD
│   │       ├── events/              # Event production pipeline & payment CRUD
│   │       ├── portfolio/           # Portfolio CRUD
│   │       ├── schedule/            # Calendar day entries CRUD
│   │       └── studio/              # Combined studio state & reset endpoints
│   ├── components/
│   │   ├── PublicStudioPage.tsx     # Public root orchestrator & hash router
│   │   ├── Navbar.tsx               # Top nav with language & theme toggles
│   │   ├── HeroSection.tsx          # Carousel with EXIF data & slide indicators
│   │   ├── DeliveryPromiseSection.tsx # 7-day selection & 30-day delivery stages
│   │   ├── PortfolioSection.tsx     # Categorized grid & lightbox modal
│   │   ├── PackagesSection.tsx      # Tiered package cards + direct select
│   │   ├── StudioAboutSection.tsx   # Studio story, gear, team, and location
│   │   ├── BookingSection.tsx       # Date reservation & multi-service selector
│   │   ├── Footer.tsx               # Footer with links & hidden admin entrance
│   │   ├── MandalaAccents.tsx       # Reusable SVG cultural decorations
│   │   └── admin/
│   │       ├── AdminDashboard.tsx   # Authenticated tabs & stats overview
│   │       ├── AdminBookingModule.tsx      # Leads & Inquiries management (online & offline referrals)
│   │       ├── AdminScheduleModule.tsx     # Calendar & date blocks
│   │       ├── AdminEventsTimelineModule.tsx # 6-stage ERP & payments
│   │       └── AdminGalleryModule.tsx      # Portfolio upload & metadata edit
│   ├── context/
│   │   ├── StudioContext.tsx        # Global store hook (useStudio)
│   │   └── PublicPreferencesContext.tsx # Locale ('en'|'ta') & theme ('dark'|'light')
│   ├── i18n/
│   │   └── translations.ts          # Comprehensive English & Tamil dictionaries
│   ├── lib/
│   │   └── utils.ts                 # Date formatters, INR currency, WhatsApp link
│   ├── server/
│   │   ├── mongodb.ts               # Mongoose connection & Schemas
│   │   └── studioStore.ts           # Unified data access layer & fallback logic
│   └── types/
│       └── studio.ts                # TypeScript interfaces & types
```

---

## 4. Key Data Models (`src/types/studio.ts`)

### `BookingRequest` (Collection: `booking_requests`)
- `id`: string (e.g., `bk-173...`)
- `referenceCode`: string (e.g., `GK-2611-102`)
- `clientName`, `phone`, `venue`, `notes`: strings
- `eventType`: CoreEventCategory (`Weddings`, `Traditional Ceremonies`, `Family Celebrations`, `Portraits & Outdoor Shoots`, `Corporate Events`)
- `preferredDate`, `endDate` (optional), `eventTime` (optional)
- `packageId`, `packageName`, `quotedAmount`
- `requestedServices`: Array of `BookingServiceOption` (`Traditional Camera`, `Candid Camera`, `Candid Video`, `Traditional Video`, `Drone`, `TV`, `LED Wall`)
- `status`: `'Pending'` | `'In Discussion'` | `'Acknowledged'` | `'Confirmed'` | `'Declined'`
- `source`: optional string (e.g. `'Direct Referral'`, `'Phone Call'`, `'Walk-in Studio Visit'`, `'Website Inquiry'`)
- `assignedCrew`, `acknowledgementNote`

### `CalendarDayEntry` (Collection: `calendar_schedule`)
- `id`: string
- `date`: string (`YYYY-MM-DD`)
- `status`: `'Booked'` | `'Limited'`
- `title`, `eventType`, `clientName`, `venue`, `assignedCrew`, `notes`, `bookingId`, `phone`, `time`, `requestedServices`

### `EventProject` (Collection: `event_projects`)
- `id`, `bookingId`, `referenceCode`, `clientName`, `phone`, `eventType`, `eventDate`, `endDate`, `venue`, `packageName`, `assignedCrew`
- `currentStage`:
  1. `Booking Confirmed`
  2. `Pre-Shoot Briefing`
  3. `Shoot Completed`
  4. `Editing & Selection`
  5. `Album & Film Ready`
  6. `Delivered`
- `stageUpdates`: Record of `{ completedAt, note }` for each completed stage
- `agreedAmount`, `extraCharges`, `discount`
- `payments`: Array of `PaymentRecord` (`{ id, date, label, amount, method, referenceNote }`)
- `deliveryNotes`: string

---

## 5. Administrative Workflows

- **Accessing Admin**: Navigate to `/admin` or press `Ctrl+Shift+A` (`Cmd+Shift+A`).
- **Authentication**: PIN validated against `ADMIN_PIN` env variable (fallback `1234`). Sets httpOnly `gk_admin_session` cookie. Demo login button available for testing.
- **Confirming a Booking**:
  - In `AdminBookingModule`, choosing "Confirm Booking" automatically:
    1. Updates booking status to `Confirmed`.
    2. Inserts/locks the selected dates in `calendar_schedule` as `Booked`.
    3. Auto-creates an active `EventProject` in `event_projects` at the `Booking Confirmed` stage.
- **Multiple Orders on Same Date**: The studio supports concurrent crews and multiple simultaneous orders/leads on the same date. Date-blocking error restrictions are removed so multiple bookings can be confirmed, tracked, and scheduled on the same date.
- **Financial Balances**:
  - `Net Total = agreedAmount + extraCharges - discount`
  - `Paid Total = sum(payments[].amount)`
  - `Balance Due = Net Total - Paid Total`

---

## 6. Development & Run Commands

```powershell
# Development server (starts Next.js dev on http://localhost:3000)
npm run dev

# Run TypeScript type check
npm run lint

# Test MongoDB connection
node scripts/mongo-check.mjs

# Build for production
npm run build
```

---

## 7. Environment Variables (`.env.local`)

- `ADMIN_PIN`: Secret 4+ digit PIN for admin dashboard (default: `1234`)
- `MONGODB_URI`: Primary MongoDB connection string
- `MONGODB_STANDARD_URI`: Alternative standard (non-SRV) MongoDB URI
- `MONGODB_DATABASE`: Target database name (default: `gk_studios`)
