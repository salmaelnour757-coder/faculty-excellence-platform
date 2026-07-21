# Faculty Excellence Platform

> Competency-driven. Evidence-informed. Built for HPE.

A configurable, AI-powered faculty excellence and career development platform for health professions education institutions.

---

## Intellectual Property Notice

© 2026 Dr. Salma Elnour Rahma Mohamed. All rights reserved.

**Author:** Dr. Salma Elnour Rahma Mohamed  
**ORCID:** 0000-0001-6439-5062  
**Contact:** dr.salmaelnour@gmu.ac.ae  
**Date of Creation:** July 2026  

This software, its architecture, design, methodology, scoring engine, configuration model, and all associated intellectual property are the original creation of Dr. Salma Elnour Rahma Mohamed. Commercial use requires a licence. See [LICENSE](./LICENSE) for details.

---

## What Is the Faculty Excellence Platform?

The Faculty Excellence Platform (FEP) is a configurable shell for faculty career development in health professions education. The engine, logic, and architecture are fixed. The content — competency framework, assessment instrument, pathways, branding, organisational structure — is entirely driven by institutional configuration. Any HPE institution can deploy their own branded, framework-aligned version without modifying code.

### The Faculty Journey

```
Competency Framework
        ⬇
  Self-Assessment
        ⬇
  Evidence Upload
        ⬇
AI-Supported Gap Analysis
        ⬇
Personal Development Plan
        ⬇
Recommended Learning Pathways
        ⬇
      Mentoring
        ⬇
     Portfolio
        ⬇
Promotion Readiness
        ⬇
Institutional Analytics
```

---

## Seven Layers

| Layer | Purpose |
|---|---|
| 1 — Configuration | Institution setup, framework builder, pathway builder |
| 2 — Assessment | Self-assessment, evidence upload, AI gap analysis |
| 3 — Development | PDP generation, pathway enrolment, workshops |
| 4 — Portfolio | Evidence mapping, portfolio builder, portability |
| 5 — Promotion | Promotion readiness, criteria mapping, recognition |
| 6 — Analytics | Individual, departmental, institutional dashboards |
| 7 — Integration | SSO, HR systems, LMS, API, webhooks |

---

## Repository Structure

```
faculty-excellence-platform/
├── apps/
│   ├── web/              ← React + Vite web application
│   └── desktop/          ← Electron wrapper (Phase 2)
├── packages/
│   ├── core/             ← Scoring engine + configuration parser
│   ├── ui/               ← Shared component library
│   ├── ai/               ← AI layer abstraction
│   └── api/              ← REST API + webhooks
├── config/
│   └── example/          ← Example configuration for new institutions
├── docs/
│   ├── architecture/     ← Technical documentation
│   ├── ip/               ← IP registration documents
│   └── api/              ← API documentation
├── scripts/              ← Development and deployment
├── LICENSE               ← Business Source Licence
└── README.md
```

---

## Getting Started

1. Clone the repository
2. Copy `config/example/example-config.json` to your own config file
3. Replace all values with your institution's details
4. Run the onboarding wizard — it guides you through every setting

---

## Licence

Business Source Licence 1.1.  
Commercial use requires a licence from Dr. Salma Elnour Rahma Mohamed.  
Non-commercial and research use is permitted under the licence terms.  
See [LICENSE](./LICENSE) for full terms.

