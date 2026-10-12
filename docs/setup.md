# Kazkir — Service setup

One-time configuration outside the code. Project ref: `wcgyajmhxbsgidokzxnh`.

## Supabase

1. **Schema:** run `supabase/migrations/*.sql` in the SQL Editor (done 2026-10-12).
2. **URL configuration** (Authentication → URL Configuration):
   - Site URL: `https://kazkir.vercel.app`
   - Redirect URLs: `https://kazkir.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`,
     `https://kazkir-*.vercel.app/auth/callback` (branch preview deployments)
3. **Magic Link email template** (Authentication → Emails → Magic Link). Replace the body with:

   ```html
   <h2>Sign in to Kazkir</h2>
   <p>Tap the button to sign in. The link works once and expires in 1 hour.</p>
   <p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Sign in to Kazkir</a></p>
   <p style="color:#60605d">
     Masuk ke Kazkir: ketuk tombol di atas. Link hanya bisa dipakai sekali dan berlaku 1 jam.
   </p>
   ```

   Why: the default link only works in the browser that requested it. This version works in any
   browser or device (request on laptop, tap on phone). `{{ .RedirectTo }}` already contains
   `…/auth/callback?next=…`, so the extra parameters are appended with `&`.
   Apply the same change to the **Confirm signup** template (first-time sign-ins), using `type=signup`.

4. **Google provider** (Authentication → Providers → Google): Client ID + secret from Google Cloud.

## Google Cloud (project "Kazkir")

- OAuth client type: Web application
  - Authorized JavaScript origins: `https://kazkir.vercel.app`, `http://localhost:3000`
  - Authorized redirect URI: `https://wcgyajmhxbsgidokzxnh.supabase.co/auth/v1/callback`
- Branding → Authorized domains: `wcgyajmhxbsgidokzxnh.supabase.co`, `kazkir.vercel.app`
- Audience: **Testing** with test users until the app has a public home page and privacy policy;
  then add both links on the Branding page and click **Publish app** (no review needed for
  name/email scopes, as long as no logo is uploaded).

## Vercel (personal Hobby account, project `kazkir`)

- Production: https://kazkir.vercel.app, deploys on every push to `main`; branches get preview URLs
- Region: `sin1` (Singapore) via `vercel.json`
- Env vars (type **Config**, all environments): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## GitHub (`ericlimquip-dot/kazkir`)

Settings → Secrets and variables → Actions:

- `SUPABASE_URL` = `https://wcgyajmhxbsgidokzxnh.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` = the publishable key

## Local development

`.env.local` (git-ignored):

```
NEXT_PUBLIC_SUPABASE_URL=https://wcgyajmhxbsgidokzxnh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

## Windows: antivirus HTTPS scanning

This PC's antivirus/firewall re-signs HTTPS traffic with its own root certificate. Browsers trust
it (it's in the Windows store) but Node.js doesn't, so server-side calls to Supabase failed with
`UNABLE_TO_VERIFY_LEAF_SIGNATURE` ("fetch failed"). The `dev` and `start` scripts therefore run
Node with `--use-system-ca`, which keeps certificate checks on but uses the Windows trust store.
Diagnose with `node scripts/net-check.mjs` (and `node --use-system-ca scripts/net-check.mjs`).
Vercel is unaffected.
