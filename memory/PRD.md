# Firegold B2B Cannabis Catalog - PRD

## Original Problem Statement
Build a B2B cannabis wholesale flower database/catalog for Firegold company displaying strains from the provided PDF catalog (Feb 2026).

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Lucide React icons
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Database**: MongoDB with strains, inquiries, and sample_requests collections

## User Personas
1. **Wholesale Buyers** - Dispensary owners, retailers browsing catalog
2. **Sales Team** - Firegold staff reviewing inquiries and sample requests

## Core Requirements (Static)
- Display all 27 strains from PDF with full details
- Filter by strain type, price tier, THC range
- Search functionality
- Strain detail modal with complete information
- Inquiry submission system for buyers
- Sample request with Health Canada & CRA license verification
- Firegold branding (flame logo, gold/black theme)

## What's Been Implemented (Feb 27, 2026)
- ✅ Full catalog with 27 strains auto-seeded from PDF data
- ✅ **Actual Firegold Brands logo** (flame icon with wordmark) in header & footer
- ✅ Filter sidebar (type, price tier, THC range)
- ✅ Search by strain name
- ✅ Strain detail modal with THC%, lineage, terpenes, effects, lot size
- ✅ Multi-select strain inquiry system
- ✅ Inquiry form with company/contact/email/phone/message
- ✅ **REQUEST SAMPLE feature with PDF license uploads**
  - Health Canada License PDF upload
  - CRA Excise License PDF upload
  - Files stored in database (base64 encoded)
  - Shipping address required
  - Sample requests stored with pending status
- ✅ Mobile responsive design
- ✅ Backend API with all CRUD endpoints including file upload

## Prioritized Backlog
### P0 (Critical)
- Upload actual strain product photos from PDF (placeholder images currently used)
### P1 (High)
- Admin dashboard for managing inquiries & sample requests
- License verification workflow
### P2 (Medium)
- PDF/Export catalog feature
- Email notifications for new inquiries/sample requests
- User authentication for saved favorites

## Next Tasks
1. **Extract and upload actual strain photos from PDF** (manual process)
2. Admin panel for inquiry/sample request management
3. Email integration for notifications

