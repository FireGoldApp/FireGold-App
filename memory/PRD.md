# Firegold - B2B Cannabis Wholesale Catalog

## Original Problem Statement
Build a B2B database catalog for cannabis whole flower sales called "Firegold" with secure login-protected catalog, admin panel, grower submissions, affiliate system, AI chatbot, and PWA support.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI, Motor (async MongoDB), python-jose (JWT)
- **Database**: MongoDB
- **LLM**: OpenAI GPT-4o via emergentintegrations (Emergent LLM Key)
- **Email**: Microsoft 365 SMTP
- **PWA**: manifest.json + service worker

## Architecture
- Monolithic frontend: `/app/frontend/src/App.js` (~8460 lines)
- Monolithic backend: `/app/backend/server.py` (~3960 lines)
- COA PDFs: `/app/frontend/public/coa/`
- License PDFs: `/app/frontend/public/firegold_hc_license.pdf`, `firegold_cra_license.pdf`
- PWA icons: `/app/frontend/public/firegold_icon_192.png`, `firegold_icon_384.png`, `firegold_icon_512.png`

## Implemented Features
- JWT authentication (user + admin)
- Strain catalog with filtering (type, grade, THC, category, growing method, BC DD, price tier)
- Grower submission form with document uploads
- Admin panel: strain management, user management, submission review, analytics, inquiry hub, affiliate management, bot training, email toggle, messages
- COA badges + preview on all 32 strains (data migration on startup)
- Affiliate marketing system with per-deal commission at conversion time
- AI chatbot with admin training interface
- PWA support with custom user icon, mobile install banner (iOS + Android)
- Microsoft 365 email integration with admin toggle
- Contact Us form, Forgot/Reset password
- User Activity Report under Admin > Analytics > User Activity
- Inquiry form with Open Permit and Permit Jurisdiction fields
- Country dropdown on registration with "Domestic (Canada)" option

## Completed (Session Mar 6, 2026 — Batch 2)
- PWA icon replaced with user's uploaded Firegold Marketplace logo (all sizes)
- Mobile PWA install banner on Auth AND Catalog pages (iOS: "Tap Share > Add to Home Screen", Android: Install button)
- Affiliate commission removed from creation/edit — now set per-deal in Convert to Sale modal (required fields)
- Live payout calculation in conversion modal
- Country dropdown on registration (was text input)
- "Domestic (Canada)" added to all jurisdiction dropdowns
- Open Permit + Jurisdiction fields added to Inquiry form
- BC DD filter moved under Category section
- Gold close (X) buttons on all modals

## Credentials
- Admin: `/admin` route, password `firegold2026`
- SMTP: warren@firegold.ca (Microsoft 365)
- Production domain: app.firegold.ca

## Prioritized Backlog

### P1
- Push Notifications for PWA (deferred by user)
- AI Chatbot training data (user will provide later)

### P2
- Refactor monolithic App.js into components
- Refactor monolithic server.py into FastAPI routers
- Public Affiliate Dashboard improvements
- Remove Emergent Watermark (requires plan upgrade)

## Key API Endpoints
- POST /api/admin/login, POST /api/auth/login, POST /api/register
- GET/PUT /api/strains/{id}, GET /api/strains/admin
- POST /api/inquiries (with open_permit, permit_jurisdiction)
- POST /api/admin/affiliates (commission now optional)
- POST /api/admin/inquiries/{id}/convert (commission required per-deal)
- POST /api/chat, GET/POST /api/admin/bot-training
- GET /api/analytics/users-report
