# Jasoos (Job Hunt Autopilot) — 2-Hour Implementation Plan

**Hackathon:** PromptWars × Garbathon 2026  
**Build Window:** 2 Hours (120 minutes)  
**Deliverable Format:** Phase-by-phase Git commits  
**Core Strategy:** Keep it simple, bulletproof, and visually stunning. Guarantee demo success with a zero-failure cached fallback while supporting live Gemini API calls.

---

## Architecture & Tech Stack Decision

- **Framework:** React + Vite (Fast bootstrap, hot reloading, instant build)
- **Styling:** Vanilla CSS with custom design system tokens (Dark mode, glassmorphism, modern typography via Inter/Outfit, polished status badges)
- **AI Integration:** Google Gemini API (`gemini-1.5-flash` or `gemini-2.0-flash`) via direct REST/SDK with structured JSON schema
- **State & Storage:** React State + Local Storage (for manual overrides and session state)
- **Demo Reference Date:** Fixed to `2026-10-24` (deterministic 7-day follow-up logic)
- **Zero-Failure Offline Mode:** Bundled `fallback_analysis.json` precomputed dataset switchable via UI toggle or auto-fallback if API key is absent/rate-limited

---

## Phase-by-Phase Git Commit Roadmap

```text
[Phase 1] feat: scaffold project and add 20 synthetic sample emails and fallback fixtures
   ↓
[Phase 2] feat: implement data types, inbox store, and deterministic follow-up engine
   ↓
[Phase 3] feat: integrate Gemini structured extraction, validator, and offline fallback mode
   ↓
[Phase 4] feat: create high-impact dashboard, metrics summary, priority alerts, and tracker table
   ↓
[Phase 5] feat: add email detail inspector modal and manual status override capability
   ↓
[Phase 6] docs: complete demo script, reset workflow, and final polish for hackathon presentation
```

---

### Phase 1: Project Scaffold & Synthetic Data Fixtures (0–20 min)
**Deliverable Git Commit:**  
`feat: scaffold project and add 20 synthetic sample emails and fallback fixtures`

#### Objectives:
1. Initialize Vite + React project in the repository root.
2. Setup CSS theme variables (colors, fonts, glassmorphism card styles, buttons, badges).
3. Create `src/data/sample_emails.json` containing 20 synthetic emails matching PRD distributions:
   - 5 Application received / applied (e.g. Google, Acme Corp, Stripe, etc.)
   - 4 Interview invitations / coding assessments
   - 3 Rejections
   - 2 Legitimate offer letters
   - 3 Suspicious scam offers (upfront training fees, Telegram redirect, sensitive bank/OTP request)
   - 3 Ambiguous outreach / unrelated newsletters
   - Dates configured around demo reference date `2026-10-24` (some >7 days old, some <7 days).
4. Create `src/data/fallback_analysis.json` containing pre-calculated valid analysis for all 20 emails to guarantee instant demo resilience.

#### Target Files:
- `package.json`, `vite.config.js`, `index.html`
- `src/index.css` (Design tokens & base reset)
- `src/data/sample_emails.json`
- `src/data/fallback_analysis.json`

#### Verification:
- `npm run dev` starts without errors.
- Both JSON fixtures load and parse cleanly with 20 items each.

---

### Phase 2: Core Data Types, Store & Follow-up Engine (20–40 min)
**Deliverable Git Commit:**  
`feat: implement data types, inbox store, and deterministic follow-up engine`

#### Objectives:
1. Define schema & types:
   - Status canonical enums: `applied`, `interview`, `rejected`, `offer`, `needs_review`
   - Risk level enums: `low`, `medium`, `high`, `unknown`
   - Models: `EmailRecord`, `EmailAnalysis`, `FollowUpReminder`, `DashboardStats`
2. Implement `followUpCalculator.js`:
   - Calculates elapsed days relative to reference date `2026-10-24`.
   - Filters out `rejected` and final `offer` items.
   - Flags applications pending reply ≥ 7 days.
   - Generates actionable advice (e.g., "Send polite check-in to Recruiter").
