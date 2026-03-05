# Firegold - B2B Cannabis Whole Flower Sales Platform

## Original Problem Statement
Build a B2B database catalog for cannabis whole flower sales called "Firegold" with admin panel, grower submissions, affiliate/referral marketing, and user inquiry management.

## Architecture
- **Frontend**: React, Tailwind CSS, Axios, Lucide React (single App.js ~7200 lines)
- **Backend**: FastAPI, Pydantic, Motor (async MongoDB), python-jose (JWT)
- **Database**: MongoDB
- **Auth**: JWT tokens for users and admins
- **Email**: Microsoft 365 SMTP (warren@firegold.ca)
- **Production URL**: https://app.firegold.ca
- **Domain**: GoDaddy DNS → Emergent hosting

## What's Been Implemented
- Full strain catalog with filters (category, growing method, grade, THC, terpenes)
- JWT-based user and admin authentication
- **Forgot Password / Reset Password** flow with email-based reset links
- Admin panel with dashboard analytics, strain management, user management, submission review, directory, inquiry hub
- Grower submission workflow with GACP compliance, open permit, categories
- Inquiry system with volume requirements and market of interest
- Contact Us feature (button on auth + catalog pages, modal form, backend storage)
- Sortable column headers on ALL admin tabs
- Complete Affiliate/Referral System with flexible commission structure (per gram/percentage/flat fee)
- "Share with Buyer" button for users with referral link popup
- "Convert to Sale" flow in Inquiry Hub with commission calculation
- "Referred By" column in admin Users table
- Comprehensive marketing CSV export
- Email Integration (M365 SMTP): welcome emails, inquiry notifications, contact notifications, password resets
- Browser tab title: "Firegold Marketplace"

## Key Credentials
- Admin password: `firegold2026` (route: `/admin`)
- SMTP: warren@firegold.ca via smtp.office365.com:587

## Remaining Tasks
### P1
- Remove Emergent watermark (platform setting, contact support@emergent.sh)
- GitHub save (connect via Emergent profile settings)

### P2 - Backlog
- Admin Messages tab for contact form submissions
- Commission summary dashboard in Affiliates tab
- Email triggers for submission status updates & inquiry responses
- Refactor monolithic backend/server.py into /routes, /models
- Refactor App.js admin section into smaller components
