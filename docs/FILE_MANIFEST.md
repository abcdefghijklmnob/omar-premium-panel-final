# OMAR PREMIUM PANEL — Project File Manifest

This document lists the important project files and folders as of the latest workspace state.

## Root Files
- AI_RULES.md
- README.md
- package.json
- components.json
- eslint.config.js
- index.html
- postcss.config.js
- tailwind.config.ts
- tsconfig.json
- tsconfig.app.json
- tsconfig.node.json
- vercel.json
- vite.config.ts
- .env.example
- EXPORT_OMAR_PREMIUM_PANEL.sh

## src/ — Application Source Code
### src/App.css
### src/App.tsx
### src/components/made-with-dyad.tsx
### src/components/panel/add-stream-dialog.tsx
### src/components/panel/add-user-dialog.tsx
### src/components/panel/ibo-admin-panel.tsx
### src/components/panel/ibo-playlist-card.tsx
### src/components/panel/movie-manager.tsx
### src/components/panel/series-manager.tsx
### src/components/panel/settings-card.tsx
### src/components/panel/stats-card.tsx
### src/components/ui/*.tsx (accordion, alert-dialog, alert, etc.)
### src/lib/ibo-api.ts
### src/lib/panel-api.ts
### src/lib/utils.ts
### src/pages/Index.tsx
### src/types/supabase-js.d.ts (temporary shim)
### src/integrations/supabase/client.ts

## supabase/ — Supabase Edge Functions
### supabase/functions/_shared/auth.ts
### supabase/functions/_shared/base-url.ts
### supabase/functions/_shared/client.ts
### supabase/functions/_shared/cors.ts
### supabase/functions/_shared/utils.ts
### supabase/functions/admin-panel/index.ts
### supabase/functions/generate-ibo-playlist/index.ts
### supabase/functions/get/index.ts
### supabase/functions/live-proxy/index.ts
### supabase/functions/player-api/index.ts
### supabase/functions/xmltv/index.ts

## api/ — API Endpoints
### api/_lib/supabase.ts
### api/admin-panel.ts
### api/get.js
### api/live-proxy.ts
### api/player-api.ts
### api/xmltv.ts

## public/ — Public Assets
### public/favicon.ico
### public/placeholder.svg
### public/robots.txt
### public/ibo-test.m3u
### public/ibo/testuser.m3u