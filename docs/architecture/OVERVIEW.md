# Faculty Excellence Platform — Architecture Overview

© 2026 Dr. Salma Elnour Rahma Mohamed. All rights reserved.

## Seven Layers

| Layer | Description |
|---|---|
| 1 — Configuration | Institution setup, framework builder, pathway builder |
| 2 — Assessment | Self-assessment, evidence upload, AI gap analysis |
| 3 — Development | PDP generation, pathway enrolment, workshops |
| 4 — Portfolio | Evidence mapping, portfolio builder, portability |
| 5 — Promotion | Promotion readiness, criteria mapping, recognition |
| 6 — Analytics | Individual, departmental, institutional dashboards |
| 7 — Integration | SSO, HR systems, LMS, API, webhooks |

## Scoring Engine

Gap Score = Importance − Competence
TNI = Gap Score × Development Priority

TNI 0–4: Low Need | 5–8: Moderate | 9–12: High | 13–20: Critical

## Configuration Model

Every institution configures the platform via a JSON configuration object.
Default GMU configuration: config/default/gmu-config.json
