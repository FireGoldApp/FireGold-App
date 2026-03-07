# Firegold - B2B Cannabis Wholesale Catalog

## Original Problem Statement
Build a B2B database catalog for cannabis whole flower sales called "Firegold".

## Architecture
- Frontend: React (App.js ~8490 lines) / Backend: FastAPI (server.py ~3980 lines) / MongoDB
- Uploads: `/app/uploads/submissions/` served via `/api/uploads/` (backend-routed)
- Static strain images: `/app/frontend/public/strains/`
- COA PDFs: `/app/frontend/public/coa/`
- PWA icons: `/app/frontend/public/firegold_icon_{192,384,512}.png`

## Key Fix (Mar 7, 2026)
- **Submission images not appearing**: Root cause was images being saved to `frontend/public/submissions/` which works in dev but NOT in production (React build serves from `build/`, not `public/` at runtime). Fixed by serving all uploaded images through the backend at `/api/uploads/submissions/` which is properly routed through Kubernetes ingress. Added migration to fix existing image paths.
- Also applies to admin strain image uploads - now saved to `/app/uploads/submissions/` and served via `/api/uploads/`.

## Credentials
- Admin: `/admin`, password `firegold2026`
- Production: app.firegold.ca

## Prioritized Backlog
### P1
- Push Notifications for PWA (deferred)
- Additional chatbot training data
### P2
- Refactor monolithic codebase
- Affiliate Dashboard improvements
- Remove Emergent Watermark (plan upgrade needed)
