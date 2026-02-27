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
  - Admin "Submissions" tab with filter (all/pending/approved/rejected)
  - Admin price_per_gram evaluation field during review
  - Auto-add approved strains to catalog with correct price tier and submitted image
  - Pending authorization notice shown to growers on submission
  - Color-coded irradiation status in admin view (green=Yes, red=No)
  - Backend: multipart/form-data endpoint, all tests passing

### Routes
- `/` — Catalog (requires user auth)
- `/admin` — Admin panel (requires admin password)
- `/submit-strain` — Public grower submission form

## Prioritized Backlog

### P1 — Add Strain Form (UI Wiring)
Backend endpoint and basic UI exist. Form submission logic and state management need full implementation and testing.

### P2 — Email-Based Password Delivery
Requires user to provide Resend API key. User has deferred. Do NOT ask for key again.

### Content — Strain Image Backgrounds
AIS and Animal Mints have white backgrounds. Admin can update via image management. User decided to "leave for now".

## Key DB Collections
- `strains`, `users`, `admins`, `sample_requests`, `analytics`, `user_sessions`, `registration_flags`, `grower_submissions`, `inquiries`

## Admin Credentials
- Password: `firegold2026` (configured via ADMIN_PASSWORD env var)

## Key API Endpoints
- User Auth: POST /api/auth/register, POST /api/auth/login
- Strains: GET /api/strains (protected), GET /api/strains/admin
- Admin: POST /api/admin/login, GET /api/admin/verify
- Grower: POST /api/grower/submit, GET /api/grower/submissions, PUT /api/grower/submissions/{id}/status
- Analytics: POST /api/analytics/track, GET /api/analytics/dashboard, GET /api/analytics/export/csv
