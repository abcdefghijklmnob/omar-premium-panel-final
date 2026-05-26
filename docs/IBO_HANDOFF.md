# OMAR PREMIUM PANEL — IBO Handoff

## Snapshot
- Snapshot date: 2026-05-26
- Workspace state: current local workspace in Dyad
- Git commit hash: **not available in this workspace**
- Lockfiles present: **none** (`package-lock.json` / `pnpm-lock.yaml` were not present)

## What this project contains
This repository is a React + Vite + TypeScript admin panel with Supabase-backed IPTV management.

The new IBO work adds a dedicated **IBO Panel** inside the main admin app without removing the original IPTV panel.

## Requested export coverage
This workspace now includes:
- Full `src/` folder
- Full `supabase/` folder
- All Supabase Edge Functions under `supabase/functions/`
- `package.json`
- `public/` test playlist assets
- `.env.example`
- SQL handoff file: `docs/ibo-database.sql`
- Export helper: `EXPORT_OMAR_PREMIUM_PANEL.sh`

## Confirmed IBO files changed / added
These are the main files related to the IBO Panel work:

### Frontend
- `src/components/panel/ibo-admin-panel.tsx` — new full IBO admin UI
- `src/lib/ibo-api.ts` — new typed IBO API layer for RPC + playlist generation
- `src/pages/Index.tsx` — updated to add `IBO Panel` tab/view
- `src/lib/panel-api.ts` — updated IBO playlist helpers used by the main dashboard
- `src/components/panel/ibo-playlist-card.tsx` — clarified as static test-only card
- `src/integrations/supabase/client.ts` — frontend Supabase client
- `src/types/supabase-js.d.ts` — temporary local type shim for the Supabase JS client
- `package.json` — added `@supabase/supabase-js`

### Supabase / backend
- `supabase/functions/generate-ibo-playlist/index.ts` — package-aware real IBO playlist generation
- `supabase/functions/_shared/auth.ts`
- `supabase/functions/_shared/client.ts`
- `supabase/functions/_shared/cors.ts`
- `supabase/functions/_shared/utils.ts`

### Public test assets
- `public/ibo-test.m3u`
- `public/ibo/testuser.m3u`

### Older compatibility/testing-related files touched during the IBO phase
- `api/get.js`
- `api/xmltv.ts`

## New IBO database tables
1. `public.ibo_packages`
2. `public.ibo_user_subscriptions`
3. `public.ibo_devices`
4. `public.ibo_package_live_streams`
5. `public.ibo_package_vod_streams`
6. `public.ibo_package_series`
7. `public.ibo_settings`
8. `public.ibo_activity_logs`
9. `public.ibo_playlists` (used by the IBO system and playlist metadata)

## New / relevant IBO database functions
1. `public.ibo_log_activity`
2. `public.admin_save_ibo_package`
3. `public.admin_delete_ibo_package`
4. `public.admin_save_ibo_user_subscription`
5. `public.admin_save_ibo_device`
6. `public.admin_delete_ibo_device`
7. `public.admin_save_ibo_user`
8. `public.admin_save_ibo_settings`
9. `public.admin_ibo_panel_data`
10. `public.admin_list_ibo_playlists`

## New / relevant Edge Function
- `supabase/functions/generate-ibo-playlist/index.ts`

## What was implemented
### Done
- Full IBO admin section inside the main panel
- IBO dashboard overview with counts and charts
- IBO devices CRUD
- IBO package CRUD
- IBO user subscription assignment to packages
- IBO user account status updates
- IBO settings persistence
- IBO activity logging
- Package → content mapping for:
  - live streams
  - vod streams
  - series
- Real package-aware IBO M3U generation
- Generated playlist upload to Supabase Storage
- Playlist metadata saved to `ibo_playlists`
- IBO playlist actions in UI:
  - generate
  - copy
  - open
  - download
- Verified database operations for:
  - create package
  - assign subscription
  - create device
  - read aggregated panel data

## What is still incomplete / broken / risky
1. **No git commit hash available** in this workspace, so the exact commit ID cannot be confirmed from inside Dyad.
2. `@supabase/supabase-js` was added to `package.json`, but the dependency install in this environment was not completed automatically; the next developer should ensure dependencies are installed.
3. The frontend currently hardcodes the Supabase URL and publishable key in source files instead of reading them from environment variables.
4. The `src/types/supabase-js.d.ts` file is a temporary shim and should be removed once the real package/types are installed correctly.
5. `ibo-playlist-card.tsx` is still only a static compatibility test card; the real dynamic flow is in the IBO users table actions and the Edge Function.
6. Device telemetry is not automatic yet:
   - no device heartbeat endpoint
   - no automatic `last_seen` updates
   - no automatic IP/location detection from real device callbacks
7. No SQL migration files were committed under `supabase/migrations/`; instead, the applied database state is documented in `docs/ibo-database.sql`.
8. RLS is enabled on the IBO tables but there are currently **no explicit policies** on those tables. Because the current workflow relies on `SECURITY DEFINER` functions and service-role access in Edge Functions, the panel works, but a future backend pass should review grants and policies carefully.

## Verified backend state at handoff time
The following test data was successfully created in the database during verification:
- Package: `Starter IBO Package`
- Subscription: `testuser` linked to package `Starter IBO Package`
- Device:
  - MAC: `00:1A:79:AA:BB:CC`
  - Device Key: `IBO-TEST-001`
  - linked to `testuser`
- `admin_ibo_panel_data('admin', 'admin12345')` returned the expected package/user/device counts

## Important developer notes
- The original IPTV panel should remain intact.
- The IBO panel is mounted from `src/pages/Index.tsx` as a separate tab.
- The real IBO playlist generation path is **Supabase Storage-backed**, not the old `/get.php` flow.
- Playlist output is package-scoped: the user should only receive content linked to their assigned IBO package.

## Recommended next steps for the next developer
1. Install dependencies and remove the temporary type shim.
2. Move hardcoded Supabase publishable values into environment variables.
3. Add explicit, least-privilege grants/RLS policies for the IBO tables.
4. Add real IBO device heartbeat / callback ingestion if operational telemetry is required.
5. Test full end-to-end flow in the UI:
   - create package
   - map content
   - assign package to user
   - create device
   - generate playlist
   - open public playlist URL
   - verify only package content is included
