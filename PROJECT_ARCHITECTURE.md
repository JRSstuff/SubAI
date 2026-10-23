# TubigLoop: Engineering Architecture & Development Rules

> **MANDATORY DIRECTIVE FOR ALL TASKS**:  
> Read and adhere strictly to this document before and during any code implementation, refactor, or feature addition. Every pull request, commit, and code block must conform to the standards outlined here.

---

## 1. Core Engineering Philosophy: "How We Build"

Our goal is not just to produce working features, but to build a **rock-solid, honest, ultra-responsive Progressive Web App (PWA)** that feels like a high-tier native application on mobile while providing a full-fledged command center on desktop.

We do **not** take shortcuts with mock success states, messy layouts, or unverified assumptions.

---

## 2. Server-Verified Truth & Action States (Rule 1)

### 2.1 The "Real OK" Principle
- **No False Positives**: When a user triggers an action (submitting an assignment, uploading evidence, updating status, verifying a batch), the UI **must never display an "OK" or "Success" confirmation unless the server and database have actually confirmed success with an authoritative response**.
- **No Blind Optimistic UI**: Do not immediately switch a button to "Done!" before the network request finishes. An action stays in a distinct **loading / in-flight state** until the server returns its response.
- **True Verification**:
  - `status === 200` (or `success: true` from Server Action) with valid payload $\rightarrow$ Display explicit, clear "OK / Success" state with confirmation feedback.
  - Any server error, database rejection, RLS failure, or network timeout $\rightarrow$ **Display the exact error message** returned by the server. Never swallow errors, never silently fail, and never show generic or misleading messages.

### 2.2 Form & Button State Machine
Every interactive action must follow this exact state machine:
```text
[IDLE] 
  ──(User Clicks)──> [LOADING: Disabled + Spinner + "Processing..."]
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
   [SERVER 200 OK]             [SERVER / NETWORK ERROR]
   - Button shows "Verified OK"  - Button re-enables
   - Toast/Alert with real data  - Red error banner / toast with exact error message
   - UI updates from response    - User input preserved for retry
```
- **Double-Submit Prevention**: Buttons MUST be disabled immediately upon submission and show a clear loading indicator.
- **Action Rollbacks**: If any multi-step action fails midway (e.g. storage upload succeeds but DB insert fails), the system must handle cleanup or report the exact step that failed.

---

## 3. Visual System & Brand Color Palette (Rule 2)

### 3.1 TubigLoop Official Color Palette
The visual theme reflects water clarity ("Tubig") combined with eco-circulation and recycling ("Loop").

| Token Name | Hex Code | RGB | Primary Purpose & Usage |
| :--- | :--- | :--- | :--- |
| **Tubig Blue (Primary)** | `#30AFFF` | `rgb(48, 175, 255)` | Main brand color, primary action buttons, active navigation indicators, key map route paths, primary focus rings. |
| **Aqua Clear (Secondary)** | `#92EEFF` | `rgb(146, 238, 255)` | Soft secondary accents, pill highlights, camera scan frames, subtle selection rings, active filter chips. |
| **Eco Mint (Loop Light)** | `#D8FFC5` | `rgb(216, 255, 197)` | Recycler partner tags, sustainability metrics, environmental score badges, drop-off point markers. |
| **Loop Green (Verified)** | `#C4F7CA` | `rgb(196, 247, 202)` | Server-verified "OK" indicators, successful AI evidence audit badges, task completed status. |

### 3.2 Strict Color Application Rules
- **ABSOLUTELY NO GRADIENTS**: Do not blend `#30AFFF` into `#92EEFF` or create rainbow/multi-color gradients. Every element uses **solid, flat, deliberate color tokens**.
- **High-Contrast Text Pairing (Accessibility)**:
  - When using `#30AFFF` as a background: Use crisp white text (`#FFFFFF`) with bold contrast.
  - When using `#92EEFF`, `#D8FFC5`, or `#C4F7CA` as backgrounds: Use **dark charcoal/slate text** (e.g., `#0F172A` or `#064E3B`), **NEVER white text**. Light pastels paired with white text fail WCAG accessibility standards.
- **Neutral Canvas**: Pair these brand colors with clean slate neutrals:
  - Surface base: `#FFFFFF` (pure white) and `#F8FAFC` (soft off-white).
  - Borders: `#E2E8F0` / `#CBD5E1` (clean, distinct bounding lines).
  - Primary text: `#0F172A` (deep slate).
  - Secondary text: `#475569` (readable muted slate).

---

## 4. UI Box Model, Spacing & Visual Discipline

### 4.1 The "Invisible Box" Isolation Principle
- **Zero Element Overlapping**: Every component, button, label, icon, and card exists within its own defined, invisible bounding container.
- **Strict Flexbox & Grid Discipline**:
  - Never use negative margins or absolute positioning hacks to position standard page content.
  - Every layout container must have explicit gap definitions (`gap-2`, `gap-3`, `gap-4`, `gap-6`) and padding (`p-3`, `p-4`, `p-6`).
  - Elements must be enclosed in containers with defined flow (`flex flex-col`, `flex flex-row items-center`, `grid grid-cols-...`).
- **Touch Target Integrity**:
  - Minimum touch target for all buttons and interactive controls is **44px × 44px** on mobile to prevent accidental taps.
  - Adequate padding and margin separation between clickable actions.

