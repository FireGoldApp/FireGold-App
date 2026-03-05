# Firegold Marketplace — Product Requirements Document

## Original Problem Statement
B2B wholesale cannabis flower marketplace with strain catalog, grower submissions, admin panel, affiliate system, AI chatbot, and PWA support.

## Core Features (All Implemented & Tested)
- JWT auth (user + admin) with registration fields: user type (Buyer/Seller/Both), open permit, permit jurisdiction
- Strain catalog with filters: Category, Growing Method, Strain Type, THC Range, Price Tier, Flower Grade, **Compliance (BC DD)**
- COA badge + Growing Method badge + Category badge + **BC DD badge** on all strain cards
- Grower submission form: Compliance section (GACP, GMP, irradiation, **BC DD checkbox**), Documents (COA, HC License, CRA License, **DDC**), **Terpene %** field
- License download popup after submission
- Admin panel: Images, Analytics, Users, Flags, Submissions, Directory, Inquiries, Affiliates, Messages, Bot Training
- **Email toggle** (OFF by default — admin enables when ready to launch)
- Admin approval sends email with documents to lynette@firegold.ca and qa@firegold.ca
- AI Chatbot (GPT-5.2) with FAQ knowledge + quick-reply buttons + session persistence
- Bot Training admin panel for custom Q&A
- Admin notifications (browser + sound, 30s polling)
- Affiliate system with public dashboard at /affiliate/:code
- Microsoft 365 email integration
- PWA: manifest, service worker, custom Firegold icons
- DB migration on startup for missing strain fields

## Key Items Needing User Action
- Upload Firegold license PDFs to `/frontend/public/firegold_hc_license.pdf` and `/frontend/public/firegold_cra_license.pdf`
- Top up Emergent LLM key for chatbot: Profile → Universal Key → Add Balance
- **Deploy** to push latest changes to app.firegold.ca

## Upcoming Tasks
- User to add custom bot training data via admin panel
- Further submit page alignment tweaks (per user feedback)

## Future/Backlog
- Refactor backend/server.py into modular structure
- Refactor AdminPage.js into smaller components
- Emergent watermark removal
