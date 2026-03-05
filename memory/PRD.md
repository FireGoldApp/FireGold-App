# Firegold Marketplace — Product Requirements Document

## Original Problem Statement
Build a B2B database catalog for cannabis whole flower sales called "Firegold" with:
- Strain catalog with detailed info (THC, lineage, terpenes, effects, grades, harvest date, growing method, category)
- JWT authentication (user + admin)
- Grower submission form with document uploads
- Admin panel with analytics, user management, content management
- Affiliate/referral system with commission tracking
- Email integration (Microsoft 365)
- AI chatbot to handle customer inquiries
- Progressive Web App (PWA) for mobile/desktop installability

## Tech Stack
- **Frontend**: React, Tailwind CSS, Lucide React, Axios
- **Backend**: FastAPI, Pydantic, Motor (async MongoDB), python-jose (JWT), emergentintegrations (OpenAI GPT-5.2)
- **Database**: MongoDB
- **Email**: Microsoft 365 SMTP
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **Deployment**: Emergent Platform, custom domain app.firegold.ca

## Core Features (Implemented)
- [x] JWT auth for users and admins
- [x] Strain catalog with filters (type, price tier, THC, grade, growing method, category)
- [x] COA (Certificate of Analysis) viewing per strain
- [x] Growing method badges on strain cards (Indoor/Outdoor/Greenhouse)
- [x] Category badges on strain cards
- [x] Inquiry system with volume/market fields
- [x] Sample request with document uploads
- [x] Grower submission form with: irradiation, GACP, GMP compliance, 4 document uploads (COA, HC License, CRA License, Direct Delivery Compliance)
- [x] Submission tracker (public)
- [x] Admin panel: Images, Analytics, Users, Flags, Submissions, Directory, Inquiries, Affiliates, Messages
- [x] Admin Messages tab with mark-read, reply (email), delete actions + filters
- [x] Admin notification system (browser notifications + sound for new messages/inquiries, polling every 30s)
- [x] Affiliate system with referral codes, commission tracking, conversion flow
- [x] Public Affiliate Dashboard at /affiliate/:code
- [x] "Share with Buyer" referral link generation
- [x] Microsoft 365 email integration (registration, inquiries, contact, password reset)
- [x] Forgot Password / Reset Password flow
- [x] Contact Us form
- [x] CSV export for user data
- [x] Sortable tables across all admin tabs
- [x] AI Chatbot (GPT-5.2 powered, with session persistence, budget-exceeded graceful fallback)
- [x] Registration form: user type (Buyer/Seller/Both), open permit, permit jurisdiction
- [x] Submit page: GMP compliance, Direct Delivery Compliance document upload

## Admin Credentials
- Admin route: /admin
- Admin password: firegold2026

## Key Routes
- `/` — Catalog (requires login)
- `/admin` — Admin panel
- `/submit-strain` — Grower submission
- `/track` — Submission tracker
- `/reset-password` — Password reset
- `/affiliate/:code` — Affiliate dashboard

## Registration Fields
- First Name, Last Name, Company, Country, Email, Phone
- License Number (optional)
- User Type: Buyer / Seller / Both
- Open Permit: Yes / No
- Permit Jurisdiction: Australia, Czech Republic, Germany, Israel, Portugal, South Africa, United Kingdom, Other

## Upcoming Tasks (P1)
- PWA implementation for installable app with push notifications (user-requested)

## Future/Backlog Tasks (P2)
- Refactor backend/server.py into modular FastAPI structure
- Refactor AdminPage.js into smaller tab-specific components
- Emergent watermark removal (blocked on subscription)

## Important Notes
- The Emergent LLM key budget may need topping up for continued AI chatbot use. Go to Profile -> Universal Key -> Add Balance.
- Production is live at app.firegold.ca — changes need redeployment.
