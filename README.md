<div align="center">
  <img src="./docs/images/preview.svg" width="100%" alt="MedFlow HMS Dashboard Preview" />

  # 🏥 MedFlow — Full-Stack Hospital Management System
  <p><strong>Enterprise-grade healthcare operations platform built for Indian clinical workflows.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-v24-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-18-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Contract--First-OpenAPI_3.0-85EA2D?style=flat-square&logo=openapiinitiative&logoColor=black" alt="OpenAPI" />
  </p>
</div>

---

## 📌 Executive Summary

**MedFlow HMS** is a multi-role, end-to-end clinical management application tailored for healthcare facilities. It centralizes patient registration, real-time OPD queuing, doctor consultation workspaces, bed admissions (IPD), itemized billing, and TPA mediclaim lifecycles into a single performant system.

---

## ⚙️ Core Clinical Modules (11 Slices)

| Module | Operational Scope |
|:---|:---|
| 🔐 **RBAC & Security** | Role-segmented authentication (Administrator, Doctor, Receptionist) with session persistence. |
| 🪪 **Patient Registration** | Unique patient indexing (`HMS-XXXX`), duplicate mobile detection, universal multi-field search. |
| 🎫 **Live OPD Queue** | Token progression system (`waiting` ➔ `in_consultation` ➔ `completed`) with real-time room tracking. |
| 🩺 **Doctor Consultation** | Integrated clinical workspace for symptoms recording, ICD-10 diagnosis, and prescription authoring. |
| 🛏️ **IPD & Bed Allocation** | Interactive ward occupancy grid, bed census forecasting, and admission records. |
| 🛡️ **Mediclaim & TPA** | Cashless and reimbursement insurance claim pipeline (`draft` ➔ `submitted` ➔ `settled`). |
| 🧾 **Itemized Billing** | Transparent OPD/IPD invoice computation, pharmacy charges, and printable clinical tax receipts. |
| 📄 **Discharge Summaries** | Structured discharge protocols, vitals at discharge, and medication guidance. |
| 📊 **Executive Analytics** | Bed occupancy rates, OPD turnout curves, and department-wise revenue metrics (Recharts). |
| 📜 **Audit Trail** | Complete compliance logging of every patient record modification and financial transaction. |

---

## 🏛️ System Architecture

```
Hospital-Management-AI/
├── artifacts/
│   ├── hms/                   # React 18 + Vite Frontend Application (Zustand, React Query)
│   └── api-server/            # Express 5 REST API Gateway
├── lib/
│   ├── db/                    # PostgreSQL Schema Definitions (10 Drizzle Entities)
│   ├── api-spec/              # OpenAPI 3.0 Contract (Single Source of Truth)
│   └── api-client-react/      # Generated Type-Safe Hooks (Orval Codegen)
├── pnpm-workspace.yaml        # Monorepo Orchestration
└── tsconfig.base.json         # Strict TypeScript Configuration
```

### 🧠 Architectural Principles
- **Contract-First Architecture:** The OpenAPI 3.0 specification (`lib/api-spec/openapi.yaml`) generates type-safe React Query hooks and Zod server validation schemas via Orval codegen.
- **Data Integrity:** Strict PostgreSQL relational schemas managed by Drizzle ORM with atomic transactional guarantees for financial and medical records.
- **Predictable Performance:** Monorepo package filtering with PNPM workspaces ensuring rapid builds and zero dependency drift.

---

## 🚀 Local Deployment & Development

### 1. Prerequisites
- **Node.js**: `v20.x` or `v24.x`
- **pnpm**: `v9.x` or higher
- **PostgreSQL**: Running instance or Supabase/Neon connection URI

### 2. Setup & Installation
```bash
# Clone the repository
git clone https://github.com/Shubhamd7744/Hospital-Management-AI.git
cd Hospital-Management-AI

# Install monorepo dependencies
pnpm install

# Configure environment variables
# Copy .env.example or set DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/medflow_db"

# Push schema migrations
pnpm --filter @workspace/db run push

# Run full development environment
pnpm --filter @workspace/api-server run dev    # API Server (Port 8080)
pnpm --filter @workspace/hms run dev           # Web Frontend
```

---

## 🔑 Demo Access Profiles

| Role | Username | Password | Access Privileges |
|:---|:---|:---|:---|
| **Medical Director** | `admin` | `admin123` | Full administrative, financial & audit control |
| **Cardiologist** | `drpatel` | `doctor123` | Consultation, EMR records & clinical discharge |
| **Physician** | `drsharma` | `doctor123` | Consultation, EMR records & clinical discharge |
| **Front Desk** | `reception1` | `staff123` | Patient registration, token issuance, OPD billing |

---

<div align="center">
  <sub>Maintained by <a href="https://github.com/Shubhamd7744">Shubham Dutta</a> • Frontend Developer & UI/UX Designer</sub>
</div>