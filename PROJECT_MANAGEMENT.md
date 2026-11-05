# 📋 SubAI — Agile Project Management & Team Governance Handbook

> **Project**: SubAI (AI-Powered Culvert Obstruction Triage & Circular Waste Recovery)  
> **Team**: Team Pew Pew — 1st Year BS Computer Science, USTP Cagayan de Oro  
> **Event**: Green Innovation Pitching Competition | City Education Innovation Week (CEIW) 2026  
> **Product Manager & Team Lead**: [Danlord Farell Soriano](https://github.com/Daffy-Ducky)  
> **Lead Software Engineer**: [Justine Roy P. Salvador](https://github.com/JRSstuff)  

---

## 🎯 1. Overview of the PM Role on GitHub

As Product Manager and Pitch Lead, you don't need to write application code to be an indispensable contributor. In the tech industry, **Product Managers (PMs)** and **Technical Program Managers (TPMs)** lead the entire lifecycle:
1. **Defining What to Build**: Converting real-world municipal problems (Cagayan de Oro urban flash flooding, clogged culverts) into clear feature specifications.
2. **Managing Velocity & Sprints**: Prioritizing work so the engineering team ships the high-impact demo features on time.
3. **Quality Assurance (QA)**: Testing builds, validating AI accuracy, verifying GPS accuracy, and logging issues.
4. **Stakeholder Pitching**: Crafting the narrative, data slides, and live demonstration for judges and city officials.

---

## 🛠️ 2. How to Set Up GitHub Projects (Step-by-Step)

GitHub Projects (v2) is a native, modern Kanban and Roadmap tool built directly into GitHub.

### Step 1: Create the Project
1. Go to repository: `https://github.com/JRSstuff/SubAI`.
2. Click the **Projects** tab (between Pull Requests and Wiki).
3. Click **New project** (green button).
4. Select the **Board** template and name it:  
   `🌊 SubAI — Sprint Board & CEIW 2026 Roadmap`.
5. Link it to repository `JRSstuff/SubAI`.

### Step 2: Configure Custom Fields & Columns
Set up columns on your Kanban board:
- **📋 Backlog**: Raw ideas, feature requests, future optimizations.
- **🎯 Sprint Backlog**: Tasks committed for the current cycle.
- **🛠️ In Progress**: Tasks developer is actively coding right now.
- **🔍 QA & PM Review**: Completed PRs/features deployed to staging/preview waiting for PM test.
- **✅ Done**: Verified, tested, and ready for competition demo.

Add Custom Fields (via the `+` button in Board view):
- **Priority**: `Critical / Blocker (P0)`, `High (P1)`, `Medium (P2)`, `Low (P3)`.
- **Module**: `AI Vision`, `GIS Mapping`, `Review Triage`, `Collector & Ledger`, `Pitch Deck`.

---

## 📅 3. Project Milestones

Go to **Issues ➔ Milestones ➔ New milestone** and create these three milestones:

### 🏆 Milestone 1: Core Triage & Vision MVP
- **Goal**: Functional report submission, Google Gemini 3.6 Flash multimodal auto-tagging, one-tap GPS, and GIS heatmap.
- **Target**: Complete & verified.

### 🏆 Milestone 2: Circular Mass-Balance Ledger & MRF Handover
- **Goal**: 7-step chain-of-custody lifecycle, batch weighing, remaining custody balance calculation, and municipal role RBAC.
- **Target**: Complete & verified.

### 🏆 Milestone 3: Presentation Rehearsal & Live Demo Freeze
- **Goal**: 12-slide high-res pitch deck populated, demo seed scripts operational, offline fallback validated, pitch rehearsal with faculty coach.
- **Target**: CEIW 2026 Competition Day.

---

## 📝 4. Ready-to-Post GitHub Issues (Copy & Paste directly into GitHub Issues)

You can copy each of the following specifications directly into **GitHub ➔ Issues ➔ New issue**:

### Issue 1: `[FEAT]: Add 'Scale Measurement Unavailable' Toggle for Qualitative Clearances`
```markdown
### 🎯 Feature Overview & Goal
Field collectors sometimes clear culverts without access to a portable digital scale. We need a clean fallback toggle so the task can close honestly without injecting false zero-kg or estimated values into the circular mass-balance ledger.

### 👤 User Story
**As a** Municipal Field Collector  
**I want to** toggle 'Scale Measurement Unavailable' when a scale is absent  
**So that** I can submit qualitative photo proof without polluting the numerical recycling mass tally.

### 📋 Product Acceptance Criteria
- [ ] Toggle switch labeled "Scale Measurement Unavailable" on `/tasks` weigh modal.
- [ ] When toggled ON, numeric weight inputs for PET, Flexible, and Silt are disabled or hidden.
- [ ] "After-Cleanup" photo evidence remains mandatory.
- [ ] Ledger entry marks collection as `qualitative_cleared: true` with zero mass distortion.

### 🚀 Target Milestone
Milestone 2: Circular Mass-Balance Ledger
```

---

### Issue 2: `[FEAT]: Prevent Redundant Dispatches with Duplicate Report Linking`
```markdown
### 🎯 Feature Overview & Goal
Multiple citizens frequently report the same clogged culvert along CM Recto Highway. Municipal reviewers need to link duplicate reports to a parent report to avoid dispatching two separate crews.

### 👤 User Story
**As a** Municipal Review Authority  
**I want to** flag a report as "Duplicate" and select the original Report ID  
**So that** field operations remain efficient while preserving citizen contribution credit.

### 📋 Product Acceptance Criteria
- [ ] Status dropdown on `/review` modal includes `Duplicate`.
- [ ] Selecting `Duplicate` reveals a dropdown listing recent active reports within 200m.
- [ ] Linking saves `duplicate_of_id` onto the report document in Firestore.
- [ ] Citizen reporter receives acknowledgment without triggering a second active `CleanupTaskItem`.

### 🚀 Target Milestone
Milestone 1: Core Triage & Vision MVP
```

---

### Issue 3: `[DOCS]: Link Relative Pitch Deck Screenshots and Add Team Pew Pew Roster`
```markdown
### 🎯 Feature Overview & Goal
Ensure `PRESENTATION_PITCH_DECK.md` renders cleanly on GitHub and displays the full Team Pew Pew member roster and faculty coach.

### 👤 User Story
**As a** Competition Judge & Evaluator  
**I want to** view high-resolution slide thumbnails and team credentials directly on GitHub  
**So that** the project's engineering credibility and leadership structure are instantly verified.

### 📋 Product Acceptance Criteria
- [ ] All screenshot links in `PRESENTATION_PITCH_DECK.md` use `./public/presentation_screenshots/...`.
- [ ] Team Pew Pew table included in both `README.md` and `PRESENTATION_PITCH_DECK.md`.
- [ ] GitHub handles hyperlinked for Danlord Farell Soriano (`@Daffy-Ducky`) and Justine Roy Salvador (`@JRSstuff`).

### 🚀 Target Milestone
Milestone 3: Presentation Rehearsal & Live Demo Freeze
```

---

## 📈 5. How to Showcase This on Your Resume & Portfolio

When applying for software internships, hackathons, or student leadership roles, write this on your resume:

```text
Team Leader & Product Manager — SubAI (Team Pew Pew) | CEIW 2026
• Led product strategy, user stories, and agile sprint tracking for an AI-powered municipal drainage triage system for Cagayan de Oro City.
• Coordinated full-stack developer, UI designer, and researchers using GitHub Projects V2 and Agile Kanban methodology.
• Authored comprehensive PRD, 13-slide pitch deck guide, and 7-step circular mass-balance governance framework.
• Live Demo: https://cdo-subai.vercel.app/ | GitHub: https://github.com/JRSstuff/SubAI
```
