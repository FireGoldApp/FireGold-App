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
- Monolithic frontend: `/app/frontend/src/App.js` (~8380 lines)
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
- Affiliate marketing system with referral links
- AI chatbot with admin training interface
- PWA support (installable) with custom user icon and install prompt banner
- Microsoft 365 email integration with admin toggle
- Contact Us form
- Forgot/Reset password flow
- User Activity Report under Admin > Analytics > User Activity
- Inquiry form with Open Permit and Permit Jurisdiction fields

## Completed (Session Mar 6, 2026)
- [P0] COA data migration fix: Force-update all strains with case-insensitive matching (32/32 strains now have coa_url)
- [P1] Added Terpene %, BC DD Compliant, Category fields to admin strain editor
- [P1] Fixed browser back button: pushState/popstate for strain detail navigation
- [P2] Removed /track submission tracker route
- [P2] Fixed Jurisdiction dropdown: clears when Open Permit changes from Yes
- New PWA icon from user-provided logo (192/384/512 sizes + apple-touch-icon)
- PWA Install Prompt banner on catalog page
- Country dropdown on registration (was text input) with 'Domestic (Canada)' and international options
- Added 'Domestic (Canada)' to all jurisdiction dropdowns
- Open Permit + Jurisdiction fields added to Inquiry form (frontend + backend)
- Moved BC DD filter under Category section in FilterSidebar
- Gold (bg-gold-500) close buttons on all modals
- User Activity Report verified working under Analytics > User Activity

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
- POST /api/admin/login - Admin auth
- GET /api/strains/admin - All strains (admin)
- PUT /api/strains/{id} - Update strain (admin)
- GET /api/strains/{id}/coa - View COA PDF
- POST /api/grower/submit - Grower submission
- POST /api/chat - AI chatbot
- POST /api/register - User registration
- POST /api/auth/login - User auth
- POST /api/inquiries - Submit inquiry (now with open_permit, permit_jurisdiction)
- GET /api/analytics/users-report - User activity report (admin)
