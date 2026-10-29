# SubAI CDO

<p align="center">
  <img src="./public/LogoWithText.png" alt="SubAI Logo" width="360" />
</p>

<p align="center">
  <strong>Urban Drainage Obstruction Triage, Verified Circular Waste Recovery, and Rainwater Reserves for Cagayan de Oro City.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.4.2-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.3.0-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFA000?logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Google_Gemini-Vision_AI-4285F4?logo=google" alt="Gemini Vision" />
  <img src="https://img.shields.io/badge/Leaflet-GIS_Mapping-199900?logo=leaflet" alt="Leaflet" />
</p>

---

## Overview

**SubAI** is a mobile-first Progressive Web App (PWA) engineered to mitigate urban monsoon flash-flooding across Cagayan de Oro City (CDO). The platform coordinates photographic culvert obstruction reporting, automated multimodal Vision AI material categorization, priority dispatch triage, verified scale weighing, and circular materials recovery facility (MRF) handovers.

---

## The Closed-Loop Workflow

```text
  [ Reporter ] ──► [ Reviewer ] ──► [ Collector ] ──► [ Recycler ] ──► [ Admin ]
    /report          /review          /tasks           /dashboard        /admin
  Photo + AI Tag   Triage & Score   Weigh & Clear    Audit Handover   User & Site Ops
```

1. **Photographic Reporting (`/report`)**:
   - **Dual-Input Camera Capture**: Direct mobile camera shutter (`capture="environment"`) or gallery file picker.
   - **Client-Side Image Compression**: Instant HTML5 Canvas downscaling (<100ms) to 960×960 @ 0.72 JPEG to ensure zero upload latency even on spotty cellular connections.
   - **Gemini Vision AI Engine**: Fast multimodal scan (~1.5s) detecting material fractions (PET bottles, flexible plastics/sachets, silt/mud, organic debris, residual waste, rubble).
   - **Manual Customization**: Toggleable material chips, custom material inputs, and drainage classification tags (*Curb Inlet*, *Catch Basin*, *Open Canal*, *Culvert*, *Creek Outfall*).
   - **Required Map Pinning**: OpenStreetMap pinning with automated Nominatim reverse geocoding for CDO streets, landmarks, and barangays.
   - **Verification Celebration**: Full-screen confirmation overlay with haptic feedback upon submission.

2. **Drainage Map Explorer (`/map`)**:
   - **Split Explorer Mode**: Side-by-side interactive Leaflet map and live Street Feed displaying all reported culvert blockages.
   - **On-Map Details Drawer**: Clicking any pin opens a non-dismissing card directly over the map with the **full obstruction description**, photo thumbnail, priority band, and GPS coordinates.
   - **Click-to-Zoom Lightbox**: Tap any photo thumbnail to inspect the culvert blockage in full-screen high resolution.
   - **Multiple View Modes**: 1-tap switcher between **Explorer** (Split Map + Streets), **Map Only** (Full-screen map), and **List View** (Document cards).

3. **Triage & Priority Dispatch (`/review`)**:
   - Triage queue for municipal coordinators to inspect culvert photos, assess obstruction severity (1–3) and traffic/drainage disruption (1–3), and assign work orders to field crews.

4. **Collector Operations Hub (`/tasks`)**:
   - **Metric KPI Cards**: Real-time counters for Active Tasks, Completed Collections, Total Kilograms Diverted, and Urgent High-Priority Blockages.
   - **Live Search & Priority Filters**: Search by street name, culvert reference number (`#SA-2026-XXXX`), or task ID, with 1-tap filtering across *High*, *Medium*, and *Low* priority.
   - **Field-Friendly 1-Tap Scale Increments**: Quick `+1kg`, `+5kg`, and `+10kg` buttons for rapid logging of PET bottles, flexible bags, residual trash, and silt.
   - **Before & After Visual Evidence**: Capture timestamped photos proving culvert clearance before archiving.
   - **Instant Status Transition**: Submitting a collection immediately moves the record to the **Completed** tab with a confirmation banner.

5. **Circular Materials & Audit Telemetry (`/dashboard` & `/rain-bank`)**:
   - **Mass Balance Accounting**: Reconciles total mass collected against accepted recycling mass, residual waste, and silt.
   - **MRF Handover Receipts**: Generates auditable digital chain-of-custody handovers to partner recyclers with JSON export.
   - **Rain Bank Simulator**: Hydrological runoff models calculating rainwater retention yield and non-potable municipal substitution.

6. **System Governance & RBAC Portal (`/admin`)**:
   - Comprehensive role administration (Reporter, Reviewer, Collector, Recycler, Administrator).
   - Municipal site configurations and system security governance.

---

## Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16.4.2](https://nextjs.org/) | App Router, Turbopack, Server Actions, & Route Handlers |
| **Runtime & UI** | [React 19.3.0](https://react.dev/) / TypeScript 5 | Modern React with Server Components and Hooks |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Flat solid color tokens, strictly zero gradients |
| **Database** | [Cloud Firestore](https://firebase.google.com/docs/firestore) | Real-time NoSQL document database with strict security rules |
| **Authentication** | [Firebase Auth](https://firebase.google.com/docs/auth) | Email/password authentication with RBAC user profiles |
| **AI Vision Engine** | [Google Gemini API](https://ai.google.dev/) | Multimodal fast-cascade with 6s timeout and structured JSON mode |
| **Mapping & GIS** | [Leaflet 1.9.4](https://leafletjs.com/) | OpenStreetMap raster tiles, custom SVG markers, and automated Nominatim reverse geocoding |
| **Icon Pack** | [Lucide React 1.61.0](https://lucide.dev/) | Consistent, accessible iconography |
| **Image Processing** | HTML5 Canvas API | High-speed client-side image compression for low-bandwidth mobile networks |
| **Branding & Assets** | Multi-size ICO & PNG | Custom brand identity with 16px to 512px app icons and manifest |

---

## Role-Based Access Control (RBAC)

SubAI enforces strict route boundaries based on authenticated user roles:

| Role | Allowed Routes | Home Route | Primary Function |
| :--- | :--- | :--- | :--- |
| **Community Reporter** | `/report`, `/map` | `/report` | Submits photo evidence, custom materials, and pinned locations |
| **Reviewer & Dispatch** | `/review`, `/map`, `/dashboard` | `/review` | Triages incoming reports, assigns priority scores and work orders |
| **Authorized Collector** | `/tasks`, `/map` | `/tasks` | Conducts field clearing, captures after-photos, and logs scale weights |
| **Partner Recycler** | `/dashboard`, `/tasks`, `/map` | `/dashboard` | Receives diverted plastic batches and verifies recovery receipts |
| **System Administrator** | All routes (`/admin`, `/rain-bank`, etc.) | `/admin` | Manages users, reassigns roles, and oversees system governance |

---

## Design Standards & Architectural Rules

All development adheres to [`PROJECT_ARCHITECTURE.md`](./PROJECT_ARCHITECTURE.md):

1. **Server-Verified Truth (Rule 1)**:
   - The UI never assumes success or displays optimistic confirmations before authoritative server responses. Exact server errors are shown if database operations fail.
2. **Official 4-Color Palette (Rule 2)**:
   - **SubAI Blue (Primary)**: `#30AFFF`
   - **Aqua Clear (Secondary)**: `#92EEFF`
   - **Eco Mint (Accent)**: `#D8FFC5`
   - **Verified Green (Success)**: `#C4F7CA`
   - **Strictly Zero Gradients**: All surfaces use flat, deliberate, solid colors.
3. **Microcopy Standard**:
   - Action buttons strictly use **1–2 words** (`Submit`, `Pin`, `Weigh`, `View`, `Camera`, `Files`).
   - Headings and input labels use concise **1–3 words** without redundant phrasing.
4. **Dual Device Parity**:
   - Mobile: Floating 5-slot bottom capsule with an elevated center action button.
   - Desktop: Full command center dashboard with top navigation.

---

## Project Structure

```text
SubAI/
├── public/
│   ├── LogoWithText.png       # Official logo with branding typography
│   ├── logo512x512.png        # Transparent brand mark (512×512)
│   ├── icon-192x192.png       # PWA standard manifest icon
│   ├── favicon.ico            # Multi-resolution browser tab icon
│   ├── sw.js                  # PWA offline service worker
│   └── manifest.json          # Progressive Web App manifest
├── src/
│   ├── app/
│   │   ├── actions/           # Next.js Server Actions (operations, auth)
│   │   ├── admin/             # System governance & RBAC administration
│   │   ├── api/               # REST API endpoints (reports, auth, admin)
│   │   ├── dashboard/         # Circular material mass balance & MRF telemetry
│   │   ├── map/               # Interactive CDO drainage explorer & street feed
│   │   ├── rain-bank/         # Rainwater harvesting retention models
│   │   ├── report/            # Multimodal photo reporting & required map pin
│   │   ├── review/            # Triage & dispatch queue
│   │   ├── tasks/             # Field collection weighing & task organizer
│   │   ├── apple-icon.png     # Next.js App Router touch icon
│   │   ├── icon.png           # Next.js App Router browser icon
│   │   ├── favicon.ico        # Root application favicon
│   │   ├── globals.css        # Tailwind v4 theme tokens
│   │   ├── layout.tsx         # Root app layout & metadata
│   │   └── page.tsx           # Landing & authentication stage
│   ├── components/
│   │   ├── auth/              # Dual-panel sliding login/register cards & splash
│   │   ├── layout/            # Responsive navigation & mobile capsule
│   │   ├── map/               # Leaflet map component with GPS pinning & popups
│   │   └── pwa/               # PWA hardware optimization & install prompt
│   └── lib/
│       ├── cdo-geocode.ts     # OpenStreetMap Nominatim reverse geocoder
│       ├── firebase/          # Firebase Auth, Firestore client & services
│       ├── gemini.ts          # Gemini multimodal vision cascade
│       └── image-compress.ts  # Client-side canvas image downscaling
├── firebase.json              # Firebase Auth & Firestore rules configuration
├── firestore.rules            # Firestore security rules and role validators
├── firestore.indexes.json     # Firestore database index definitions
├── .firebaserc                # Active Firebase project link (flowloop-f621b)
├── next.config.ts             # Next.js 16 configuration
└── package.json               # Dependencies & build scripts
```

---

## Getting Started

### Prerequisites
- Node.js 20+ (Node.js 22 or 24 recommended)
- npm 10+
- A Firebase project (`flowloop-f621b`) with Authentication (Email/Password) and Cloud Firestore enabled
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JRSstuff/SubAI.git
   cd SubAI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env.local`:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=flowloop-f621b.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=flowloop-f621b
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=flowloop-f621b.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Google Gemini API Key
   GEMINI_API_KEY=your_google_ai_studio_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

To create an optimized production build:
```bash
npm run build
npm run start
```

---

## License

This project is developed for the CEIW 2026 circular drainage and rainwater resilience pilot in Cagayan de Oro City. All rights reserved.
