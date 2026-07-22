# Ghar website — working instructions for Claude

This folder is the LIVE website for https://ghar.nl (brand: Ghar — hand block printed home textiles, by Dimple & Akkriti).

## Site structure (since July 2026)
- Five pages + cart: index.html (Home), shop.html (Shop), about.html (Our Story: Why Ghar / Why Cotton / Founders), craft.html (craft steps + Karghewale makers), care.html (care guide + note from us), cart.html (bag + checkout)
- ALL html pages load styles.css and cart.js with a cache-busting query string, e.g. `styles.css?v=20260722` / `cart.js?v=20260722` — this was added because browsers were serving stale cached copies after pushes. **Bump this version string on every future push to CSS/JS** (find/replace the date across all 6 HTML files) so visitors always get the latest styles/script without needing a hard refresh.
- Copy rules: positive language (no "not X but Y" framing), no AMI mention, say "India" not "Rajasthan/Jaipur" for sourcing (multi-state future), the Karghewale name and identifying details are deliberately NOT published on the site (competitors could copy the sourcing) — the makers section speaks generically of "artisan communities across India"; say "100% pure cotton" (never "canvas"); no comparative phrasing (slow, not slower); no decorative bold words in prose; "two friends" not colleagues; "Netherlands × India"
- Shared stylesheet: styles.css (all pages link to it — keep styles there, not inline per page)
- Logo (since July 2026): jharokha (Rajasthani dome pavilion) illustration + "Ghar" wordmark with Devanagari र. Files: images/logo.png (navy, transparent — used in nav), images/logo-white.png (white — used in index hero + all footers), images/favicon.png (dome crop). Source file: user's Canva export "Ghar (9).png". Never reintroduce the old line-house SVG.
- Useful anchors: about.html#karghewale, #craft, #care, #founders; shop.html#soon

## Hosting setup (updated July 2026 — Netlify was removed)
- Hosted ONLY on GitHub Pages, repo: https://github.com/ghar-nl/ghar-website (GitHub username: ghar-nl)
- Branch: main, folder: / (root). Custom domain ghar.nl via the CNAME file (do not delete or modify CNAME).
- DNS is at TransIP ("TransIP-instellingen" toggle ON for ghar.nl): 4 × A records to GitHub Pages IPs (185.199.108–111.153) + AAAA; www CNAME → @. Mail records (MX, SPF, DKIM, DMARC) exist in the TransIP zone but no one uses @ghar.nl email.
- History note: the site briefly ran on Netlify (Netlify Drop + Netlify DNS) in July 2026; that project and DNS zone were deleted. Never redeploy to Netlify.

## Pre-order system (added July 2026)
- Cart: localStorage ("gharCart"), logic in cart.js (included on every page with defer). Product catalog lives in GHAR_PRODUCTS in cart.js — ids: marigold, rivervine, stone, forest (€22 each). "Add to bag" buttons call gharAdd(id, this). Nav "Bag" link (id=nav-bag) shows count.
- cart.html: cart display + EU-27 pre-order checkout form. No payment collected — customers are emailed later.
- Backend: Google Apps Script web app (project "Ghar Pre-Order Endpoint", owned by dimplec1511@gmail.com), bound to the private Google Sheet "Ghar Pre-Orders". Sheet is shared with nobody. Sheet URL: https://docs.google.com/spreadsheets/d/1rD2-qwvDXAbAH_sUpbS7XFubgWRas_dwrGQg4x_zdao/edit (also saved as "Ghar Orders & Messages.webloc" on the user's Desktop).
- The form POSTs JSON to the SCRIPT_URL in cart.html with a shared secret (must match SECRET in the Apps Script). Honeypot field "company" catches bots. Notifications go to NOTIFY_EMAIL (dimple@ghar.nl).
- If the Apps Script code changes, a NEW deployment version must be created (Deploy → Manage deployments → edit → new version) — the URL stays the same.
- Sheet columns (Orders tab): Timestamp | Name | Email | Phone | Address 1 | Address 2 | City | Region | Postal Code | Country | Items | Subtotal | Discount | Shipping | Total EUR.
- Sheet also has: "Notify" tab (emails from the shop popup) and "Stock" tab (id | limit | sold — limits 10 per design). The Apps Script doGet returns remaining stock as JSON; doPost checks stock (rejects with error "sold_out"), updates sold counts, and accepts {type:'notify'} signups. To change stock limits: edit the Stock tab directly (no redeploy needed). If Apps Script code changes: Manage deployments → edit → New version.
- Pricing (in cart.js GHAR_PRODUCTS): ALL FOUR cushions flat €27.99 (Stone Lattice is NOT priced differently, even though it has a different front/back print — do not add price-justification text for it); €5 shipping, free shipping on subtotal ≥ €50; discount code GHARPREORDER20 = 20% off on subtotal ≥ €50; max 6 cushions per order (GHAR_MAX_PER_ORDER, also enforced server-side as MAX_PER_ORDER). Stock limits: 45 per design (Stock tab). Home page has a .sale-banner announcing the pre-order sale (index.html only; hero there has inline padding-top:0 to sit under it). Shop page shows a once-per-visitor limited-stock popup (localStorage key gharNotifySeen) collecting notify emails; sold-out and "last few pieces" badges appear from live stock (≤5 = low).

## Makers section (craft.html)
- The makers section (id="makers") stays generic per the Karghewale de-branding rule above, EXCEPT for one small italic gratitude line: "Grateful, always, to Karghewale for their support and partnership on this journey." That is the ONLY place Karghewale is named on the site — do not add more detail or expand it.

