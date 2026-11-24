# Accounts and cloud saves (web version)

- `cloud.js` — sign-in gate: email + password (sign up with a 16+/terms checkbox, sign in, forgot password by email link, change password in Settings) or Google, cloud saves (gzip career files in Supabase Storage + a `saves` table), Settings › Account (save now, sign out, delete account). Does nothing without `window.BM_CLOUD`.
- `setup.sql` — run once in Supabase › SQL Editor: table, Row Level Security, private `saves` bucket with per-user folders, 10-career limit, `delete_my_account()`.
- `build_dist.py` — site build; injects the config, the supabase-js 2.45.4 UMD script and `cloud.js` into `/play/` when `~/bm-work/site/cloud-config.json` holds `{"url": ..., "anon": ...}` (public anon key only, never the service_role key).
- `test/` — Playwright test against a mock Supabase client (`mock.js`).

## Supabase settings to set by hand
- Authentication › Providers › Email: Email on, **Confirm email** on, **Minimum password length 8**.
- Authentication › URL Configuration: Site URL = the live address (e.g. https://hoopers-troopers.pages.dev); add `<site>/play/` and `<site>/play/?reset=1` to Redirect URLs.
- Authentication › SMTP: custom SMTP (Resend), so confirmation and reset emails are not limited to a few per hour.
