# Ghar website — working instructions for Claude

This folder is the LIVE website for https://ghar.nl (brand: Ghar — hand block printed home textiles, by Dimple & Akkriti).

## Site structure (since July 2026)
- Five pages + cart: index.html (Home), shop.html (Shop), about.html (Our Story: Why Ghar / Why Cotton / Founders), craft.html (craft steps + Karghewale makers), care.html (care guide + note from us), cart.html (bag + checkout)
- ALL html pages load styles.css and cart.js with a cache-busting query string, e.g. `styles.css?v=20260722` / `cart.js?v=20260722` — this was added because browsers were serving stale cached copies after pushes. **Bump this version string on every future push to CSS/JS** (find/replace the date across all 6 HTML files) so visitors always get the latest styles/script without needing a hard refresh.
- Copy rules: positive language (no "not X but Y" framing), no AMI mention, say "India" not "Rajasthan/Jaipur" for sourcing (multi-state future), the Karghewale name and identifying details are deliberately NOT published on the site (competitors could copy the sourcing) — the makers section speaks generically of "artisan communities across India"; say "100% pure cotton" (never "canvas"); no comparative phrasing (slow, not slower); no decorative bold words in prose; "two friends" not colleagues; "Netherlands × India"
- Shared stylesheet: styles.css (all pages link to it — keep styles there, not inline per page)
- Logo (since July 2026): jharokha (Rajasthani dome pavilion) illustration + "Ghar" wordmark with Devanagari र. Files: images/site/logo.png (navy, transparent — used in nav), images/site/logo-white.png (white — used in index hero + all footers), images/site/favicon.png (dome crop). Source file: user's Canva export "Ghar (9).png". Never reintroduce the old line-house SVG. (Old unused superseded exports icon.png/icon_transparent.png were removed August 2026.)
- Useful anchors: about.html#karghewale, #craft, #care, #founders; shop.html#soon

## Hosting setup (updated July 2026 — Netlify was removed)
- Hosted ONLY on GitHub Pages, repo: https://github.com/ghar-nl/ghar-website (GitHub username: ghar-nl)
- Branch: main, folder: / (root). Custom domain ghar.nl via the CNAME file (do not delete or modify CNAME).
- DNS is at TransIP ("TransIP-instellingen" toggle ON for ghar.nl): 4 × A records to GitHub Pages IPs (185.199.108–111.153) + AAAA; www CNAME → @. Mail records (MX, SPF, DKIM, DMARC) exist in the TransIP zone but no one uses @ghar.nl email.
- History note: the site briefly ran on Netlify (Netlify Drop + Netlify DNS) in July 2026; that project and DNS zone were deleted. Never redeploy to Netlify.

## Pre-order system (added July 2026)
- Cart: localStorage ("gharCart"), logic in cart.js (included on every page with defer). Product catalog lives in GHAR_PRODUCTS in cart.js. "Add to bag" buttons call gharAdd(id, this). Nav "Bag" link (id=nav-bag) shows count. See "Product catalog" below for the full id/price list — it's no longer just cushions or one flat price.
- cart.html: cart display + EU-27 pre-order checkout form. No payment collected — customers are emailed later.
- Backend: Google Apps Script web app (project "Ghar Pre-Order Endpoint", owned by dimplec1511@gmail.com), bound to the private Google Sheet "Ghar Pre-Orders". Sheet is shared with nobody. Sheet URL: https://docs.google.com/spreadsheets/d/1rD2-qwvDXAbAH_sUpbS7XFubgWRas_dwrGQg4x_zdao/edit (also saved as "Ghar Orders & Messages.webloc" on the user's Desktop).
- The form POSTs JSON to the SCRIPT_URL in cart.html with a shared secret (must match SECRET in the Apps Script). Honeypot field "company" catches bots. Notifications go to NOTIFY_EMAIL (dimple@ghar.nl).
- If the Apps Script code changes, a NEW deployment version must be created (Deploy → Manage deployments → edit → new version) — the URL stays the same.
- Sheet columns (Orders tab): Timestamp | Name | Email | Phone | Address 1 | Address 2 | City | Region | Postal Code | Country | Items | Subtotal | Discount | Shipping | Total EUR.
- Sheet also has: "Notify" tab (emails from the shop popup) and "Stock" tab (id | limit | sold). The Apps Script doGet returns remaining stock as JSON, keyed by id; any id with no row in the Stock tab is treated as unlimited (fails open — no "sold out"/"low stock" badge) by gharRemaining() in cart.js. doPost checks stock (rejects with error "sold_out"), updates sold counts, and accepts {type:'notify'} signups. To change stock limits: edit the Stock tab directly (no redeploy needed). If Apps Script code changes: Manage deployments → edit → New version.
  - **The 8 Ikat SKUs added August 2026 have no Stock tab rows yet** (wallart, largecushion, runner, rectmat, circlemat, napkin, coaster, and the 4 totebag-* ids), so they currently show as always-in-stock/no badge on the live site. Add rows with these limits to get real badges: wallart 6, largecushion 9, runner 12, rectmat 10, circlemat 10, napkin 15, coaster 23. The 4 tote ids should NOT get independent Stock-tab limits — see "Shared stock groups" below for why.