## FAQ section (index.html, added for SEO)
- Added purely to improve Google visibility (FAQ rich text/schema helps ranking). Two parts, both must stay in sync if edited: the visible `<details>/<summary>` accordion (id="faq", native click-to-expand, no JS needed) and a matching `<script type="application/ld+json">` FAQPage block right after it. 9 questions currently: what is hand block printing, misprints/ink variations, alignment, wholesale-vs-custom (answer is always NO — hours designing → blocks carved → printed block by block → cut/sewn to size → QA → shipped to us → shipped to customer), pricing rationale (artisan labour, one block can take up to a week to carve), care/washing, shipping/delivery, why stock is limited, workshops. If more questions are added, update the JSON-LD identically.

## Workshop photo/video gallery (craft.html, added for the craft page)
- Section `.workshop`/`#workshop` ("From the workshop") sits between the 4-step craft process and the makers section. 6 `.stamp-item` figures (5 photos: images/craft-1.jpeg..craft-5.jpeg, 1 muted looping video: images/craft-loop.mp4) each with alt text + figcaption.
- Scroll animation: IntersectionObserver-driven "stamp" reveal (script at bottom of craft.html, before `</body>`) — each item fades/scales/rotates in and a terracotta ink-overlay (`.stamp-item::after`, mix-blend-mode:multiply) fades out, evoking a block being pressed onto fabric. CSS in styles.css under "WORKSHOP STAMP GALLERY". Grid folds to 2 cols ≤900px, 1 col ≤560px.
- craft-1..5.jpeg were converted from user-uploaded HEIC photos (Mac Finder Quick Actions → Convert Image, since the Linux sandbox can't decode HEIC) then enhanced with PIL (autocontrast + colour/brightness/contrast, resized to 1400px max). craft-loop.mp4 is the user's uploaded video with audio stripped via ffmpeg (`-an`) and re-encoded H.264/yuv420p for autoplay compatibility.

## Mobile
- Responsive breakpoints in styles.css: ≤900px (hamburger nav, single-column layouts, stacked newsletter) and ≤560px (single-column product/craft grids, stacked hero buttons). The hamburger button is INJECTED by cart.js (gharBurger) — no markup in the HTML files; menu opens by toggling .nav-open on <nav>.
- Avoid inline padding styles on sections — they override the mobile media queries (this bit us once on craft.html).

## Rules for editing
1. Edit files DIRECTLY in this folder (index.html, shop.html, about.html, styles.css, images/). Do not create copies in session outputs.
2. Image references are relative (images/*.jpeg) — keep them that way.
3. Keep nav and footer identical across all three pages when editing (they are duplicated in each file).
4. After ANY change the user approves, ALWAYS push it to GitHub in the same session (see below). The site only updates once pushed — remind the user if a push isn't possible.

## How to push changes to GitHub
Use the Claude in Chrome extension (user is logged in to GitHub as ghar-nl):
1. Navigate to https://github.com/ghar-nl/ghar-website/upload/main (for root files) or https://github.com/ghar-nl/ghar-website/upload/main/images (for images).
2. Use the find tool to locate the file input, then file_upload with the changed files' paths from this folder. Files with the same name are overwritten — that's how updates work.
3. Click "Commit changes" (commit directly to main).
4. Deployment takes 1–2 minutes (check the Actions tab for "pages build and deployment"); verify at https://ghar.nl if asked.

If the Chrome extension is not connected, ask the user to open Chrome and retry before falling back to manual instructions.

- Product cards on shop open a detail viewer modal (gharProductModal in cart.js) with zoomable gallery — add more photos per product via the images arrays in GHAR_PRODUCTS. Nav has a "Workshops" item (class ghar-workshops) that opens a coming-soon popup. Newsletter is branded "Postcards from Ghar" with button "Count me in".
- Product modal layout (`.pm-grid` in styles.css): a 2-col CSS grid (`1fr 1.05fr`) with `.pm-gallery` (image + thumbs) as the left grid item and `.pm-info` (title/price/description) as the right. Both grid items MUST keep `min-width:0` — without it, `.pm-thumbs`' intrinsic content width (up to 14 thumbnails) blows out the `1fr` track and pushes `.pm-info` off-screen, rendering as blank space. `.pm-main` uses fixed `height:420px` (280px on mobile) + `width:100%` + `object-fit:contain` (not `cover`, which crops photo tops) so tall/portrait photos are never cropped.
- The modal's zoom-hint text under the gallery just reads "Click the photo to zoom" — do not reintroduce "more photos coming soon" now that every product has a full gallery.

## Product catalog (5 cushions, all €27.99 flat)
- marigold, rivervine, stone, forest, golden — five ids in GHAR_PRODUCTS (cart.js). Each has a full `images[]` array (the shop card's original photo first, then additional angle/detail shots) so the product modal's thumbnail strip and arrows show multiple photos per design.
- golden ("Golden Trellis Cushion Cover") was added July 2026 as the 5th design — marigold-gold medallions on a trailing vine with blue accents, green border. Photos: images/golden-1.jpg .. golden-11.jpg, converted from the user's "Ghar Cushions Photo/New 1..11.jpeg" folder on Desktop.
- Source photos for all 5 products' galleries live in `/Users/dimple/Desktop/Ghar Cushions Photo/` (user-maintained folder, organized by product name prefix, e.g. "Marigold*.jpeg", "River Vine Cushion Cover*.jpeg", "Stone Lattice Cushion Cover*.jpeg/.png", "Forest Arabesque Cushion Cover*.jpeg", "New *.jpeg" for Golden Trellis). When the user adds more photos there, resize to max 1600px + convert to JPEG quality ~82 before adding to images/ and to the relevant product's images[] array.
- shop.html has a small (64×64px, `.shop-hero-img`) lifestyle photo (images/shop-hero.jpg, from "Main photo.png" in the same Desktop folder) next to the "Cushion covers. First of many." heading — keep it small; do not let it grow to a full hero banner.
