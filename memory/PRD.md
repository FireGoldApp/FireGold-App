# Firegold Marketplace — Product Requirements Document

## Original Problem Statement
Build a B2B database catalog for cannabis whole flower sales called "Firegold" with:
- Strain catalog with detailed info (THC, lineage, terpenes, effects, grades, harvest date, growing method, category)
- JWT authentication (user + admin)
- Grower submission form with document uploads
- Admin panel with analytics, user management, content management
- Affiliate/referral system with commission tracking
- Email integration (Microsoft 365)
- AI chatbot to handle customer inquiries with FAQ knowledge
- Progressive Web App (PWA) for mobile/desktop installability
- Admin bot training panel for custom Q&A

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
- [x] Grower submission form: irradiation, GACP, GMP compliance, 4 doc uploads (COA, HC License, CRA License, Direct Delivery Compliance)
- [x] Submission tracker (public)
- [x] Admin panel: Images, Analytics, Users, Flags, Submissions, Directory, Inquiries, Affiliates, Messages, Bot Training
- [x] Admin Messages tab with mark-read, reply (email), delete, filters
- [x] Admin Bot Training tab — CRUD for custom Q&A that feeds into chatbot
- [x] Admin notification system (browser notifications + sound, polling every 30s)
- [x] Affiliate system with referral codes, commission tracking, conversion flow
- [x] Public Affiliate Dashboard at /affiliate/:code
- [x] "Share with Buyer" referral link generation
- [x] Microsoft 365 email integration (registration, inquiries, contact, password reset)
- [x] Forgot Password / Reset Password flow
- [x] Contact Us form
- [x] CSV export for user data
- [x] Sortable tables across all admin tabs
- [x] AI Chatbot (GPT-5.2) with comprehensive FAQ knowledge, quick-reply buttons, session persistence, budget fallback
- [x] Registration form: user type (Buyer/Seller/Both), open permit, permit jurisdiction
- [x] PWA: manifest.json, service worker, custom app icons (192/384/512), apple-touch-icon

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

## Chatbot System
- Powered by OpenAI GPT-5.2 via Emergent LLM Key
- Comprehensive FAQ knowledge about Firegold products, process, compliance, export markets
- Quick-reply buttons: View Catalog, Submit Product, Pricing Info, Export Markets, Contact Sales
- Session persistence in MongoDB (chat_sessions collection)
- Custom training data from admin Bot Training tab (bot_training collection)
- Graceful fallback when LLM budget exceeded

## PWA Details
- manifest.json with Firegold branding and icons
- Service worker with cache-first strategy for assets, network-first for API
- Push notification support ready
- Custom generated icons: firegold_icon_192.png, firegold_icon_384.png, firegold_icon_512.png, apple-touch-icon.png

## Upcoming Tasks (P1)
- Deploy to production (pushes all new features + restores COA/tags)
- Top up Emergent LLM key balance for chatbot

## Future/Backlog Tasks (P2)
- Refactor backend/server.py into modular FastAPI structure
- Refactor AdminPage.js into smaller tab-specific components
- Emergent watermark removal (check plan details)

## Important Notes
- Emergent LLM key budget needs topping up: Profile → Universal Key → Add Balance
- Production is live at app.firegold.ca — changes need redeployment
- PWA is set up — users can install the app from their browser (Add to Home Screen)