3. Implement `inboxStore.js` / React Context or Hook:
   - State for `rawEmails`, `analyses`, `activeFilter`, `searchQuery`, `isAnalyzing`, `progress`.
   - LocalStorage persistence for user manual overrides.
   - Action to reset demo state back to pristine sample data.

#### Target Files:
- `src/types/index.js` (or `.ts`)
- `src/utils/followUpCalculator.js`
- `src/context/InboxContext.jsx` (or custom hook store)

#### Verification:
- Unit test / smoke check on `followUpCalculator`: verifies an email from `2026-10-10` is due (14 days), an email from `2026-10-20` is not due (4 days), and a rejection from `2026-10-05` is excluded.

---

### Phase 3: Gemini Structured Extraction & Fallback Service (40–65 min)
**Deliverable Git Commit:**  
`feat: integrate Gemini structured extraction, validator, and offline fallback mode`

#### Objectives:
1. Implement `geminiService.js`:
   - Configurable Google Gemini client with system prompt treating email content strictly as untrusted text (prevent prompt injection).
   - Structured JSON output asking for company, role, recruiter, status, risk level, risk reasons, evidence quotes, and confidence.
2. Implement `analysisValidator.js`:
   - Strict validation: normalizes unexpected status enums to `needs_review`, sanitizes nulls/empty fields.
   - Per-email isolation: if 1 email analysis fails, it surfaces a review error card without breaking the remaining 19 emails.
3. Fallback switch:
   - If `GEMINI_API_KEY` is not provided or network fails, automatically or manually switch to `cached_demo` mode using `fallback_analysis.json`.
   - Clearly tag analysis source: `live_ai` vs `cached_demo`.
4. Progress tracking callback: emits `Analyzing X of 20` for UI progress bar.

#### Target Files:
- `src/services/geminiService.js`
- `src/services/analysisValidator.js`
- `src/services/analysisRunner.js`

#### Verification:
- Triggering analysis with cached mode populates all 20 analyses in under 1 second.
- Triggering with Gemini API key processes emails and validates schema output.

---

### Phase 4: High-Impact Dashboard & Priority Alerts (65–95 min)
**Deliverable Git Commit:**  
`feat: create high-impact dashboard, metrics summary, priority alerts, and tracker table`

#### Objectives:
1. Build Header & Hero bar:
   - App branding: **Jasoos** (Job Hunt Autopilot)
   - "Load Demo Inbox", "Analyze Inbox (Live / Fallback)", "Reset Demo" actions.
   - Analysis progress bar & demo indicator badge.
2. Build Metric Cards Section:
   - Total Emails Analyzed
   - Status Breakdown Pills (`Applied`, `Interview`, `Rejected`, `Offer`, `Needs Review`)
   - High-Risk Scam Alerts Count
   - Follow-Ups Due Count
3. Build Priority Section A: **Suspicious Offers Warning Board**
   - High-visibility cards highlighting flagged offers.
   - Displays risk badge (`High Risk`), scam indicators (e.g. upfront fee, OTP request), and direct quoted evidence from email.
4. Build Priority Section B: **7-Day Follow-Up Reminders Board**
   - Displays applications awaiting reply for 7+ days.
   - Shows days elapsed, application date, and pre-formatted follow-up nudge template.
5. Build Application Tracker Table / Card Grid:
   - Company, Role, Status badge, Received Date, Risk indicator, View details button.
   - Interactive Search bar & filter pills (Filter by status, risk, or follow-ups).

#### Target Files:
- `src/components/Header.jsx`
- `src/components/MetricCards.jsx`
- `src/components/SuspiciousAlerts.jsx`
- `src/components/FollowUpReminders.jsx`
- `src/components/TrackerTable.jsx`
- `src/components/FilterBar.jsx`

#### Verification:
- Clicking "Analyze Inbox" dynamically fills dashboard metrics.
- Clicking status filters filters the tracker table instantly.
- Both priority sections display correct count matching the top cards.

---

### Phase 5: Detail Inspector Modal & Manual Overrides (95–110 min)
**Deliverable Git Commit:**  
`feat: add email detail inspector modal and manual status override capability`

