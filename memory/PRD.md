# Firegold - B2B Cannabis Whole Flower Sales Platform

## Original Problem Statement
Build a B2B database catalog for cannabis whole flower sales called "Firegold" with admin panel, grower submissions, affiliate/referral marketing, and user inquiry management.

## Architecture
- **Frontend**: React, Tailwind CSS, Axios, Lucide React (single App.js ~7100 lines)
- **Backend**: FastAPI, Pydantic, Motor (async MongoDB), python-jose (JWT)
- **Database**: MongoDB
- **Auth**: JWT tokens for users and admins
- **Email**: Microsoft 365 SMTP (warren@firegold.ca)

## What's Been Implemented
- Full strain catalog with filters (category, growing method, grade, THC, terpenes)
- JWT-based user and admin authentication
- Admin panel with dashboard analytics, strain management, user management, submission review, directory, inquiry hub
- Grower submission workflow with GACP compliance, open permit, categories
- Inquiry system with volume requirements and market of interest
- Contact Us feature (button on auth + catalog pages, modal form, backend storage)
- Sortable column headers on ALL admin tabs
- Complete Affiliate/Referral System with flexible commission structure
- "Share with Buyer" button for users with referral link popup
- "Convert to Sale" flow in Inquiry Hub with commission calculation
- "Referred By" column in admin Users table
- Comprehensive marketing CSV export
- **Email Integration (M365 SMTP):**
  - Welcome email to new users on registration
  - Admin notification on new user registration
  - Admin notification on new inquiry
  - Admin notification on contact form submission
  - Branded Firegold email template

## Key Credentials
- Admin password: `firegold2026` (route: `/admin`)
- Test user: warren@firegold.ca / Test1234!
- SMTP: warren@firegold.ca via smtp.office365.com:587

## Remaining Tasks
### P1 - Upcoming
- Deploy app + link custom domain app.firegold.ca
- Save to GitHub

### P2 - Backlog
- Refactor monolithic backend/server.py into /routes, /models
- Refactor App.js admin section into smaller components
- Add more email triggers (submission status updates, inquiry responses)
