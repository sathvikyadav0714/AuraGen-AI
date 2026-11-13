# AuraGen – Member 1: Frontend & Cognitive Friction Detection Plan

**Developer:** Aniket Sarovar  
**Role:** Member 1 – Frontend Development & Friction Detection  
**Company:** Infotact Solutions  
**Branch:** `Aniket`  
**Duration:** 28 Days (4 Weeks)  
**Target:** Minimum 20 Meaningful Contribution Days  

---

## 1. System Role & Responsibilities

In the AuraGen project, Member 1 is responsible for the user-facing entry point and behavioral telemetry:
1. **Financial Application Form:** Standard multi-field form for loan/credit processing.
2. **Behavioral Telemetry:** Non-invasive telemetry tracking (cursor velocity, hesitation, rage clicks, inactivity).
3. **Cognitive Load Calculation:** Real-time formula mapping interactions to a 0–100 cognitive score.
4. **Telemetry Dashboard:** Live HUD presenting cognitive status, metrics, and WebSocket health.
5. **WebSocket Client:** Real-time event streaming to Member 2's backend and receiving generative UI signals.

---

## 2. 4-Week Milestone Roadmap

### Week 1: Form & Validation Foundation (Days 1–5)
- [x] Day 1: Project Scaffolding & Financial Form Architecture
- [ ] Day 2: Form Input Validation (Regex, Bounds & Accessibility)
- [ ] Day 3: Error Feedback States & Responsive Form Styling
- [ ] Day 4: Modular Field Registry & Non-PII Form Context Generator
- [ ] Day 5: Week 1 Code Review, Documentation & Form Polish

### Week 2: Telemetry & Friction Detection (Days 6–10)
- [ ] Day 6: `useTelemetry` Hook Setup & Event Listener Architecture
- [ ] Day 7: Cursor Velocity & Distance Calculation
- [ ] Day 8: Inactivity & Hesitation Detection
- [ ] Day 9: Rage Click & Rapid Interaction Detection
- [ ] Day 10: Repeated Validation Error Tracking & State Aggregation

### Week 3: Cognitive Score & Live Dashboard (Days 11–15)
- [ ] Day 11: `cognitiveScore.js` Formula & Weight Modeling (0–100)
- [ ] Day 12: Score Classification (Low, Medium, High) & Threshold Events
- [ ] Day 13: `TelemetryDashboard.jsx` Component & Visual Score Meter
- [ ] Day 14: Real-time Metric Tiles & High-Friction History Log
- [ ] Day 15: Mid-Review Integration with Member 4 Dynamic UI

### Week 4: WebSocket, Testing & Viva Presentation (Days 16–20)
- [ ] Day 16: `websocketClient.js` Setup & Event Contract
- [ ] Day 17: Auto-reconnection & Resilience Logic
- [ ] Day 18: Full End-to-End Friction Simulation & Responsive Testing
- [ ] Day 19: Comprehensive Testing & Bug Fixes
- [ ] Day 20: Final Documentation, Viva Presentation & PR Preparation

---

## 3. Privacy & Non-PII Safeguard

AuraGen enforces strict telemetry privacy:
- Telemetry **never transmits** raw form input values (e.g. passwords, actual income amounts, or personal phone numbers) in behavioral event streams.
- Only timing metrics, speeds, counts, and field identifiers (e.g. `field: "annualIncome"`, `hesitationMs: 2400`) are collected.
