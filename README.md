# Hotel Sales Edge — Owner Portal

Next.js portal that gives hotel owners, investors, and operators secure,
per-hotel access to performance data living in the HSE Notion workspace:
monthly/weekly STAR data with the race report, sales pipeline with weekly
ROI vs the 10:1 goal, top target accounts, and marketing campaign results.

## How access control works

1. A person signs in with their **email** (magic link in production).
2. The server looks them up in the Notion **User** database:
   row must match `Email` or `Username`, with `Active = Yes`.
3. Their visible hotels are exactly the `🏨 Hotel Vault` relation on
   that row. Only those hotels are queried and sent to the browser.

You manage all access from inside Notion — add a row, relate hotels,
flip `Active` to `NO` to revoke. No code changes ever needed.

## Quick start (demo mode)

```bash
npm install
cp .env.example .env.local        # leave NOTION_TOKEN empty for demo mode
npx auth secret >> .env.local     # adds AUTH_SECRET
npm run dev
```

Open http://localhost:3000 — in dev, enter any email and you'll see the
sample 4-hotel portfolio. This is also the build to iframe into Wix as a
public demo.

## Wiring up Notion (live mode)

1. Notion → Settings → Connections → Develop or manage integrations →
   New internal integration. Copy the token into `NOTION_TOKEN`.
2. On each database (User, Hotel Vault, STR Data, Sales Pipeline,
   Target Companies): ••• menu → Connections → add your integration.
   Share nothing else — the token can only read what you share.
3. Fill the `NOTION_DB_*` IDs in `.env.local` (32-char hex from each
   database URL).
4. `npm run dev`, sign in with an email that exists in the User DB.

Property-name mappings live in `lib/notion.js` and match the live
schemas (Occ, ADR, RevPar, Occ Index, ADR Index, RPI, Whys Behind
Results, Status, Total Rev, Reason Lost, …). `TODO:` comments mark the
spots that need a decision:

- **Running 12 Month** glance row — add a "12 Month" option to the STR
  `Type` select (or parse it from the STAR xlsx).
- **Monthly fee / #weekly salary** — wire `NOTION_DB_SALES_CALLS` so ROI
  uses the real fee per hotel (currently defaults to $1,500/mo).
- **Targets** — add an `Importance` select (1/2/3) to Target Companies
  and confirm its Hotel Vault relation property name.
- **Marketing** — `getMarketing()` returns null (section hides). Point
  it at a Notion marketing DB or the Smartlead/VoiceDrop/ad APIs.
- **User DB** — it has two Hotel Vault relations (`🏨 Hotel Vault` and
  `🏨 Hotel Vault 1`); the code prefers the first. Consider merging.

## Production email (magic links)

Magic links need two things in production:

1. A [Resend](https://resend.com) account + verified domain →
   `AUTH_RESEND_KEY`, `EMAIL_FROM`.
2. A token store (Auth.js requirement for email providers). Easiest on
   Vercel: Marketplace → **Upstash Redis**, then:

   ```bash
   npm i @auth/upstash-redis-adapter @upstash/redis
   ```

   and in `auth.js`:

   ```js
   import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter";
   import { Redis } from "@upstash/redis";
   // inside NextAuth({ ... })
   adapter: UpstashRedisAdapter(Redis.fromEnv()),
   ```

## Deploy

1. Push to GitHub, import the repo in Vercel.
2. Add every variable from `.env.local` in Vercel → Settings →
   Environment Variables (never commit `.env.local`).
3. Add the custom domain, e.g. `portal.hotelsalesedge.com`.
4. On the Wix site, link the "Client Login" button to that URL.
   (Avoid iframing the authenticated portal — browser cookie rules
   break logins inside cross-domain iframes. Iframe only the public
   demo-mode deployment if you want an embedded teaser.)

## Project map

```
auth.js                      Auth.js config — providers + sign-in gate
middleware.js                Protects /dashboard
app/page.js                  Branded login (magic link / dev sign-in)
app/dashboard/page.js        Server boundary: session → access → data
app/api/auth/[...nextauth]/  Auth routes
components/Dashboard.jsx     The portal UI (client component)
lib/access.js                Email → allowed hotels (Notion User DB)
lib/notion.js                All Notion queries + transforms
lib/sample-data.js           Demo portfolio (4 fictional hotels)
```

## Adding a hotel logo

Set the hotel's logo in Notion (a `Logo` files property on Hotel Vault)
or hardcode `logoUrl` — the header slot shows a placeholder with the
property's initials until one exists. Drop the real HSE logo file at
`public/hse-logo.png` and swap the `<HSELogo />` component for an
`<img src="/hse-logo.png" />` when ready.
