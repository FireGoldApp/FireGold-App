# Firegold - B2B Cannabis Whole Flower Catalog

## Original Problem Statement
Build a B2B database catalog for cannabis whole flower sales called "Firegold" with user auth, admin panel, analytics, sample requests, and grower submissions.

## Core Requirements
1. **Catalog**: Display cannabis strains with details (name, THC, lineage, terpenes, effects, lot size, images)
2. **Branding**: Dark theme with gold accents, Firegold logo
3. **Sample Requests**: Upload Health Canada and CRA license PDFs
4. **Admin Panel**: Secure login, stats dashboard, strain/image/user management, analytics, flags, grower submissions review
5. **Access Control**: Registration wall, admin-only features, image download protection
6. **Analytics**: Track user navigation, display in admin dashboard, CSV export
7. **Grower Submissions**: Public form for growers to submit flower, admin authorization with price per gram
8. **Password Management**: Show generated passwords on-screen (email delivery deferred pending Resend API key)

## Tech Stack
- **Frontend**: React, Tailwind CSS, Axios, Lucide React icons
- **Backend**: FastAPI, Motor (MongoDB async), python-jose (JWT), Pydantic
- **Database**: MongoDB
- **Auth**: JWT-based tokens for both users and admins

## What's Been Implemented

### Completed Features
- [x] Initial catalog with strain data from PDF
- [x] Dark theme with gold accents branding
- [x] Sample request flow with PDF license uploads
- [x] Strain image integration and mapping
- [x] Admin panel (multi-tab: Images, Analytics, Users, Flags, Submissions)
- [x] Secure admin-only login
- [x] Image management grid (update/delete)
- [x] User registration/login wall
- [x] Content protection (disable right-click on images)
- [x] Analytics tracking (strain views, searches, filters)
- [x] Admin analytics dashboard with CSV export
- [x] Duplicate registration flagging
- [x] Add/Remove strains from admin
- [x] **Grower Submission Feature** (Feb 27, 2026)
  - Public form at /submit-strain with all strain fields matching catalog format
  - 30kg minimum lot size enforced (frontend + backend validation)
  - Country of Export field for destination market
  - Irradiation fields: "Has been irradiated for micros?" + "Willing to irradiate if required?" (Yes/No)
  - Image upload (JPG/PNG/WebP) — saved to /submissions/, transferred to strain on approval
  - Document uploads: COA (Certificate of Analysis), Health Canada License, CRA Excise License (PDFs)
  - Admin document links served via /api/files/ endpoint (admin-only, token-authenticated)
  - Admin "Submissions" tab with filter (all/pending/approved/rejected)
  - Admin price_per_gram evaluation field during review
  - Auto-add approved strains to catalog with correct price tier and submitted image
  - Pending authorization notice shown to growers on submission
  - Color-coded irradiation status in admin view (green=Yes, red=No)
  - Backend: multipart/form-data endpoint, all tests passing
- [x] **User-Chosen Password at Registration** (Feb 27, 2026)
  - Users now set their own password during registration (min 6 chars + confirm)
  - No more generated temp passwords — users go directly to catalog after registration
  - Login works with the user-chosen password
- [x] **P1 Add Strain Admin Form** (Feb 27, 2026)
  - Admin can add new strains via modal form with all fields + image upload
  - Duplicate strain name validation
- [x] **Smart License Recognition** (Feb 27, 2026)
  - Auto-checks LP/company name against DB when grower fills submission form
  - Shows green "Recognized" banner with badges: "HC License on file", "CRA License on file", "COA on file"
  - Works across multiple people from the same LP
  - Labels show "- on file" for individual upload fields
