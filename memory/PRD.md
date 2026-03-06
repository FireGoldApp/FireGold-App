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
- Monolithic frontend: `/app/frontend/src/App.js` (~8470 lines)
- Monolithic backend: `/app/backend/server.py` (~3960 lines)
- COA PDFs: `/app/frontend/public/coa/`
- PWA icons: `/app/frontend/public/firegold_icon_{192,384,512}.png` (user's logo on black bg)

## Implemented Features
- JWT authentication (user + admin)
- Strain catalog with filtering
- Grower submission form with document uploads
- Admin panel (strains, users, submissions, analytics, inquiries, affiliates, bot training, email toggle, messages)
- COA badges + preview (32/32 strains, migration on startup)
- Affiliate system with per-deal commission at conversion
- AI chatbot trained on Health Canada regulations, BC rules, and Firegold platform info (20 Q&A entries)
- PWA with custom icon, mobile install banner (iOS + Android), on auth AND catalog pages
- Microsoft 365 email integration with admin toggle
- Gold close (X) buttons on ALL modals/views for clear navigation
- Country dropdown with "Domestic (Canada)" on registration, inquiry, and jurisdiction forms
- Open Permit + Jurisdiction fields on Inquiry form

## Completed (Session Mar 6, 2026 — Batch 3)
- Fixed Contact Us button position on mobile (doesn't overlap install banner)
- ALL close (X) buttons now gold with black X (zoom, COA, strain detail, edit strain, add strain, sample request, inquiry, contact, chatbot, mobile filters, affiliate detail, user profile, forgot password, reply message, edit affiliate, convert inquiry)
- PWA icon regenerated on black background (was transparent)
- AI chatbot trained with 20 Q&A entries covering: Cannabis Act, federal licences, export rules, 2025 amendments, CTS, GPP, testing requirements, COAs, packaging/labelling, interprovincial wholesale, BC Direct Delivery, BC fees, BC distribution, BC DD compliance, irradiation, flower grades, GMP, open permits, BC licensing, Firegold platform

## Credentials
- Admin: `/admin` route, password `firegold2026`
- Production domain: app.firegold.ca

## Prioritized Backlog

### P1
- Push Notifications for PWA (deferred by user)
- User to provide additional chatbot training data

### P2
- Refactor monolithic App.js into components
- Refactor monolithic server.py into FastAPI routers
- Public Affiliate Dashboard improvements
- Remove Emergent Watermark (requires plan upgrade)