- Pricing (in cart.js GHAR_PRODUCTS): no longer a single flat price — see "Product catalog" below for the current per-product prices. €5 shipping, free shipping on subtotal ≥ €50; discount code GHARPREORDER20 = 20% off on subtotal ≥ €50; max 6 items per order (GHAR_MAX_PER_ORDER, also enforced server-side as MAX_PER_ORDER — this now applies across the whole catalog, not just cushions, so keep any UI copy about it item-neutral). Home page has a .sale-banner announcing the pre-order sale (index.html only; hero there has inline padding-top:0 to sit under it). Shop page shows a once-per-visitor limited-stock popup (localStorage key gharNotifySeen) collecting notify emails; sold-out and "last few pieces" badges appear from live stock (≤5 = low).

### Shared stock groups (added August 2026)
- Some products are sold as one item with several visual variants that are really drawn from a single, small combined batch (e.g. the Everyday Tote Bag: 4 colour/orientation variants, only 3 pieces exist in total). The Google Sheet's Stock tab can only track a limit *per id*, not a limit shared *across* several ids — so a true shared pool is enforced purely client-side, via `GHAR_STOCK_GROUPS` in cart.js and the `gharEffectiveRemaining(id)` helper (used everywhere `gharRemaining(id)` used to be checked before adding to cart: gharAdd, gharApplyStockToShop, gharProductModal's sold-out check, cart.html's qty+ button and cart-line "last pieces" label).
- If you add another multi-variant product with a shared pool, add an entry to `GHAR_STOCK_GROUPS` (ids array + limit) rather than inventing a new mechanism — and do NOT give the individual variant ids their own Stock-tab rows, since that would let the *sum* across variants exceed the real physical stock (each id's "sold" count is tracked independently by the Apps Script, with no awareness that the ids share a pool).

## Makers section (craft.html)
- The makers section (id="makers") stays generic per the Karghewale de-branding rule above, EXCEPT for one small italic gratitude line: "Grateful, always, to Karghewale for their support and partnership on this journey." That is the ONLY place Karghewale is named on the site — do not add more detail or expand it.

## FAQ section (index.html, added for SEO)
- Added purely to improve Google visibility (FAQ rich text/schema helps ranking). Two parts, both must stay in sync if edited: the visible `<details>/<summary>` accordion (id="faq", native click-to-expand, no JS needed) and a matching `<script type="application/ld+json">` FAQPage block right after it. 9 questions currently: what is hand block printing, misprints/ink variations, alignment, wholesale-vs-custom (answer is always NO — hours designing → blocks carved → printed block by block → cut/sewn to size → QA → shipped to us → shipped to customer), pricing rationale (artisan labour, one block can take up to a week to carve), care/washing, shipping/delivery, why stock is limited, workshops. If more questions are added, update the JSON-LD identically.

## Workshop photo/video gallery (craft.html, added for the craft page)
- Section `.workshop`/`#workshop` ("From the workshop") sits between the 4-step craft process and the makers section. 6 `.stamp-item` figures (5 photos: images/craft/1.jpeg..5.jpeg, 1 muted looping video: images/craft/loop.mp4) each with alt text + figcaption.
- Scroll animation: IntersectionObserver-driven "stamp" reveal (script at bottom of craft.html, before `</body>`) — each item fades/scales/rotates in and a terracotta ink-overlay (`.stamp-item::after`, mix-blend-mode:multiply) fades out, evoking a block being pressed onto fabric. CSS in styles.css under "WORKSHOP STAMP GALLERY". Grid folds to 2 cols ≤900px, 1 col ≤560px.
- craft-1..5.jpeg were converted from user-uploaded HEIC photos (Mac Finder Quick Actions → Convert Image, since the Linux sandbox can't decode HEIC) then enhanced with PIL (autocontrast + colour/brightness/contrast, resized to 1400px max). craft-loop.mp4 is the user's uploaded video with audio stripped via ffmpeg (`-an`) and re-encoded H.264/yuv420p for autoplay compatibility.

## Mobile
- Responsive breakpoints in styles.css: ≤900px (hamburger nav, single-column layouts, stacked newsletter) and ≤560px (single-column product/craft grids, stacked hero buttons). The hamburger button is INJECTED by cart.js (gharBurger) — no markup in the HTML files; menu opens by toggling .nav-open on <nav>.
- Avoid inline padding styles on sections — they override the mobile media queries (this bit us once on craft.html).

## Image organization (since August 2026)
- `images/` is organized into subfolders, not flat: `images/site/` (logo, favicon, hero, founders, story, shop-hero, lifestyle1/2 — general site photography, some reused across pages), `images/craft/` (`1.jpeg`..`5.jpeg` + `loop.mp4` — the workshop stamp gallery on craft.html), `images/products/<id>/` (`1.jpg`, `2.jpg`, ... sequential, no gaps — one folder per cushion design: marigold, rivervine, stone, forest, golden). `forest`'s cover photo is `images/site/lifestyle2.jpeg` (dual-used on shop.html too) rather than a file inside `images/products/forest/`.
- Each product's `img` (shop card thumbnail) in GHAR_PRODUCTS always equals `images[0]` (the gallery's first photo) — same file, referenced twice in the data structure. Do NOT reintroduce a separate "cover" photo file that duplicates the gallery's first shot (this happened before — `product2/3/4.jpeg` were re-uploads of `stone-1/rivervine-1/marigold-1.jpg` under a different name, causing the same photo to appear twice in the product modal gallery — cleaned up August 2026).
- When adding a new photo to a product, drop it in `images/products/<id>/` as the next sequential number and add that path to the `images[]` array in cart.js — keep numbering gap-free (renumber if a photo is removed).

## Rules for editing
1. The persistent local clone lives at `/Users/dimple/Claude/ghar-website` — work directly in this folder (index.html, shop.html, about.html, styles.css, images/). Do not create copies in session outputs. See the `ghar-website` skill for the pull/push workflow.
2. Image references are relative (images/site/..., images/products/<id>/..., images/craft/...) — keep them that way.
3. Keep nav and footer identical across all three pages when editing (they are duplicated in each file).
4. After ANY change the user approves, ALWAYS push it to GitHub in the same session (see the `ghar-website` skill). The site only updates once pushed — remind the user if a push isn't possible.

## How to push changes to GitHub (since August 2026 — direct git push)
`/Users/dimple/Claude/ghar-website` has a git remote (`origin` → https://github.com/ghar-nl/ghar-website.git) with push access already configured via a GitHub personal access token stored in macOS Keychain (git credential helper `osxkeychain`, scoped to `ghar-nl/ghar-website`, host `github.com`). Just `git add`, `git commit`, `git push origin main` like any normal repo — no browser/Chrome extension needed. See the `ghar-website` skill for the exact steps (pull-first, cache-busting version bump, verify-before-push).

Fallback only if the stored token has expired/been revoked and git push fails with an auth error: use the Claude in Chrome extension (user is logged in to GitHub as ghar-nl) to upload changed files at https://github.com/ghar-nl/ghar-website/upload/main (or `/upload/main/images` for images), then "Commit changes" directly to main. Deployment takes 1–2 minutes either way (check the Actions tab for "pages build and deployment"); verify at https://ghar.nl if asked.

- Product cards on shop open a detail viewer modal (gharProductModal in cart.js) with zoomable gallery — add more photos per product via the images arrays in GHAR_PRODUCTS. Nav has a "Workshops" item (class ghar-workshops) that opens a coming-soon popup. Newsletter is branded "Postcards from Ghar" with button "Count me in".
- Product modal layout (`.pm-grid` in styles.css): a 2-col CSS grid (`1fr 1.05fr`) with `.pm-gallery` (image + thumbs) as the left grid item and `.pm-info` (title/price/description) as the right. Both grid items MUST keep `min-width:0` — without it, `.pm-thumbs`' intrinsic content width (up to 14 thumbnails) blows out the `1fr` track and pushes `.pm-info` off-screen, rendering as blank space. `.pm-main` uses fixed `height:420px` (280px on mobile) + `width:100%` + `object-fit:contain` (not `cover`, which crops photo tops) so tall/portrait photos are never cropped.
- The modal's zoom-hint text under the gallery just reads "Click the photo to zoom" — do not reintroduce "more photos coming soon" now that every product has a full gallery. (Zoom hint and zoom/pan listeners are skipped automatically when a product has no photos yet, per the placeholder handling in gharProductModal.)
- Products with `variantGroup` set (currently just the tote bag, see "Product catalog") get an extra `.pm-variants` picker rendered above the size line — clicking a variant swaps which id "Add to bag" targets and updates the size text, without re-rendering the whole modal.

## Product catalog (block print cushions + Ikat collection, added August 2026)
Shop.html no longer hand-writes product cards in HTML — it renders them from GHAR_PRODUCTS at runtime (see the inline `<script>` at the bottom of shop.html: `gharShopEntries`/`gharCardHtml`/`gharRenderShop`). **To add, remove, or reprice a product, edit cart.js only** — shop.html's script picks it up automatically. Each product needs: `category`, `printType` ('block'|'ikat'), `rooms` (array of room filter values, `[]` if it doesn't belong to any room), `favRank` (lower = earlier in the default "Favourites" sort), and `mini` (one-line teaser for the card — separate from the longer `desc` array used in the modal).

**Block print cushions (original 5, unchanged prices):** marigold, rivervine, stone, forest, golden — €27.99 each, 30×30cm, `rooms:['living']`. golden ("Golden Trellis") was added July 2026; photos for all 5 live in `/Users/dimple/Desktop/Ghar Cushions Photo/` (resize to max 1600px, JPEG ~82 quality before adding).

**Ikat collection (new, no photos yet):** every entry below has `images: []` / `img: ''`, which renders the dashed "Photo coming soon" placeholder (`gharPhotoPlaceholder()` in cart.js, reusing the `.photo-label` CSS built for exactly this). Swap in real paths the same way as any other product — nothing else needs to change.
- wallart — Ikat Wall Art Square, €19.99, 30×30cm, unframed, `rooms:['living']`
- largecushion — Ikat Extra-Large Cushion Cover, €39.99, 60×60cm, small batch, `rooms:['living']`
- runner — Ikat Table Runner, €46.99, 35×150cm, `rooms:['living','dining']`
- rectmat / circlemat — Ikat Rectangle/Round Table Mat, €31.99 each, 32×45cm / 30cm diameter, `rooms:['dining']`
- napkin — Ikat Napkin, €15.99, `rooms:['dining']`. **Size (40×40cm) is an assumption** — the user didn't specify one; confirm/update if they give a real size.
- coaster — Ikat Coaster, €12.99, 10×10cm, `rooms:['dining']`
- Everyday Tote Bag — €56.99, one product shown as a single shop card ("Choose options" instead of "Add to bag", opens the modal's variant picker) but stored as 4 separate ids sharing one stock pool of 3 — see "Shared stock groups" above: `totebag-h-same`, `totebag-h-contrast`, `totebag-v-same`, `totebag-v-contrast`. `rooms: []` (not room-tagged). All 4 share `GHAR_TOTE_DESC`.

### Shop filters (shop.html)
- **Room filter**: Living room, Dining room, Kitchen, Bedroom, Bathroom, Kids room. **"Dining room" was added by Claude** — the user's original room list was Living/Kitchen/Bedroom/Bathroom/Kids, but they then described a set of dining-specific products (napkins, coasters, runner, placemats) with nowhere else coherent to go. If the user pushes back, this is the one filter label to reconsider. Kitchen/Bedroom/Bathroom/Kids room currently have zero tagged products, so selecting them shows a "coming soon" message (`GHAR_ROOM_MESSAGE` in shop.html) instead of an empty grid.
- **Print filter**: All prints / Ikat / Block print, matches `printType`.
- **Sort**: Favourites (default, sorts by `favRank` — wall art, extra-large cushion, and table runner rank first per the user's instruction, everything else after), Price low→high, Price high→low.
- Filtering/sorting is entirely client-side over GHAR_PRODUCTS; there's no pagination or server involvement.

### Shop page copy structure (since August 2026)
- The hero stays short (`.page-hero`) — the fuller "why so many product types now / everything is limited / mix and match" messaging lives in `.shop-intro`, a dedicated band between the hero and the filter bar. Keep this split: don't let the hero copy grow long again, and don't delete `.shop-intro` to "simplify" — it's there on purpose so the hero stays a hero.
- "Coming soon" grid (`#soon`) now only lists things that are genuinely not designed yet: Makeup/Everyday Pouch, Wine/Bottle Holder, Kitchen Apron. Everything else that used to be a "coming soon" card (table runners, placemats, coasters, tote bags, napkins, big cushions, wall art) is now a real product — don't add these back here.