- [x] **Enhanced Analytics Dashboard** (Feb 28, 2026)
  - 4 sub-tabs: Overview, User Activity, Engagement, Global Insights
  - **Overview**: Top viewed strains (with bar charts), THC potency interest, strain type preference, price tier interest, top searches, most active companies, event breakdown
  - **User Activity**: Sortable table (by login count, total events, last active, strains viewed) showing every user's logins, events, strains viewed, searches, COA views, sample requests, time spent, last active. Click any user for detailed drill-down with activity timeline, event breakdown, top strains per user
  - **Engagement**: Total sessions, avg/max session duration, sample request conversion rate, active users, peak usage hours chart, conversion funnel visualization, top navigation flows, daily activity sparkline
  - **Global Insights**: Platform totals, users by country, export destinations, company activity by region (table), demand signals (most requested samples, terpene interest, strain type demand, price tier demand), supply-side (submission pipeline, lot size analysis with avg/min/max/total kg, irradiation stats, grower types), registration growth timeline
  - Two CSV exports: Export Events CSV, Export Users CSV
  - 20/20 backend tests + all frontend flows verified
  - Strain cards show green "COA" badge when a COA is available
  - Strain detail modal has "View Certificate of Analysis" button
  - In-app PDF viewer opens as full-screen overlay with close button (no download/navigation away)
  - Admin uploads redacted COA PDFs per strain from the Images/Strain Management tab
  - Grower-submitted COA is NOT auto-attached — admin redacts first, then uploads clean version
  - Admin can remove COA from any strain
  - User authentication required to view COAs
  - Backend: 12/12 tests passed, Frontend: all flows verified
  - Public page at /track for growers to check submission status
  - Search by LP/Company Name or Reference ID
  - Shows "Licenses on File" section with green badges
  - Displays all submissions with status badges (Pending/Approved/Rejected)
  - Linked from grower submission confirmation page

### Routes
- `/` — Catalog (requires user auth)
- `/admin` — Admin panel (requires admin password)
- `/submit-strain` — Public grower submission form
- `/track` — Public submission status tracker

- [x] **Mobile Back Button Fix** (Feb 28, 2026)
  - Added sticky header bar with "← BACK" button on mobile viewports (md:hidden)
  - Shows strain name on right side for context
  - Desktop X close button hidden on mobile, visible on desktop (hidden md:flex)
  - Users can now easily close strain detail modal on phones without refreshing
- [x] **Admin Edit Strain** (Feb 28, 2026)
  - Admin can edit strain details (name, type, THC, CBD, price tier, terpenes, lineage, lot size, effects) from Images tab
  - PUT /api/strains/{strain_id} endpoint with admin auth protection
  - Uses exclude_unset=True to preserve image_url and coa_url when not in update payload
  - Edit form pre-fills with current strain data
- [x] **User-Linked Submissions** (Feb 28, 2026)
  - Sample requests and inquiries are now linked to the authenticated user (user_id, user_email stored in DB)
  - Both POST /api/inquiries and POST /api/sample-requests/upload require user auth token
  - Forms auto-fill company name, contact name, and email from logged-in user data
  - Frontend sends Authorization header with all submissions

## Prioritized Backlog

### P2 — Email-Based Password Delivery
Requires user to provide Resend API key. User has deferred. Password is now user-chosen, so email delivery is less critical but could be used for welcome emails or verification.

### P2 — Backend Refactoring
Break monolithic server.py into /routes, /models, /services directories for maintainability.

### Content — Strain Image Backgrounds
AIS and Animal Mints have white backgrounds. Admin can update via image management. User decided to "leave for now".

## Key DB Collections
- `strains`, `users`, `admins`, `sample_requests`, `analytics`, `user_sessions`, `registration_flags`, `grower_submissions`, `inquiries`

## Admin Credentials
- Password: `firegold2026` (configured via ADMIN_PASSWORD env var)

## Key API Endpoints
- User Auth: POST /api/auth/register, POST /api/auth/login
- Strains: GET /api/strains (protected), GET /api/strains/admin, PUT /api/strains/{id} (admin edit)
- Admin: POST /api/admin/login, GET /api/admin/verify
- Grower: POST /api/grower/submit, GET /api/grower/submissions, PUT /api/grower/submissions/{id}/status
- Analytics: POST /api/analytics/track, GET /api/analytics/dashboard, GET /api/analytics/export/csv
