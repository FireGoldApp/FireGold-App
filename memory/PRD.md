# Firegold B2B Cannabis Catalog - PRD

## Original Problem Statement
Build a B2B cannabis wholesale flower database/catalog for Firegold company displaying strains from the provided PDF catalog (Feb 2026).

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Lucide React icons
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Database**: MongoDB with strains and inquiries collections

## User Personas
1. **Wholesale Buyers** - Dispensary owners, retailers browsing catalog
2. **Sales Team** - Firegold staff reviewing inquiries

## Core Requirements (Static)
- Display all 27 strains from PDF with full details
- Filter by strain type, price tier, THC range
- Search functionality
- Strain detail modal with complete information
- Inquiry submission system for buyers
- Firegold branding (flame logo, gold/black theme)

## What's Been Implemented (Feb 27, 2026)
- ✅ Full catalog with 27 strains auto-seeded from PDF data
- ✅ Firegold brand identity (flame logo, gold gradient text, dark theme)
- ✅ Filter sidebar (type, price tier, THC range)
- ✅ Search by strain name
- ✅ Strain detail modal with THC%, lineage, terpenes, effects, lot size
- ✅ Multi-select strain inquiry system
- ✅ Inquiry form with company/contact/email/phone/message
- ✅ Mobile responsive design
- ✅ Backend API with all CRUD endpoints

## Prioritized Backlog
### P0 (Critical) - None remaining
### P1 (High)
- Admin dashboard for managing inquiries
- Strain image upload/management
### P2 (Medium)
- PDF/Export catalog feature
- Email notifications for new inquiries
- User authentication for saved favorites

## Next Tasks
1. Consider adding actual strain product photos
2. Admin panel for inquiry management
3. Email integration for inquiry notifications
