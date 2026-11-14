# AuraGen Member 4 – 20 Days Complete Terminal Commands Guide

Yeh guide aapko Day 1 se Day 20 tak terminal me exact kya-kya type karke push karna hai, step-by-step batata hai.

---

## ⚙️ Step 0: One-Time Setup (Agar pehle nahi kiya hai)

Pehle terminal me repository folder me jayein aur check karein:

```powershell
# 1. Project folder me jayein
cd d:\abhijit-sahoo\auragen-member4

# 2. Remote check karein
git remote -v

# Agar remote origin nahi dikhe, toh yeh run karein:
git remote add origin https://github.com/sathvikyadav0714/AuraGen-AI.git

# 3. Apni branch check karein (abhijit-sahoo)
git branch
```

> **Note on GitHub Login/Token:**  
> Jab pehli baar `git push` karenge, GitHub aapka Username aur Password mangega:
> - **Username:** Aapka GitHub username
> - **Password:** Password ki jagah apna **GitHub Personal Access Token (PAT)** daalein ([Token banane ka link](https://github.com/settings/tokens)).

---

## 📅 DAY 1 TO DAY 20: DAILY TERMINAL COMMANDS

---

### 🔹 DAY 1 (05 Nov) – Project Scaffolding
```powershell
cd d:\abhijit-sahoo\auragen-member4
git checkout -b abhijit-sahoo
git add package.json next.config.js tailwind.config.js postcss.config.js .gitignore
git commit -m "chore: initialize member-4 next.js project structure and configs"
git push -u origin abhijit-sahoo
```

---

### 🔹 DAY 2 (06 Nov) – Component Registry
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/lib/ComponentRegistry.js
git commit -m "feat(registry): implement ComponentRegistry allowlist with 13 core UI primitives"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 3 (07 Nov) – AST Schema Validator
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/lib/ASTValidator.js
git commit -m "feat(security): create ASTValidator for JSON UI schema verification"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 4 (09 Nov) – Core Dynamic Renderer
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/components/DynamicRenderer.jsx
git commit -m "feat(renderer): implement DynamicRenderer with schema parsing and error boundaries"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 5 (10 Nov) – Form Wizard Base
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/components/FormWizard.jsx
git commit -m "feat(wizard): create step-by-step conversational wizard layout and state"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 6 (12 Nov) – Wizard Validation Logic
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/components/FormWizard.jsx
git commit -m "feat(wizard): implement step-level validation and required field checks"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 7 (13 Nov) – Transition Manager
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/components/TransitionManager.jsx
git commit -m "feat(transitions): add Framer Motion transitions and cognitive load badge"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 8 (14 Nov) – Fallback UI
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/components/FallbackUI.jsx
git commit -m "feat(fallback): create FallbackUI screen with data preservation notice"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 9 (16 Nov) – WebSocket Integration
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/hooks/useWebSocket.js
git commit -m "feat(telemetry): implement useWebSocket client hook for backend signals"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 10 (17 Nov) – Mid-Review Integration
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/pages/index.js src/pages/_app.js
git commit -m "feat(integration): integrate main page hub with demo mode and transformation trigger"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 11 (19 Nov) – Form Data Preservation
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/pages/index.js src/components/DynamicRenderer.jsx
git commit -m "feat(state): preserve previously entered form values across transformations"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 12 (20 Nov) – AST Security Hardening
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/lib/ASTValidator.js
git commit -m "security: add input sanitization against XSS and script injection"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 13 (21 Nov) – Minimalist Light Theme
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/styles/globals.css src/pages/index.js
git commit -m "style: implement minimalist light theme with clean spacing and soft shadows"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 14 (23 Nov) – Responsive Layout Fixes
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/components/FormWizard.jsx src/styles/globals.css
git commit -m "fix(ui): improve responsive layout and mobile padding across wizard steps"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 15 (24 Nov) – Dropdown & Component Fixes
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/lib/ComponentRegistry.js
git commit -m "fix(components): fix select dropdown chevron positioning and component bindings"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 16 (26 Nov) – End-to-End WebSocket Test
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/hooks/useWebSocket.js src/pages/index.js
git commit -m "test(ws): verify real-time schema reception and error reconnection logic"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 17 (27 Nov) – Animation Physics Polishing
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/components/FormWizard.jsx src/components/TransitionManager.jsx
git commit -m "perf(animation): tune Framer Motion spring physics and progress bar easing"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 18 (28 Nov) – Dynamic Fallback Recovery
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add src/components/FallbackUI.jsx src/components/DynamicRenderer.jsx
git commit -m "feat(resilience): add graceful recovery from network drops during AI generation"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 19 (30 Nov) – Production Build Optimization
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add package.json next.config.js src/styles/globals.css
git commit -m "build: optimize production bundle and resolve turbopack build warnings"
git push origin abhijit-sahoo
```

---

### 🔹 DAY 20 (01 Dec) – Final Documentation & Viva Prep
```powershell
cd d:\abhijit-sahoo\auragen-member4
git add README.md GITHUB_PUSH_SCHEDULE.md DAILY_TERMINAL_COMMANDS.md
git commit -m "docs: add Member 4 architecture guide, schema specs and viva notes"
git push origin abhijit-sahoo
```

---

## 💡 Quick Tips & Troubleshooting

### 1. Agar git bole `nothing to commit, working tree clean`:
Kisi bhi file me ek blank line ya comment add karein, ya fir:
```powershell
# Empty commit trick (commit history ke liye)
git commit --allow-empty -m "feat: <commit message>"
git push origin abhijit-sahoo
```

### 2. Git Status Check karne ke liye:
```powershell
git status
```

### 3. Pichhle commits dekhne ke liye:
```powershell
git log --oneline -n 5
```

