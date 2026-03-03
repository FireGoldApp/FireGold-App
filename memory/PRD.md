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
- [x] **Admin Strain Directory** (Feb 28, 2026)
  - New "Directory" tab in admin panel with full list of all strains
  - Each entry shows: strain image/name/type/THC/lot size, COA link, HC License link, CRA License link, grower/LP contact info
  - COA endpoint updated to accept both user and admin tokens (verify_any_token)
  - Search filter to quickly find strains by name
  - Backend: GET /api/admin/strain-directory enriches strains with matching grower submission data
- [x] **CSV Export** (Feb 28, 2026)
  - "Export CSV" button on Directory tab downloads full strain directory as CSV
  - 26 columns: strain details, grower/LP contact (name, company, email, phone, license#), submission date/status, growing method, export country, irradiation status, admin pricing/notes, document availability (COA, HC License, CRA License)
  - Backend: GET /api/admin/strain-directory/csv
- [x] **COA Redaction Workflow** (Feb 28, 2026)
  - Pending submissions with COA show redaction prompt: "Upload redacted COA before approving"
  - Admin can upload redacted PDF to replace original COA on the submission
  - UI shows green "Redacted COA uploaded" checkmark after upload, with "Replace" option
  - COA document link labeled "(Original)" or "(Redacted)" based on status
  - Backend: PUT /api/admin/submissions/{id}/redacted-coa
- [x] **Flower Grade System (A/B/C)** (Feb 28, 2026)
  - Grower submission form: 3 grade inputs (Grade A, B, C in kg) under "Flower Grade Breakdown"
  - Catalog: Grade badges on strain cards (color-coded: green=A, gold=B, gray=C)
  - Catalog: Grade filter in sidebar — filter by Grade A, B, or C availability
  - Strain detail modal: Grade Breakdown section with colored boxes
  - Admin: Grade inputs in strain edit form, grade display in submission review
  - Analytics: Grade Distribution panel in Global Insights (submissions + catalog totals)
  - CSV export: Grade A, B, C columns included
- [x] **Total Inventory Summary** (Feb 28, 2026)
  - Prominent dashboard card at top of admin panel showing aggregated Grade A/B/C volumes across all catalog strains
  - Displays total kg per grade with color-coded boxes + total kg badge
  - Shows "X of Y strains have grade data" footer
  - Backend: GET /api/admin/inventory-summary endpoint with MongoDB aggregation
- [x] **User Access Management** (Feb 28, 2026)
  - Admin Users tab: "Pause Access" button (yellow) for active users, "Restore" button (green) for paused users, "Remove" button (red) for all
  - Status badges: Active (green), Paused (yellow), Removed (red)
  - Paused/removed users see at login: "Please contact warren@firegold.ca to request new access" with clickable mailto link
  - Active tokens invalidated immediately on pause/remove
  - Backend: PUT /api/admin/users/{id}/status, DELETE /api/admin/users/{id}
- [x] **Landing Page Logo & Dynamic Month** (Feb 28, 2026)
  - Firegold Marketplace logo centered prominently in hero section
  - Logo visible on all screen sizes (h-48 sm:h-64 md:h-80 lg:h-96) with transparent background
  - Header and footer retain original Firegold Brands logo
  - "February 2026 Catalog" auto-updates to current month/year using JavaScript Date
- [x] **Harvest Date** (Feb 28, 2026)
  - Added to grower submission form (required date picker)
  - Flows through to strain when submission is approved
  - Displayed on strain detail modal pages
  - Included in admin edit form and CSV export
- [x] **Admin Inquiry Management Hub** (Feb 28, 2026)
  - New "Inquiries" tab in admin panel with pending count badge
  - Full list of all user inquiries with enriched data: contact info, strain names, user account details
  - Expandable inquiry cards showing message, registered account, strains requested
  - Status management: Mark Responded, Archive, Reopen with optional admin notes
  - Search by name, company, strain name, or message text
  - Filter dropdown by status: All, Pending, Responded, Archived
  - Backend: GET /api/admin/inquiries (with user detail enrichment), PUT /api/admin/inquiries/{id}/status
  - Inquiry creation (POST /api/inquiries) now caches strain_names for fast retrieval
  - All 11 backend tests + all frontend flows verified (100% pass rate)

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
- Inquiries: POST /api/inquiries (user), GET /api/admin/inquiries (admin), PUT /api/admin/inquiries/{id}/status (admin)
- Directory: GET /api/admin/strain-directory, GET /api/admin/strain-directory/csv
- Inventory: GET /api/admin/inventory-summary
- User Mgmt: PUT /api/admin/users/{id}/status, DELETE /api/admin/users/{id}

- [x] **Strain Detail Page Enhancements** (Feb 28, 2026)
  - Firegold Marketplace logo displayed below strain image on every strain detail page
  - Image zoom: hover shows magnifying glass icon, click opens full-screen 1.8x zoom overlay with mouse-following pan
- [x] **Product Category System** (Feb 28, 2026)
  - Added categories: Dried Flower, Fresh Frozen, Trim, Concentrates
  - Category filter at top of sidebar, category badge on strain cards, category dropdown in intake form
  - "Submit Your Strain" changed to "Submit Your Product" throughout
- [x] **GACP Compliance** (Feb 28, 2026)
  - Added "Is your product GACP compliant? Yes/No" to grower intake form
  - GACP status displayed in admin submission review
- [x] **License Verification** (Feb 28, 2026)
  - Health Canada License # field added to both user registration and grower intake forms
  - "Verify" button on intake form checks license against database records
  - GET /api/grower/verify-license/{license_number} endpoint
- [x] **Grade Labels Updated** (Feb 28, 2026)
  - Grade A (Bigs), Grade B (Mids), Grade C (Smalls) throughout app
- [x] **Grower Identification in Admin** (Feb 28, 2026)
  - Admin strain management cards show grower company
  - Admin edit modal includes Grower Information section (Company, Contact Name, Email)
  - Grower info flows from submission to strain on approval
- [x] **Data Cleanup** (Feb 28, 2026)
  - Removed all test inquiries and test users, keeping 13 real users
  - Inquiry volume field: users specify kg per strain when submitting inquiries, shown in admin hub

