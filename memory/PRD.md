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

## Implemented Features
- JWT authentication, strain catalog, grower submissions, admin panel, affiliates, AI chatbot, PWA
- COA badges on all 32 strains (migration on startup)
- Per-deal affiliate commission, mobile install banner
- AI chatbot trained on Health Canada + BC cannabis regulations (20 Q&A)
- Instagram link on desktop header + mobile filter menu
- "Filter" label on mobile hamburger button
- Gold close (X) buttons on ALL modals/views
- Image fallback for missing strain images (onError handler)

## Completed (Session Mar 6, 2026 — Batch 4)
- Added "FILTER" label text next to mobile hamburger menu icon
- Added Instagram icon link (desktop header + mobile filter menu) → https://www.instagram.com/my_firegold
- Added onError fallback for strain images (handles missing images gracefully on production)
- Sub Zero image issue diagnosed: strain only exists on production, image was lost on redeploy. onError fallback now shows placeholder instead of broken image.

## Credentials
- Admin: `/admin` route, password `firegold2026`
- Production domain: app.firegold.ca

## Prioritized Backlog
### P1
- Push Notifications for PWA (deferred)
- Additional chatbot training data from user
### P2
- Refactor monolithic App.js (~8475 lines) into components
- Refactor monolithic server.py into FastAPI routers
- Affiliate Dashboard improvements
- Remove Emergent Watermark (requires plan upgrade)
