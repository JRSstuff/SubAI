# TubigLoop CDO

> **Urban & Campus Drainage Obstruction Triage, Verified Waste Recovery, and Rainwater Reserves for Cagayan de Oro City.**

TubigLoop CDO is a mobile-first Progressive Web App (PWA) designed to mitigate urban and campus monsoon flooding across Cagayan de Oro (CDO). The platform coordinates photographic obstruction reporting, automated Vision AI material categorization, priority dispatch, verified scale weighing, and circular materials recovery facility (MRF) handovers.

---

## The Workflow

```text
  [ Reporter ] ──► [ Reviewer ] ──► [ Collector ] ──► [ Recycler ] ──► [ Admin ]
   /report          /review          /tasks           /dashboard        /admin
  Photo + AI Tag   Triage & Score   Weigh & Clear    Audit Handover   User & Site Ops
```

1. **Photographic Reporting (`/report`)**:
   - Dual-input camera capture (direct mobile camera or file gallery picker).
   - Instant client-side HTML5 Canvas compression (<100ms) downscaling to 960×960 @ 0.72 JPEG.
   - Ultra-fast multimodal Vision AI scan (~1.5s) detecting material fractions (PET bottles, plastics/sachets, silt/mud, organic debris, residual waste, rubble).
   - Full manual customization: toggleable material chips, custom material inputs, and drainage classification tags (*Curb Inlet*, *Catch Basin*, *Open Canal*, *Culvert*, *Creek Outfall*).
   - Required map pinning with full-screen map viewer and automated OpenStreetMap Nominatim reverse geocoding for CDO streets and barangays.
   - Satisfying Google Pay-style full-screen verification celebration with mobile haptic feedback.

2. **Citywide Drainage Map (`/map`)**:
   - Interactive Leaflet map displaying active and cleared obstruction markers across Cagayan de Oro City.
   - High/Medium/Low priority color coding, popups with reference IDs, and GPS auto-center.

3. **Triage & Priority Dispatch (`/review`)**:
   - Triage queue for maintenance coordinators to inspect photos, adjust obstruction scores (1–3) and disruption scores (1–3), and dispatch field work orders.

4. **Task Execution & Scale Weighing (`/tasks`)**:
   - Authorized maintenance collectors record cleanup tasks, upload before & after photo evidence, and log verified scale weights (kg) for PET bottles, flexible packaging, silt, and residual waste.

5. **Circular Materials & Audit Telemetry (`/dashboard` & `/rain-bank`)**:
   - Circular diversion metrics tracking mass balance (diverted recyclable mass vs. landfill mass).
   - Custody transfer handovers to partner recyclers and MRFs with one-click JSON audit export.
   - Rain Bank runoff divert models demonstrating rainwater retention capacity.

6. **System Administration & RBAC Portal (`/admin`)**:
   - Role management (promoting/demoting users across Reporter, Reviewer, Collector, Recycler, Admin).
   - Campus/municipal site management and system health overview.

---

## Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16.4.2](https://nextjs.org/) | App Router, Turbopack, Server Actions, & Route Handlers |
| **Runtime & UI** | [React 19.3.0](https://react.dev/) / TypeScript 5 | Modern React with Server Components and Hooks |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Flat solid color tokens, strictly zero gradients |
| **Database** | [Cloud Firestore](https://firebase.google.com/docs/firestore) | Real-time NoSQL document database with strict security rules |
| **Authentication** | [Firebase Auth](https://firebase.google.com/docs/auth) | Email & password authentication with RBAC user profiles |
| **AI Vision Engine** | [Google Gemini API](https://ai.google.dev/) | `gemini-3.5-flash-lite` & `gemini-flash-lite-latest` fast-cascade with 6s timeout and structured JSON mode |
| **Mapping & GIS** | [Leaflet 1.9.4](https://leafletjs.com/) | OpenStreetMap raster tiles, custom SVG markers, and automated Nominatim reverse geocoding |
| **Icon Pack** | [Lucide React 1.61.0](https://lucide.dev/) | Consistent, accessible iconography |
| **Image Processing** | HTML5 Canvas API | High-speed client-side image compression for low-bandwidth mobile networks |

---

## Role-Based Access Control (RBAC)

TubigLoop enforces strict route boundaries based on authenticated user roles:

| Role | Allowed Routes | Home Route | Primary Function |
| :--- | :--- | :--- | :--- |
| **Reporter** | `/report`, `/map` | `/report` | Submits photo evidence, custom materials, and pinned locations |
| **Reviewer** | `/review`, `/map`, `/dashboard` | `/review` | Triages incoming reports, assigns priority scores and tasks |
| **Collector** | `/tasks`, `/map` | `/tasks` | Conducts field clearing, captures after-photos, and logs scale weights |
| **Recycler** | `/dashboard`, `/tasks`, `/map` | `/dashboard` | Receives diverted plastic batches and verifies recovery receipts |
| **Admin** | All routes (`/admin`, `/rain-bank`, etc.) | `/admin` | Manages users, reassigns roles, and configures campus sites |

---

## Design Standards & Architectural Rules

All development follows the specifications outlined in [`PROJECT_ARCHITECTURE.md`](./PROJECT_ARCHITECTURE.md):

1. **Server-Verified Truth (Rule 1)**:
   - The UI never assumes success or displays optimistic confirmations before authoritative server responses. Exact server errors are shown if database operations fail.
2. **Official 4-Color Palette (Rule 2)**:
   - **Tubig Blue (Primary)**: `#30AFFF`
   - **Aqua Clear (Secondary)**: `#92EEFF`
   - **Eco Mint (Accent)**: `#D8FFC5`
   - **Loop Green (Success)**: `#C4F7CA`
   - **Strictly Zero Gradients**: All surfaces use flat, deliberate, solid colors.
3. **Microcopy Standard**:
   - Action buttons strictly use **1–2 words** (`Submit`, `Pin`, `View`, `Change`, `Camera`, `Files`).
   - Headings and input labels use concise **1–3 words** without redundant phrasing.
4. **Dual Device Parity**:
   - Mobile: Floating 5-slot bottom capsule with an elevated center action FAB.
   - Desktop: Full command center dashboard with side navigation.

---

## Project Structure

```text
TubigLoop/
├── src/
│   ├── app/
│   │   ├── actions/           # Next.js Server Actions (operations, auth)
│   │   ├── admin/             # Admin management portal
│   │   ├── api/               # REST API endpoints (auth, admin)
│   │   ├── dashboard/         # Circular material mass balance & MRF telemetry
│   │   ├── map/               # Interactive CDO drainage map
│   │   ├── rain-bank/         # Rainwater harvesting retention models
│   │   ├── report/            # Multimodal photo reporting & required map pin
│   │   ├── review/            # Triage & dispatch queue
│   │   ├── tasks/             # Field collection weighing & custody transfers
│   │   ├── globals.css        # Tailwind v4 theme tokens
│   │   ├── layout.tsx         # Root app layout
│   │   └── page.tsx           # Landing & authentication stage
│   ├── components/
│   │   ├── auth/              # Role-tabbed login/register cards
│   │   ├── layout/            # Navbar, mobile capsule, and desktop header
│   │   └── map/               # Leaflet map container with GPS & pinning
│   └── lib/
│       ├── cdo-geocode.ts     # OpenStreetMap Nominatim reverse geocoder
│       ├── firebase/          # Firebase Auth, Firestore client & services
│       ├── gemini.ts          # Gemini Flash Lite multimodal vision cascade
│       └── image-compress.ts  # Client-side canvas image downscaling
├── firebase.json              # Firebase Auth & Firestore rules configuration
├── firestore.rules            # Firestore security rules and role validators
├── firestore.indexes.json     # Firestore database index definitions
├── .firebaserc                # Active project link (flowloop-f621b)
├── next.config.ts             # Next.js 16 configuration
└── package.json               # Dependencies & build scripts
```

---

## Getting Started

### Prerequisites
- Node.js 20+ (Node.js 24 recommended)
- npm 10+
- A Firebase project (`flowloop-f621b`) with Authentication (Email/Password) and Cloud Firestore enabled
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JRSstuff/TubigLoop.git
   cd TubigLoop
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
