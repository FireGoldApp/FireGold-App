# Firegold - B2B Cannabis Wholesale Catalog

## Architecture
- Frontend: React (App.js ~9100+ lines) / Backend: FastAPI (server.py ~4200+ lines) / MongoDB
- Uploads served via `/api/uploads/` (backend-routed through K8s ingress)
- JWT auth for users, password auth for admin

## Completed Features
- **Strain Catalog**: Login-protected catalog with THC, lineage, terpenes, effects, lot size, images, grades, harvest date, growing method, category
- **Effects Multi-Select (Mar 7, 2026)**: Reusable EffectsMultiSelect component (79 effects in 9 categories, max 8 selections). Integrated in grower submission form, admin strain editor, admin add strain form. Effects stored as arrays in DB. Catalog sidebar effects filter with removable tags. Startup migration converts legacy string effects to arrays.
- **Save List Feature (Mar 7, 2026)**: Users can save filtered catalog views as named lists. My Lists panel with CSV download and delete. Admin "User Lists" tab with analytics: top saved strains, most common effects, category breakdown, total lists/saves/users.
- **Grower Submission Form**: Public form with image/doc uploads (COA, licenses). Concentrates: Extract Type + Extraction Method dropdowns
- **Admin Panel**: Strain management, analytics, user management (with delete), submission review, strain directory, inquiry hub, affiliate management, contact messages, bot training, user lists analytics
- **Affiliate System**: Per-deal commission structure
- **AI Chatbot**: Trained on Health Canada/BC cannabis regulations via OpenAI GPT-4o
- **PWA**: Custom icons, mobile install banner
- **Email Integration**: Microsoft 365 SMTP (toggleable)
- **COA Badge Migration**: Self-healing startup script ensuring coa_url consistency
- **Image Fix**: All uploads served via `/api/uploads/` backend endpoint

## Credentials
- Admin: `/admin`, password `firegold2026`
- Production: app.firegold.ca

## Key API Endpoints
- `/api/strains` (GET): Catalog with filters (type, price_tier, search, min_thc, terpene, effects, category, growing_method, bc_dd)
- `/api/strains/{id}` (PUT): Update strain (admin)
- `/api/strains/admin/create` (POST): Create strain (admin)
- `/api/user/lists` (POST/GET): Create/list saved lists
- `/api/user/lists/{id}` (DELETE): Delete saved list
- `/api/user/lists/{id}/csv` (GET): Download list as CSV
- `/api/admin/lists` (GET): All user lists (admin)
- `/api/admin/lists/analytics` (GET): Lists analytics (admin)
- `/api/grower/submit` (POST): Grower strain submission
- `/api/uploads/submissions/{file}` (GET): Serve submission images
- `/api/uploads/strains/{file}` (GET): Serve strain images

## DB Schema Changes
- `strains.effects`: Changed from `str` to `List[str]` (array of effect strings)
- `saved_lists`: New collection `{id, user_id, user_email, user_company, list_name, strain_ids, strain_names, strain_count, filters_applied, created_at}`

## Backlog
- **P1**: Push Notifications for PWA
- **P1**: Custom AI Chatbot training data from user
- **P2**: Refactor monolithic App.js into components/pages
- **P2**: Refactor monolithic server.py into routes/models/services
- **P2**: Public-facing Affiliate Dashboard