### 4.2 Dual-Device Discipline: Never Forget Desktop or Mobile
We never build a mobile-only screen that stretches into a stretched mess on desktop, and we never build a desktop-only screen that breaks on mobile.

| Dimension | Mobile Experience (Field Personnel) | Desktop Experience (Admin / Dispatcher) |
| :--- | :--- | :--- |
| **Navigation** | Fixed bottom navigation bar with tactile touch icons + top minimal app bar. | Persistent collapsible sidebar with full route labels, user status, and breadcrumbs. |
| **Layout Width**| Full-bleed width with comfortable safe-area padding (`px-4`, `pb-20` for bottom bar). | Contained max-width layout (`max-w-7xl` or dynamic fluid dashboard grid). |
| **Information Density** | Focused single-column card flows; swipe-friendly tabs; bottom sheets for details. | Multi-column layouts: side-by-side split map & task lists, dense data tables with search/filter. |
| **Actions** | Large prominent Floating Action Button (FAB) or sticky bottom CTA for primary action. | Header action bars, inline table action menus, and modal dialogs. |

---

## 5. Camera & Media Capture Protocol (Rule 3)

### 5.1 Smooth, Native-Feeling Camera Flow
- **Direct Native Trigger**: Mobile devices must invoke the device's native hardware camera viewfinder using `<input type="file" accept="image/*" capture="environment" />` or modern WebRTC `MediaDevices.getUserMedia` with back-camera priority (`facingMode: { ideal: "environment" }`).
- **Client-Side Compression Pipeline**:
  - Captured smartphone photos (often 5MB to 15MB) **must be resized and compressed on the client before upload** (target: $\le 1200\text{px}$ width, $\le 800\text{KB}$, WebP/JPEG format).
  - Keeps upload fast even on 3G/4G connections and prevents server payload limit timeouts.
- **Clean Preview Box**:
  - Before uploading, display the captured image in a dedicated, bounded image box with aspect ratio control (`aspect-video` or `aspect-[4/3]`, `object-cover`, rounded corners, `#E2E8F0` solid border).
  - Clear, accessible actions below the box: **"Retake Photo"** and **"Analyze & Confirm"**.

### 5.2 Gemini AI Multimodal Vision Pipeline
1. **Transmission**: Send optimized image data via Next.js Server Action / Route Handler to ensure Gemini API credentials remain secure on the server.
2. **Strict Schema Prompts**: Always prompt Gemini with explicit JSON schemas to return structured output (e.g. item count, condition grade, damage flags, confidence score).
3. **Double Verification**: Present the AI's detection to the field personnel on-screen (e.g., *"Detected: 5 Water Jugs (All Intact)"*). Allow the personnel to confirm or adjust the count before the final write to the database.
4. **Audit Immutability**: Store both the raw image reference, the AI interpretation, and the personnel's final confirmed numbers in the database audit log.

---

## 6. Technology Standards & Code Conventions

### 6.1 Architecture Layers
1. **Frontend / UI Layer**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS (configured with the 4 brand color tokens), Lucide Icons, Radix UI / shadcn primitives.
2. **Serverless API / Action Layer**: Next.js Server Actions with strict Zod validation and structured return types:
   ```typescript
   export type ActionResult<T> = 
     | { success: true; data: T; message: string }
     | { success: false; error: string; details?: unknown };
   ```
3. **Database & Storage Layer**: Supabase PostgreSQL with Row-Level Security (RLS) enabled on all tables, Supabase Auth, and Supabase Storage bucket `evidence-photos`.
4. **Mapping Layer**: Leaflet + React-Leaflet with OpenStreetMap / CARTO raster tiles, dynamic client-side loading to prevent SSR `window is not defined` errors.
5. **AI Layer**: `@google/genai` (Gemini 2.5 Flash) with structured vision analysis.

### 6.2 Environment & Configuration Safety
- Never hardcode API keys, URLs, or secrets in client-side code.
- Always validate environment variables at startup (`process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.GEMINI_API_KEY`, etc.).
- When an environment variable is missing, display an explicit setup instruction instead of crashing silently.

---

## 7. Pre-Implementation Checklist

Every time a feature or task is tackled, run through this checklist before considering the task complete:

- [ ] **Real Server Response**: Does the feature wait for the server's actual confirmation before saying "OK"?
- [ ] **Error Visibility**: If the network is cut or the server fails, does the UI show the exact error message?
- [ ] **Button State**: Is the button disabled with a loading indicator while the action is running?
- [ ] **Exact Brand Palette**: Are colors strictly using `#30AFFF`, `#92EEFF`, `#D8FFC5`, `#C4F7CA` and clean slate neutrals?
- [ ] **No Gradients**: Is the UI clean, solid, and completely free of gradients?
- [ ] **Legible Contrast**: Is dark slate text used over light pastels (`#92EEFF`, `#D8FFC5`, `#C4F7CA`)?
- [ ] **Invisible Box Isolation**: Do all UI elements sit within clear, non-overlapping flex/grid containers with proper padding and gaps?
- [ ] **Mobile & Desktop Responsive**: Does this screen look great and work naturally on both a 375px mobile screen and a 1440px desktop monitor?
- [ ] **Smooth Media Handling**: If camera/photo is involved, is the image compressed before transit and displayed with a clear preview/retake flow?
- [ ] **Zero TypeScript Errors**: Does the code compile cleanly without `any` abuse or unchecked nulls?
