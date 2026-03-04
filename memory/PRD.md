# Firegold - B2B Cannabis Whole Flower Sales Platform

## Original Problem Statement
Build a B2B database catalog for cannabis whole flower sales called "Firegold" with admin panel, grower submissions, affiliate/referral marketing, and user inquiry management.

## Architecture
- **Frontend**: React, Tailwind CSS, Axios, Lucide React (single App.js ~6900 lines)
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
- Sortable column headers on ALL admin tabs (Users, Submissions, Inquiries, Directory, Affiliates, User Activity)
- Affiliate system with phone, company, auto-generated codes
- **Share with Buyer** button — users get a unique referral link (auto-generated from name, e.g. WARRENC), buyers who register through the link are automatically linked
- Comprehensive marketing CSV export (user data + inquiry stats + referral info)

## Recent Changes (Mar 4, 2026)
- Fixed admin login crash (missing Users import)
- Removed export country from Submit Your Product form
- Added Contact Us button + modal on main page
- Added sortable columns to all admin tabs
- Added phone/company to affiliate form, auto-generate referral codes
- Added "Share with Buyer" button in catalog header with referral link popup
- Enhanced CSV export with comprehensive marketing data
- Added Phone column to Users table

## P0 - In Progress
- Complete Affiliate Marketing System:
  - Conversion logic (mark inquiries as converted with sale_value, credit affiliate)
  - Admin can see who referred whom in the Users tab
  - Affiliate-facing stats in admin panel

## P1 - Upcoming
- Email integration via Office 365 SMTP (blocked on user app password)

## P2 - Backlog
- Refactor monolithic `backend/server.py` into `/routes`, `/models`
- Refactor `App.js` admin section into smaller components

## Key Credentials
- Admin password: `firegold2026` (route: `/admin`)
- Test user: warren@firegold.com / Test1234!

## Key API Endpoints
- `GET /api/auth/my-referral` — Get/create user's personal referral code
- `POST /api/contact` — Submit contact message
- `GET /api/users/export/csv` — Comprehensive marketing CSV
- `GET /api/admin/contact-messages` — View contact messages

## DB Collections
- strains, users, grower_submissions, inquiries, analytics, affiliates, referral_events, sample_requests, contact_messages
