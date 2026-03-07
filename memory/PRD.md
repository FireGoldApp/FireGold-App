# Firegold - B2B Cannabis Wholesale Catalog

## Architecture
- Frontend: React (App.js ~8560 lines) / Backend: FastAPI (server.py ~3990 lines) / MongoDB
- Uploads served via `/api/uploads/` (backend-routed through K8s ingress)

## Completed (Mar 7, 2026)
- Admin User Activity: Added delete button per user row (with confirmation)
- Concentrates: Added "Extracts" dropdown (17 types) + "Extraction Method" dropdown (5 methods) — shown only when category is Concentrates
- Removed 30kg minimum lot size from submission form and backend validation
- Submission image fix: images now served through `/api/uploads/` backend route

## Credentials
- Admin: `/admin`, password `firegold2026`
- Production: app.firegold.ca

## Backlog
- Push Notifications (deferred), chatbot training, codebase refactoring
