# medisthetics — Landing / Info + Shop (brand rebuild)

Static website rebuild for **medisthetics.co.uk** using the brand PDF guidelines.

**Brand applied:**
- Fonts: Plus Jakarta Sans (headings + body, Proxima Nova fallback)
- Colours: Navy `#0A2240`, Blue-dark `#2F4E8A`, Blue `#5B8DEF`, Sky `#DCE8F5`, Cream `#FFF6E5`, Tan `#C9B795`, Mint `#A8F5C0`
- Voice/cards: "Machines for sale / Onsite servicing / Expert technicians", "Technology That Works", "The importance of regular machine servicing"

**Pages:**
- `index.html` — landing + info + shop preview (machines for sale)
- `shop.html` — dedicated shop: search, sort, tag filters, live count, product detail modal
- `admin.html` — admin panel: add **title, image, price** (+ badge/description). No backend needed; uses localStorage so edits show instantly on the shop.

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

## Admin usage

1. Open `admin.html`, password `admin123` (change `ADMIN_PASSWORD` in `js/admin.js`).
2. Fill Title + Price (£) + Image (upload file OR paste image URL) + optional badge/description → Add machine.
3. It appears instantly in `index.html` → #shop and `shop.html`. Edit/Delete from the list. Export JSON for backup. Restore defaults anytime.

> Note: storage is per-browser localStorage (`medisthetics_products_v1`) — perfect for demo. For production multi-user admin, plug in a small backend (e.g. Firebase/Supabase/WordPress API) and replace `js/store.js` load/save.
