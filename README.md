# 🏋️ GymPulse SaaS - Production-Ready Gym Management Platform

> A modern, commercial-grade, multi-tenant SaaS application built for gym owners, fitness studios, CrossFit boxes, and personal trainers — featuring automatic Super Admin facility approvals, dedicated HTTPS public websites with athlete lead generation, instant mobile PWA & standalone desktop app downloads, and cascade decommissioning security.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-Commercial%20Ready-blue)](#)

---

## 🚀 Instant Launch & Access Options

### 1. Local 1-Click Desktop Launch (Windows)
- Double-click **`Run_GymPulse.bat`** (or `GymPulse App.lnk`).
- The application initializes automatically, sets the Windows taskbar icon, and opens your browser directly to:  
  👉 **`http://localhost:8000`**

### 2. Worldwide Public HTTPS Access (Any Phone, Any PC — No Shared Wi-Fi Needed)
- Double-click **`Share_Online_Worldwide.bat`**.
- Starts the backend and connects an enterprise-grade **Cloudflare Edge Tunnel (`cloudflared.exe`)**.
- Generates an instant, secure `https://*.trycloudflare.com` link accessible from **any device in the world** over cellular 4G/5G, home broadband, or office Wi-Fi with **zero ports to forward and zero Python pre-installed**.

### 3. Direct App Download on Any Device
Every visitor on the web portal can tap the **"Download App"** button:
- **iPhone / iPad (iOS)**: Tap Safari Share (`[↑]`) &rarr; **"Add to Home Screen"** (`+`). GymPulse installs directly to the home screen as a full-screen, standalone native app with offline caching.
- **Android**: Tap **"Install GymPulse on This Phone"** to install directly into the app drawer in 1 tap.
- **Windows PC**: Tap **"Download GymPulse for Windows (ZIP)"** to download the standalone portable bundle (`GymPulse_Windows_Portable.zip`, 20.5 MB) with embedded runtime — runs with **zero Python pre-installed**.

---

## 🔑 Pre-Configured Accounts & Credentials

| Role | Facility / Scope | Email | Password | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Super Admin** | **Global System** | `admin@gympulse.com` | `SuperAdmin123!` | System-wide gym approvals, suspensions & permanent purges |
| **Gym Owner** | Apex Fitness Club | `owner@apexfitness.com` | `ApexAdmin123!` | Pro Tier (Full facility management, settings, danger zone) |
| **Front Desk Staff** | Apex Fitness Club | `staff@apexfitness.com` | `Staff123!` | Member check-ins, attendance, and member directory |
| **Gym Owner** | IronForge Studio | `admin@ironforge.com` | `IronAdmin123!` | Free Starter Tier (Multi-tenant isolated) |

---

## 🌟 Core Features & Capabilities

### 1. Platform Super Admin & Approval Workflow
- When a new gym registers, it enters `pending_approval` status.
- The Platform Super Admin reviews registration details and approves the facility from the **Super Admin Console** before the facility owner can operate.
- Super Admin can suspend accounts or permanently delete facilities with cascading data wipes.

### 2. Dedicated HTTPS Public Facility Websites & Lead Capture
- Every approved gym automatically gets its own dedicated public website at `/facility/{slug}` (e.g., `/facility/apex-fitness-club`).
- Displays the facility's brand, address, operational hours, membership plans (in INR ₹), and an interactive **Free Trial Inquiry Form**.
- Athletes submitting inquiry forms appear immediately in the gym owner's dashboard as hot leads.

### 3. Cascade Gym & Website Decommissioning Lifecycle (OWASP ASVS Standard)
- Gym owners can decommission their facility under **Settings &rarr; Danger Zone**.
- Requires high-assurance password verification and exact facility name confirmation.
- **Immediate Cascade Purge**: Wipes all member records, visits, payments, staff accounts, and inquiries.
- **Instant Website Tombstone**: The dedicated website `/facility/{slug}` is immediately taken offline, returning a `404 Not Found` security tombstone.

### 4. Application Security (AppSec) Hardening
- **Timing Attack Defense**: Pre-computed constant-time bcrypt verification neutralizes email enumeration attempts on login.
- **Sliding-Window Rate Limiting**: Built-in in-memory rate limiting blocks brute-force login attempts (429 Too Many Requests) and form spam.
- **Enterprise Security Headers**: Every HTTP response enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, strict referrer policy, and camera/microphone permissions isolation.

### 5. Multi-Tenant Data Isolation
- Strict row-level isolation via tenant dependency injection (`gym_id`).
- Facility A can **never** view, modify, or leak Facility B's member, billing, or attendance records.

### 6. Member Management & Customizable Plans
- Comprehensive athlete profiles: photo, phone, emergency contacts, medical notes, assigned trainers, and membership history.
- Customizable membership plans (Monthly, Quarterly, Annual, or Custom days) in **INR (₹)** with automatic expiry roll-forward calculations.

### 7. Front Desk & Attendance Tracking
- Instant member lookup and 1-click check-in.
- Real-time active "on floor" counter.
- Check-out logging with duration calculation and historical logs.

### 8. Billing, Payments & Invoicing
- Record cash, credit card, bank transfer, and UPI/online payments in INR (₹).
- Printable electronic receipts and invoice slips with gym branding and tax breakdown.
- Track pending dues and overdue accounts.

### 9. AI Assistant Copilot
- Natural language query assistant analyzing tenant metrics in real-time.
- Answers operational questions like *"How many memberships expire this week?"*, *"Which members haven't visited in 14 days?"*, or *"What was our revenue this month?"*.
- Built-in zero-cost deterministic analytics engine (no external API keys required), with optional pluggable hooks for OpenAI, Gemini, or Claude.

### 10. SaaS Tier Enforcement & Commercial Quotas
- **Free Starter**: Up to 25 members.
- **Pro Growth**: Up to 250 members + AI Copilot + CSV exports.
- **Business Enterprise**: Unlimited members + priority features.

---

## 📁 Repository & File Directory

```
Gym management/
├── backend/
│   ├── app/
│   │   ├── api/                 # REST API routes (auth, members, attendance, platform, etc.)
│   │   ├── core/                # AppSec security, database, config, rate limiters, RBAC
│   │   ├── models/              # SQLAlchemy models (Gym, User, Member, Inquiry, etc.)
│   │   ├── schemas/             # Pydantic v2 validation models
│   │   ├── services/            # AI analytics engine, tier quotas, CSV & receipt generators
│   │   └── main.py              # FastAPI server entrypoint mounting SPA and API routes
│   ├── static/                  # Production build of React Single Page Application
│   ├── tests/                   # Pytest automated test suite (100% pass rate)
│   ├── seed.py                  # Rich multi-tenant database seeder
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI widgets (DownloadAppModal, StatCard, Modal, etc.)
│   │   ├── pages/               # Dashboard, Members, Payments, SuperAdmin, Settings, Public website
│   │   ├── services/            # API client & JWT token management
│   │   └── context/             # AuthContext and Toast notification system
│   ├── public/                  # PWA manifest.json, sw.js (Service Worker), app icons
│   ├── package.json             # NPM dependencies (React 18, Vite, Tailwind CSS)
│   └── vite.config.js           # Vite build configuration
├── Run_GymPulse.bat             # 1-Click Windows desktop launcher
├── Share_Online_Worldwide.bat   # 1-Click Worldwide Cloudflare HTTPS tunnel launcher
├── build_frontend.bat           # Automated Vite frontend compiler
├── desktop_app.py               # Windows desktop app runtime with taskbar icon pinning
├── splash.py                    # Lightweight loading splash screen
├── cloudflared.exe              # Standalone Cloudflare Tunnel engine
├── GymPulse_Windows_Portable/   # Standalone Windows app bundle (zero Python pre-installed)
├── GymPulse_Windows_Portable.zip# Direct download archive served via /api/download/windows
├── README.md                    # Main product guide
├── API.md                       # Comprehensive REST API catalog
├── ARCHITECTURE.md              # Technical design, AppSec & multi-tenancy architecture
├── DATABASE.md                  # Relational schema architecture & ER diagram
├── DEPLOYMENT.md                # Cloud & Docker deployment manual
├── ENVIRONMENT.md               # Environment variables reference
├── SETUP.md                     # Local development setup guide
└── COMMERCIALIZATION_GUIDE.md   # Commercial sale & white-labeling manual
```

---

## 🧪 Automated Testing

GymPulse includes a comprehensive automated test suite verifying all critical workflows:

```bash
.\venv\Scripts\pytest.exe backend\tests\test_saas_app.py -v
```

**Verified Test Coverage (13/13 Passed - 100%)**:
- `test_login_success_and_failure` (JWT tokens & invalid credential handling)
- `test_multi_tenant_isolation` (Cross-tenant leak prevention)
- `test_member_crud_and_tier_limits` (Quota enforcement)
- `test_attendance_checkin_and_checkout` (Visit tracking & double check-in prevention)
- `test_payment_and_receipt` (Financial records & HTML receipt generation)
- `test_ai_assistant_tenant_isolation` (Natural language operational queries)
- `test_ai_speech_to_text_handling` (Voice query pipeline)
- `test_platform_admin_approval_workflow` (Super Admin approval lifecycle)
- `test_public_website_and_inquiry` (Public landing page & athlete inquiries)
- `test_user_re_registration_and_login` (Account re-authentication)
- `test_owner_gym_decommission_and_website_deletion` (Cascade decommissioning & website tombstone)
- `test_superadmin_gym_deletion` (Super Admin facility purge)
- `test_security_headers_and_timing_safety` (AppSec HTTP headers & dummy bcrypt constant-time check)

---

## 📄 License & Commercial Rights

GymPulse SaaS is architected as an independent commercial product ready for commercial deployment, client handover, white-labeling, or operation as a subscription SaaS business.
