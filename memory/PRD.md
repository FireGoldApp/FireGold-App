# Firegold - B2B Cannabis Whole Flower Sales Platform

## Original Problem Statement
Build a B2B database catalog for cannabis whole flower sales called "Firegold" with admin panel, grower submissions, affiliate marketing, and user inquiry management.

## Architecture
- **Frontend**: React, Tailwind CSS, Axios, Lucide React (single App.js)
- **Backend**: FastAPI, Pydantic, Motor (async MongoDB), python-jose (JWT)
- **Database**: MongoDB
- **Auth**: JWT tokens for users and admins

## What's Been Implemented
- Full strain catalog with filters (category, growing method, grade, THC, terpenes)
- JWT-based user and admin authentication
- Admin panel with dashboard analytics, strain management, user management, submission review, directory, inquiry hub
- Grower submission workflow with GACP compliance, open permit, categories
- Inquiry system with volume requirements and market of interest
- Affiliate system backend (partial - models, admin CRUD endpoints, referral tracking on registration)
- Image zoom, marketplace logo on strain detail
- License verification for intake form
- Post-submission license download popup

## Bug Fixes (Feb 2026)
- Fixed admin login crash: Missing `Users` lucide-react import in App.js

## P0 - In Progress
- Complete Affiliate Marketing System:
  - Conversion logic (mark inquiries as converted with sale_value, credit affiliate)
  - Affiliate-facing dashboard at `/affiliate/:code`
  - Backend stats endpoint `GET /api/affiliates/:code/stats`
  - Finalize admin affiliate tab with signup/sales totals

## P1 - Upcoming
- Email integration via Office 365 SMTP (blocked on user app password)

## P2 - Backlog
- Refactor monolithic `backend/server.py` into `/routes`, `/models`
- Refactor `App.js` admin section into smaller components

## Key Credentials
- Admin password: `firegold2026` (route: `/admin`)
- Users: Register via UI

## Key Files
- `/app/frontend/src/App.js` — Entire frontend (6400+ lines)
- `/app/backend/server.py` — Entire backend
