# Firegold - B2B Cannabis Whole Flower Sales Platform

## Original Problem Statement
Build a B2B database catalog for cannabis whole flower sales called "Firegold" with admin panel, grower submissions, affiliate/referral marketing, and user inquiry management.

## Architecture
- **Frontend**: React, Tailwind CSS, Axios, Lucide React (single App.js ~7050 lines)
- **Backend**: FastAPI, Pydantic, Motor (async MongoDB), python-jose (JWT)
- **Database**: MongoDB
- **Auth**: JWT tokens for users and admins

## What's Been Implemented
- Full strain catalog with filters (category, growing method, grade, THC, terpenes)
- JWT-based user and admin authentication
- Admin panel with dashboard analytics, strain management, user management, submission review, directory, inquiry hub
- Grower submission workflow with GACP compliance, open permit, categories
- Inquiry system with volume requirements and market of interest
- Contact Us feature (button on auth + catalog pages, modal form, backend storage)
- Sortable column headers on ALL admin tabs
- **Complete Affiliate/Referral System:**
  - Affiliate management with phone, company, auto-generated codes
  - Commission structure: per gram ($0.03 default), percentage, or flat fee — editable per affiliate
  - Edit affiliate modal with full commission structure editing
  - "Share with Buyer" button in catalog header with referral link popup
  - "Convert to Sale" button on inquiries with sale amount, grams, commission override
  - One-level-deep commission rule (only direct referrer earns)
  - "Referred By" column in admin Users table
- Comprehensive marketing CSV export
- "Converted" status filter in Inquiry Hub

## Recent Changes (Mar 4, 2026)
- Fixed admin login crash (missing Users import)
- Removed export country from Submit Your Product form
- Added Contact Us button + modal
- Added sortable columns to all admin tabs
- Built complete affiliate system with flexible commission structure
- Added "Share with Buyer" button for users
- Added "Convert to Sale" flow in Inquiry Hub
- Added Edit Affiliate modal with commission structure editing
- Enhanced CSV export with comprehensive marketing data

## Remaining Tasks
### P1 - Upcoming
- Email integration via Office 365 SMTP (blocked on user app password)

### P2 - Backlog
- Refactor monolithic `backend/server.py` into `/routes`, `/models`
- Refactor `App.js` admin section into smaller components

## Key Credentials
- Admin password: `firegold2026` (route: `/admin`)
- Test user: warren@firegold.com / Test1234!

## Key API Endpoints
- `GET /api/auth/my-referral` — Get/create user's personal referral code
- `POST /api/admin/inquiries/{inquiry_id}/convert` — Convert inquiry to sale with commission calc
- `PUT /api/admin/affiliates/{affiliate_id}` — Update affiliate including commission structure
- `GET /api/users/export/csv` — Comprehensive marketing CSV export
- `POST /api/contact` — Submit contact message

## DB Collections
- strains, users, grower_submissions, inquiries, analytics, affiliates, referral_events, sample_requests, contact_messages
