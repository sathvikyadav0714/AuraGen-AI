# AuraGen – Member 4: 20-Day GitHub Push Schedule

**Repository:** [https://github.com/sathvikyadav0714/AuraGen-AI](https://github.com/sathvikyadav0714/AuraGen-AI)  
**Branch:** `abhijit-sahoo` (or `member-4-renderer`)  
**Role:** Member 4 – Dynamic UI Rendering, AST Security & Conversational Wizard Transformation  
**Internship Duration:** 5th November – 5th December (4 Weeks / 30 Days)  
**Push Target:** Exactly **20 push days** (10 pushes in Weeks 1–2 + 10 pushes in Weeks 3–4)

---

## 📊 Summary of Git Push Distribution

| Phase | Duration | Total Days | Required Push Days | Rest / Buffer Days |
|---|---|:---:|:---:|:---:|
| **Phase 1 (Weeks 1 & 2)** | 5th Nov – 18th Nov | 14 Days | **10 Pushes** | 4 Days (Nov 8, 11, 15, 18) |
| **Phase 2 (Weeks 3 & 4)** | 19th Nov – 5th Dec | 17 Days | **10 Pushes** | 7 Days (Nov 22, 25, 29, Dec 2, 4, 5) |
| **Total** | **5th Nov – 5th Dec** | **31 Days** | **20 PUSHES** | **11 Days** |

---

## 🗓️ Phase 1: Weeks 1 & 2 (Nov 5 – Nov 18) — 10 Pushes

> **Goal:** Set up dynamic rendering environment, Component Registry allowlist, AST schema validation, core Form Wizard, and initial animations.

| Push # | Date | Day | Component / Focus | Git Commit Message | Detailed Tasks |
|:---:|:---:|:---:|---|---|---|
| **#1** | **05 Nov** | Wed | Project Scaffolding | `chore: initialize member-4 next.js project structure and configs` | Setup Next.js, Tailwind CSS, Babel dependencies, and base directory layout (`components`, `lib`, `hooks`, `pages`). |
| **#2** | **06 Nov** | Thu | Component Registry | `feat(registry): implement ComponentRegistry allowlist with 13 core UI primitives` | Define allowed component dictionary (`TextInput`, `NumberInput`, `EmailInput`, `PhoneInput`, `SelectInput`, `TextArea`, etc.). |
| **#3** | **07 Nov** | Fri | AST Schema Validator | `feat(security): create ASTValidator for JSON UI schema verification` | Implement strict property and component type checks to block dangerous/unsupported code execution. |
| — | *08 Nov* | *Sat* | *Buffer / Self-Study* | — | *Code review of Member 1 & 2 interface contracts.* |
| **#4** | **09 Nov** | Sun | Core Dynamic Renderer | `feat(renderer): implement DynamicRenderer with schema parsing and error boundaries` | Build `DynamicRenderer.jsx` to validate incoming schema and delegate rendering to safe components. |
| **#5** | **10 Nov** | Mon | Form Wizard Base | `feat(wizard): create step-by-step conversational wizard layout and state` | Build `FormWizard.jsx` with current step index, field value mapping, and basic navigation controls. |
| — | *11 Nov* | *Tue* | *Buffer / Review* | — | *Test wizard step navigation locally.* |
| **#6** | **12 Nov** | Wed | Wizard Validation | `feat(wizard): implement step-level validation and required field checks` | Add per-step validation checks before allowing users to advance to the next step. |
| **#7** | **13 Nov** | Thu | Transition Manager | `feat(transitions): add Framer Motion transitions and cognitive load badge` | Build `TransitionManager.jsx` for smooth mode switches and floating cognitive score badge. |
| **#8** | **14 Nov** | Fri | Fallback UI | `feat(fallback): create FallbackUI screen with data preservation notice` | Build `FallbackUI.jsx` with return-to-form capability when AI generation or validation fails. |
| — | *15 Nov* | *Sat* | *Buffer / Sync* | — | *Prepare for Day 14 Mid-Review integration.* |
| **#9** | **16 Nov** | Sun | WebSocket Integration | `feat(telemetry): implement useWebSocket client hook for backend signals` | Build `useWebSocket.js` to listen for cognitive load updates and AI generation events. |
| **#10** | **17 Nov** | Mon | Mid-Review Integration | `feat(integration): integrate main page hub with demo mode and transformation trigger` | Wire `index.js` with `TransitionManager`, `DynamicRenderer`, and friction simulation button for Day 14 Mid-Review. |
| — | *18 Nov* | *Tue* | *Buffer / Milestone* | — | *Mid-Review verification & team presentation.* |

---

## 🗓️ Phase 2: Weeks 3 & 4 (Nov 19 – Dec 5) — 10 Pushes

> **Goal:** End-to-end telemetry coordination, styling refinement, data preservation, AST sanitization, cross-browser fixes, optimization, and final deployment.

| Push # | Date | Day | Component / Focus | Git Commit Message | Detailed Tasks |
|:---:|:---:|:---:|---|---|---|
| **#11** | **19 Nov** | Wed | Form Data Preservation | `feat(state): preserve previously entered form values across transformations` | Ensure user data from Member 1's original form is carried into the step-by-step wizard without data loss. |
| **#12** | **20 Nov** | Thu | AST Security Hardening | `security: add input sanitization against XSS and script injection` | Add HTML tag removal and event handler stripping in `ASTValidator.js`. |
| **#13** | **21 Nov** | Fri | Minimalist Light Theme | `style: implement minimalist light theme with clean spacing and soft shadows` | Redesign cards, buttons, input fields, and typography according to modern light aesthetic. |
| — | *22 Nov* | *Sat* | *Buffer / Rest* | — | *Testing on different screen sizes.* |
| **#14** | **23 Nov** | Sun | Responsive UI Fixes | `fix(ui): improve responsive layout and mobile padding across wizard steps` | Ensure seamless usability on mobile devices, tablets, and desktop displays. |
| **#15** | **24 Nov** | Mon | Custom Select & Inputs | `fix(components): fix select dropdown chevron positioning and component bindings` | Resolve input binding issues (`[object Object]`) and replace repeating background arrows with clean icons. |
| — | *25 Nov* | *Tue* | *Buffer / Sync* | — | *Coordinate with Member 2 (WebSocket endpoints) and Member 3 (AI schema output).* |
| **#16** | **26 Nov** | Wed | End-to-End WebSocket Test | `test(ws): verify real-time schema reception and error reconnection logic` | Test auto-reconnection (up to 5 retries) and live JSON schema payload rendering from backend. |
| **#17** | **27 Nov** | Thu | Animation Polishing | `perf(animation): tune Framer Motion spring physics and progress bar easing` | Add smooth enter/exit slide transitions (`variants`) between wizard steps and progress updates. |
| **#18** | **28 Nov** | Fri | Dynamic Fallback Recovery | `feat(resilience): add graceful recovery from network drops during AI generation` | Allow users to retry generation or safely return to the original form with data intact. |
| — | *29 Nov* | *Sat* | *Buffer / Rest* | — | *End-to-end sanity testing.* |
| **#19** | **30 Nov** | Sun | Production Build & Lint | `build: optimize production bundle and resolve turbopack build warnings` | Run `npm run build`, verify 0 vulnerabilities, remove unused imports, and test production output. |
| **#20** | **01 Dec** | Mon | Documentation & Final Polish | `docs: add Member 4 architecture guide, schema specs and viva notes` | Add comprehensive documentation, component contract specs, and final submission notes. |
| — | *02 Dec* | *Tue* | *Buffer* | — | *Final regression testing.* |
| — | *03 Dec* | *Wed* | *Final Integration* | — | *Team Lead PR merge into `main` branch.* |
| — | *04 Dec* | *Thu* | *Rehearsal* | — | *Prepare technical viva demonstration.* |
| — | *05 Dec* | *Fri* | *Final Review* | — | *Final Internship Project Review & Viva presentation!* |

---

## 🛠️ Git Daily Workflow (How to Push Every Day)

Har push wale din terminal me sirf ye 3 commands run karein:

```powershell
# 1. Branch check karein
git status

# 2. Changes stage karein
git add .

# 3. Specific din ka commit message likhein (table se copy karein)
git commit -m "feat(wizard): create step-by-step conversational wizard layout and state"

# 4. GitHub par push karein
git push origin abhijit-sahoo
```

---

## 📋 Viva & Review Checklist for Member 4

Jab mentor ya interviewer aapse poochenge, toh ye key points ready rakhein:

1. **Why AST / Schema Validation?**
   - Direct LLM-generated code execution is dangerous (XSS risk).
   - AuraGen validates structured JSON schemas using an allowlist (`ComponentRegistry.js` + `ASTValidator.js`), ensuring only safe prebuilt React components are rendered.

2. **How does Data Preservation work?**
   - Form inputs already typed in Member 1's form are stored in `preservedFormData` state and passed down to `FormWizard` as initial field values.

3. **How does the Transformation happen without page reload?**
   - Handled via `TransitionManager` and React's `AnimatePresence`. The page switches mode from `'original'` to `'wizard'` dynamically using Framer Motion animations.

