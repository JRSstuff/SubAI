# TubigLoop

The app focuses purely on coordinating information, assignments, and evidence—physical handling is done by authorized maintenance personnel and partner recyclers.

---

## Overview

TubigLoop is a Progressive Web App (PWA) built for circular water container logistics and recycling audit trails.

- **Mobile Experience**: Field maintenance personnel & partner recyclers interface for viewing assignments, GPS routing, camera evidence capture, and Gemini AI multimodal container verification.
- **Desktop Experience**: Command and dispatch dashboard for administrators to monitor collection loops, verify custody, and review audit logs.

## Tech Stack

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Storage**: [Supabase](https://supabase.com/)
- **AI Engine**: Google Gemini Multimodal Vision API
- **Deployment**: Vercel Serverless

## Development & Architecture Rules

All code and contributions must follow the guidelines specified in [`PROJECT_ARCHITECTURE.md`](./PROJECT_ARCHITECTURE.md):
- **Server-Verified Truth (Rule 1)**: UI only reflects success states when verified by an authoritative server response. Exact server error messages are rendered upon failure.
- **Visual Discipline (Rule 2)**: Zero gradients, strict invisible box model isolation, and the official 4-color palette (`#30AFFF`, `#92EEFF`, `#D8FFC5`, `#C4F7CA`).
- **Dual-Device Parity**: Tested and optimized for both mobile PWA and desktop screens.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

This application is ready for Vercel Serverless deployment with zero additional configuration needed. Connect your repository to Vercel and deploy.
