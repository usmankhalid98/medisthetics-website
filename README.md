# medisthetics — Landing / Info + Shop (brand rebuild)

Static website rebuild for **medisthetics.co.uk** using the brand PDF guidelines.

**Brand applied:**
- Fonts: Plus Jakarta Sans (headings + body, Proxima Nova fallback)
- Colours: Navy `#0A2240`, Blue-dark `#2F4E8A`, Blue `#5B8DEF`, Sky `#DCE8F5`, Cream `#FFF6E5`, Tan `#C9B795`, Mint `#A8F5C0`
- Voice/cards: "Machines for sale / Onsite servicing / Expert technicians", "Technology That Works", "The importance of regular machine servicing"

**Pages:**
- `index.html` — landing + info (services, how it works, contact via WhatsApp)
- `shop.html` — dedicated shop: search, sort, tag filters, live count, product detail modal with WhatsApp enquiry
- `admin.html` — admin panel: add **title, image, price** (+ badge/description). Works in local demo mode out of the box; connect the Supabase backend below to share stock across all devices.

**Content sourced from live site:**
Home / About (mission, 3 degree engineers, 8+ years, cheaper than distributors, 24/7 support), Services (PPM, Reactive, Flash-lamp/Consumable, Tech support), Refurbished Machines (7 real listings + prices incl. VAT/delivery, warranty notes), Contact (07458 390786, HeyGoldie booking).

## Run locally

No build step. Either:

1. Just open `index.html` in a browser, or
2. Serve properly (recommended so images/modules work best):
```bash
cd medisthetics
python3 -m http.server 8000
# then visit http://localhost:8000/
# shop at http://localhost:8000/shop.html
# admin at http://localhost:8000/admin.html
```

## Admin usage (local demo mode)

1. Open `admin.html`, password `admin123` (change `DEMO_PASSWORD` in `js/admin.js`).
2. Fill Title + Price (£) + Image (upload file OR paste image URL) + optional badge/description → Add machine.
3. It appears instantly in `shop.html`. Edit/Delete from the list. Export JSON for backup. Restore defaults anytime.

> Note: demo storage is per-browser localStorage (`medisthetics_products_v1`). To make stock + uploaded photos shared for every visitor, connect the cloud backend once (below) — the site keeps working locally until you do.

## Cloud backend — shared database + image uploads (Supabase, free)

One-time setup (~15 minutes). After this, `admin.html` signs in with email + password, photos upload to hosted storage, and every visitor sees the same live stock.

1. **Create a project** at https://supabase.com/dashboard (free) → note the **Project URL** and **anon public key** (Project Settings → API).
2. **Create the tables**: open the project → SQL Editor → New query → paste the whole of `supabase/schema.sql` → Run. This creates the `products` table, public-read/admin-write rules, the `product-images` bucket, and seeds your 7 current machines.
3. **Create your admin login**: Authentication → Users → Add user → Create new user (your email + a strong password). Confirm the email if asked.
4. **Connect the site**: paste the URL + anon key into `js/supabase-config.js`, then commit + push:
   ```bash
   git add -A && git commit -m "Connect shop backend" && git push
   ```
5. **Verify**: open the live `admin.html` — the login now asks for email + password. Sign in, add a test machine with a photo upload, then check `shop.html` in a private window: it should be there.

How it works: `js/supabase.js` talks to Supabase with plain `fetch` (no dependencies). `js/store.js` keeps a local cache so pages render instantly and still work offline; `shop.html` refreshes from the cloud on load; uploads are auto-shrunk to max 1600px before sending to keep storage small. The anon key is safe to commit — the SQL rules only allow the public to *read*; all writes need your admin login.