#### Objectives:
1. Build `EmailDetailModal.jsx`:
   - Left pane: Original raw email body, sender email, subject, and timestamp.
   - Right pane: AI Extracted metadata (Company, Role, Recruiter, Confidence).
   - Suspicious Risk panel: Detailed risk reasons, cited quotes from body, and safety disclaimer ("AI-assisted risk assessment, not proof of fraud").
   - Follow-up evaluation details.
2. Build Manual Status Override:
   - User can manually correct any status (e.g., change `needs_review` to `applied` or `interview`).
   - Visually tags as `Manual Override`.
   - Recalculates metrics and follow-up eligibility immediately.
   - Option to "Reset to AI Suggestion".

#### Target Files:
- `src/components/EmailDetailModal.jsx`
- `src/components/StatusOverrideDropdown.jsx`

#### Verification:
- Opening any row opens the modal displaying full raw email and AI breakdown.
- Changing status updates table badge, metric cards, and persists across filter changes.

---

### Phase 6: Polish, Demo Script & README (110–120 min)
**Deliverable Git Commit:**  
`docs: complete demo script, reset workflow, and final polish for hackathon presentation`

#### Objectives:
1. Visual Polish:
   - Refine animations, hover transitions, empty states, and contrast.
   - Ensure responsive layout works cleanly on demo resolution.
2. Hackathon Demo Controls:
   - Mode switcher button in UI: toggle between "Live Gemini 1.5 Flash" and "Instant Cached Demo" (fail-safe for judges).
   - "Reset Demo" button with clean state reset.
3. Update `README.md`:
   - 2-Minute Judge Demo Script.
   - Quickstart instructions (`npm install`, `npm run dev`, API key setup).
   - Architecture overview & PRD feature mapping.

#### Target Files:
- `README.md`
- `src/App.jsx`
- `src/index.css` (final styling polish)

#### Verification:
- Full end-to-end dry run following the 2-minute demo script.
- All 11 Definition of Done criteria in PRD Section 17 verified.

---

## Time Budget Summary

| Phase | Description | Commit Message | Time Target |
|---|---|---|---|
| **Phase 1** | Scaffold + 20 synthetic emails & fixtures | `feat: scaffold project and add 20 synthetic sample emails and fallback fixtures` | 0 – 20 min |
| **Phase 2** | Types, store & 7-day follow-up engine | `feat: implement data types, inbox store, and deterministic follow-up engine` | 20 – 40 min |
| **Phase 3** | Gemini AI service + validation + fallback | `feat: integrate Gemini structured extraction, validator, and offline fallback mode` | 40 – 65 min |
| **Phase 4** | Dashboard, metrics, alerts, tracker table | `feat: create high-impact dashboard, metrics summary, priority alerts, and tracker table` | 65 – 95 min |
| **Phase 5** | Detail modal + manual status override | `feat: add email detail inspector modal and manual status override capability` | 95 – 110 min |
| **Phase 6** | Visual polish, README & 2-min demo script | `docs: complete demo script, reset workflow, and final polish for hackathon presentation` | 110 – 120 min |

---

## 2-Minute Live Demo Script (For Judging)

1. **0:00 - 0:15 (The Hook):** "Job seekers send dozens of applications, lose track of follow-ups, and get preyed upon by fake recruiter scams. Meet **Jasoos**."
2. **0:15 - 0:30 (Load Inbox):** Click **Load Demo Inbox**. Show the 20 raw emails received across various dates.
3. **0:30 - 0:55 (Run Analysis):** Click **Analyze Inbox**. Show real-time progress parsing company, role, status, and scam signals.
4. **0:55 - 1:20 (Scam Alert Showcase):** Point to the **Potentially Suspicious** alert card. Click into a fake job offer requesting a ₹4,500 training fee. Show quoted email evidence and safety disclaimer.
5. **1:20 - 1:40 (Follow-up Showcase):** Point to **Follow-ups Due**. Show applications awaiting reply for >7 days (relative to demo clock) with suggested nudge actions.
6. **1:40 - 1:55 (Tracker & Control):** Filter by "Interview", search for a company, and show a quick manual status correction override.
7. **1:55 - 2:00 (Closing):** "Jasoos brings clarity to job hunting: organizes applications, catches scams, and keeps momentum going."
