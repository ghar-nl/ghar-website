/* ── GHAR CART — shared across all pages ─────────────────────
   Cart lives in localStorage under "gharCart" as {productId: qty}.
   Include with: <script src="cart.js" defer></script>              */

const GHAR_API = 'https://script.google.com/macros/s/AKfycbwPyxknSnMjppLX_leBgCdiEBlrzqYHj98iEMJHjgbmeNtes_BQjEHx3Pa51t-MuOEdDw/exec';
const GHAR_SECRET = '47d80edaf79922927989f72c'; // must match Apps Script

/* Shipping zones (Nov 2026). Strict JSON on purpose: the Apps Script reads this
   block from the live site to charge the same shipping at Stripe, so keep the
   `]; // end GHAR_SHIP_ZONES` marker. First zone listing the country wins; the
   zone with an empty `countries` list covers every other EU country.
   `freeMin` = free shipping when the subtotal (before discount) is at least this. */
const GHAR_SHIP_ZONES = [
  { "label": "Netherlands", "price": 5, "freeMin": 59.99, "countries": ["Netherlands"] },
  { "label": "Belgium, Germany and Luxembourg", "price": 8, "freeMin": 100, "countries": ["Belgium", "Germany", "Luxembourg"] },
  { "label": "Rest of the EU", "price": 13, "freeMin": 150, "countries": [] }
]; // end GHAR_SHIP_ZONES
function gharShipZone(country) {
  return GHAR_SHIP_ZONES.find(function (z) { return z.countries.indexOf(country) >= 0; }) ||
    GHAR_SHIP_ZONES.find(function (z) { return !z.countries.length; });
}
function gharCountry() { try { return localStorage.getItem('gharCountry') || ''; } catch (e) { return ''; } }
const GHAR_PROMO_CODE = 'GHARPREORDER20';
const GHAR_PROMO_RATE = 0.20;       // 20% off
const GHAR_PROMO_MIN = 100;         // on orders above €100
const GHAR_LOW_STOCK = 5;           // "last few pieces" threshold
const GHAR_MAX_PER_ORDER = 6;       // max items per person/order, across the whole catalog

/* Some products are sold from one shared, combined stock pool under several ids
   (e.g. the tote bag's 4 colour/orientation variants share one batch of 3 — see
   CLAUDE.md "Shared stock groups"). Until each id has its own row in the Sheet's
   Stock tab, this is the only place that limit is enforced.
   `limit` is always in PHYSICAL PIECES. `weights` (optional) says how many
   pieces one unit of a given id consumes — omit it (or an id) to default to 1
   piece per unit, as with the tote bag where each id IS one physical bag. For
   coasters/napkins, a "set of 4" consumes 4 pieces from the same pool a "set
   of 2"/"set of 6" also draws from — see gharEffectiveRemaining(). */
const GHAR_STOCK_GROUPS = {
  totebag: { ids: ['totebag-h-same', 'totebag-h-contrast', 'totebag-v-same', 'totebag-v-contrast'], limit: 20 },
  coasters: { ids: ['coaster-set2', 'coaster-set4'], limit: 10, weights: { 'coaster-set2': 2, 'coaster-set4': 4 } }
};
/* napkin-set4/set6 are comingSoon (batch too small) — napkin-set2 is the only
   sellable napkin id right now, so it doesn't need a shared-pool group, just
   a plain cap in GHAR_STATIC_STOCK below (12 pieces ÷ 2 per set = 6 sets). */

const GHAR_DESC_SHARED = [
  "The border is block printed separately and finished with contrasting piping — it strengthens every edge and gives the cover its clean, tailored line.",
  "The zip runs along the top edge, in plain sight rather than hidden on the back — never running end to end, so it stays strong for years and never works loose.",
  "This is a cover only — no cushion insert included. Slip in a thick insert for a full, plump look, or a thinner one for a relaxed, lived-in fold. We love it beside plain covers — but it's your home: play."
];

const GHAR_PRODUCTS = {
  marigold: {
    name: 'Marigold Garden Cushion Cover', price: 26.99, bulk: { extra: 24.00 },
    img: 'images/products/marigold/1.jpg', images: ['images/products/marigold/1.jpg','images/products/marigold/2.jpg','images/products/marigold/3.jpg','images/products/marigold/4.jpg','images/products/marigold/5.jpg','images/products/marigold/6.jpg','images/products/marigold/7.jpg','images/products/marigold/8.jpg','images/products/marigold/9.jpg'],
    size: '30 × 30 cm',
    material: 'Hand block printed · 100% pure cotton',
    category: 'cushion-small', printType: 'block', rooms: ['living'], favRank: 10,
    mini: "Rajasthani floral folk art, carved into teak and pressed by hand. No two cushions are ever identical.",
    desc: [
      "Drawn from Rajasthani floral folklore, this pattern took five hand-carved teak blocks to build — one for every colour. Each bloom is pressed by hand, so no two covers are ever identical. That is the point."
    ].concat(GHAR_DESC_SHARED)
  },
  rivervine: {
    name: 'River Vine Cushion Cover', price: 26.99, bulk: { extra: 24.00 },
    img: 'images/products/rivervine/3.jpg', images: ['images/products/rivervine/3.jpg','images/products/rivervine/1.jpg','images/products/rivervine/2.jpg'],
    videos: ['images/products/rivervine/video1.mp4','images/products/rivervine/video2.mp4','images/products/rivervine/video3.mp4'],
    size: '30 × 30 cm',
    material: 'Hand block printed · 100% pure cotton',
    category: 'cushion-small', printType: 'block', rooms: ['living'], favRank: 11,
    mini: "A winding vine in river blues, layered block by block.",
    desc: [
      "A winding vine in river blues, inspired by the leaf-and-water motifs of Indian block printing. Each colour comes from its own hand-carved teak block, pressed one over the other until the pattern flows."
    ].concat(GHAR_DESC_SHARED)
  },
  stone: {
    name: 'Stone Lattice Cushion Cover', price: 26.99, bulk: { extra: 24.00 },
    img: 'images/products/stone/14.jpg', images: ['images/products/stone/14.jpg','images/products/stone/6.jpg','images/products/stone/1.jpg','images/products/stone/2.jpg','images/products/stone/3.jpg','images/products/stone/4.jpg','images/products/stone/5.jpg','images/products/stone/7.jpg','images/products/stone/8.jpg','images/products/stone/9.jpg','images/products/stone/10.jpg','images/products/stone/11.jpg','images/products/stone/12.jpg','images/products/stone/13.jpg','images/products/stone/15.jpg','images/products/stone/16.jpg'],
    size: '30 × 30 cm',
    material: 'Hand block printed · 100% pure cotton · different print on front & back',
    category: 'cushion-small', printType: 'block', rooms: ['living'], favRank: 12,
    mini: "Two prints in one — a different pattern on front and back.",
    desc: [
      "One cover, two prints: a graphic lattice on the front and a companion print on the back — two full sets of carved blocks, printed separately and brought together in a single piece. Flip it whenever your room asks for a change."
    ].concat(GHAR_DESC_SHARED)
  },
  forest: {
    name: 'Forest Arabesque Cushion Cover', price: 26.99, bulk: { extra: 24.00 },
    img: 'images/products/forest/4.jpg', images: ['images/products/forest/4.jpg','images/products/forest/1.jpg','images/products/forest/2.jpg','images/products/forest/3.jpg','images/products/forest/5.jpg','images/products/forest/6.jpg','images/products/forest/7.jpg','images/products/forest/8.jpg'],
    size: '30 × 30 cm',
    material: 'Hand block printed · 100% pure cotton',
    category: 'cushion-small', printType: 'block', rooms: ['living'], favRank: 13,
    mini: "Deep greens and indigo in an Indo-Persian arabesque.",
    desc: [
      "Deep greens and indigo in an arabesque that echoes centuries of Indo-Persian pattern-making. Hand-carved blocks, layered colour by colour, on soft pure cotton."
    ].concat(GHAR_DESC_SHARED)
  },
  golden: {
    name: 'Golden Trellis Cushion Cover', price: 26.99, bulk: { extra: 24.00 },
    img: 'images/products/golden/5.jpg', images: ['images/products/golden/5.jpg','images/products/golden/1.jpg','images/products/golden/2.jpg','images/products/golden/3.jpg','images/products/golden/4.jpg','images/products/golden/6.jpg','images/products/golden/7.jpg','images/products/golden/8.jpg','images/products/golden/9.jpg','images/products/golden/10.jpg'],
    videos: ['images/products/golden/video1.mp4'],
    size: '30 × 30 cm',
    material: 'Hand block printed · 100% pure cotton',
    category: 'cushion-small', printType: 'block', rooms: ['living'], favRank: 14,
    mini: "Marigold-gold medallions on a trailing vine, with blue accents.",
    desc: [
      "Marigold-gold medallions trail along a hand-carved vine, with small blue blooms pressed in between. A softer, sunnier cousin to our floral prints — bordered in yellow for a finished, framed look."
    ].concat(GHAR_DESC_SHARED)
  },

  /* ── Ikat collection (added August 2026) — no photos yet, images: [] renders
     the dashed "photo coming soon" placeholder (see .photo-label in styles.css).
     Swap in real paths as soon as they exist; nothing else needs to change. ── */
  wallart: {
    name: 'Ikat Wall Art Square', price: 16.99,
    img: 'images/products/wallart/5.jpg', images: ['images/products/wallart/5.jpg','images/products/wallart/9.jpg','images/products/wallart/6.jpg','images/products/wallart/7.jpg','images/products/wallart/8.jpg','images/products/wallart/1.jpg','images/products/wallart/2.jpg','images/products/wallart/3.jpg','images/products/wallart/4.jpg'],
    size: '30 × 30 cm', material: 'Ikat woven cotton · framed',
    category: 'wall-art', printType: 'ikat', rooms: ['living'], favRank: 99, comingSoon: true,
    mini: "Ikat cotton, cut into perfect squares and framed — ready to hang.",
    desc: [
      "We kept noticing how beautiful these fabrics looked entirely on their own — no cushion, no cover, nothing added — so we cut them into perfect squares and started hanging them as art instead.",
      "Each square comes complete with a simple frame, ready to hang straight out of the box — no trip to a framing shop needed. All four edges of the fabric are hemmed flawlessly, so there is no raw edge hiding behind the glass.",
      "Ikat is the print we are starting with, chosen for the way its pattern seems to soften and blur at its own edges — a quality that comes from how ikat yarn is dyed before it is ever woven. Many more prints are on their way.",
      "A few of our own favourite ways to hang these are in the photos below."
    ]
  },
  largecushion: {
    name: 'Ikat Extra-Large Cushion Cover', price: 32.99, bulk: { extra: 28.00 },
    img: 'images/products/largecushion/1.jpg', images: ['images/products/largecushion/1.jpg','images/products/largecushion/2.jpg','images/products/largecushion/3.jpg','images/products/largecushion/4.jpg','images/products/largecushion/5.jpg','images/products/largecushion/6.jpg','images/products/largecushion/7.jpg','images/products/largecushion/8.jpg','images/products/largecushion/9.jpg'],
    videos: ['images/products/largecushion/video1.mp4'],
    size: '60 × 60 cm', material: 'Ikat woven cotton',
    category: 'cushion-large', printType: 'ikat', rooms: ['living'], favRank: 40,
    mini: "Our cushion covers, scaled all the way up. A very small batch — grab it before it's gone.",
    desc: [
      "We are excited to launch our extra-large cushion covers. Anyone who has tried to find a cover for a big cushion insert knows how hard that size is to track down; ours is cut and finished exactly for it.",
      "The zip runs precisely the length it needs to — no more, no less — and the edges are hemmed just as carefully as our smaller covers. Perfect for a living room that wants a little more presence, or a bed that wants a lot more colour.",
      "We are producing a very small batch in this size, so if it catches your eye, we would grab it now rather than later.",
      "The border is finished with a thin contrasting piping — a small, elegant detail that strengthens every edge and gives the cover its clean, tailored line.",
      "This is a cover only — no cushion insert included. Slip in a thick insert for a full, plump look, or a thinner one for a relaxed, lived-in fold. We love this Ikat cushion cover styled beside our colourful hand block printed small cushion covers — but it's your home, experiment and play with colours as you like."
    ]
  },
  runner: {
    name: 'Ikat Table Runner', price: 22.99,
    img: 'images/products/runner/5.jpg', images: ['images/products/runner/5.jpg','images/products/runner/1.jpg','images/products/runner/2.jpg','images/products/runner/3.jpg','images/products/runner/4.jpg'],
    size: '35 × 150 cm', material: 'Ikat woven · 100% organic cotton',
    category: 'table-runner', printType: 'ikat', rooms: ['living', 'dining'], favRank: 45,
    mini: "A dark red border gives this ikat runner one last, quiet highlight.",
    desc: [
      "A table runner is the fastest way to change a room without changing anything in it — lay it down the centre of the dining table for dinner, or across a console or sideboard in the living room, and the whole space shifts colour with it.",
      "At 35 × 150 cm, it is sized generously for the long tables we keep seeing in Dutch homes, with a dark red border that gives the ikat pattern one last, quiet highlight. The base is 100% organic cotton — easy to wash under cold water, and just as easy to live with."
    ]
  },
  rectmat: {
    name: 'Ikat Rectangle Table Mat', price: 15.99, bulk: { extra: 11.00 },
    cardZoom: 1, cardX: 50,
    img: 'images/products/rectmat/3.jpg', images: ['images/products/rectmat/3.jpg','images/products/rectmat/1.jpg','images/products/rectmat/2.jpg'],
    size: '32 × 45 cm', material: 'Ikat woven cotton',
    category: 'placemat', printType: 'ikat', rooms: ['dining'], favRank: 20,
    mini: "A well-dressed table starts here — hemmed in a soft contrast colour. Buy 2 or more and every extra mat is just €11.",
    desc: [
      "Whether you are protecting the table, dressing it up for guests, or simply keeping the wood beneath it safe, a good placemat does more work than it gets credit for. Ours are cut to sit beautifully under a full place setting, and we will admit it — we are a little obsessed with them ourselves.",
      "Each mat is finished with a hem in a soft contrast colour, giving it a clean, defined edge against any tablecloth or bare wood. Wash under cold water with a gentle detergent (or just cold water alone) and dry in the shade — no fuss, no fading.",
      "See a few of the ways we have used them in our own homes, below.",
      "The first mat is €15.99 — every mat after that is just €11.00 and nothing more."
    ]
  },
  circlemat: {
    name: 'Ikat Round Table Mat', price: 15.99, bulk: { extra: 11.00 },
    img: 'images/products/circlemat/1.jpg', images: ['images/products/circlemat/1.jpg','images/products/circlemat/2.jpg','images/products/circlemat/3.jpg','images/products/circlemat/4.jpg','images/products/circlemat/5.jpg','images/products/circlemat/6.jpg','images/products/circlemat/7.jpg','images/products/circlemat/8.jpg'],
    size: '30 cm diameter', material: 'Ikat woven cotton',
    category: 'placemat', printType: 'ikat', rooms: ['dining'], favRank: 21,
    mini: "A softer line for the table, in the same rich ikat red — elegant under any dinner plate. Buy 2 or more and every extra mat is just €11.",
    desc: [
      "A circle mat brings a softer line to the table, finished in our ikat red — it suits a round plate especially well, and gives just the right amount of contrast against plain white or stoneware: enough to notice, not enough to shout.",
      "Wash under cold water and dry in the shade, same as the rest of the collection — these are made to be used, not saved for best.",
      "The first mat is €15.99 — every mat after that is just €11.00 and nothing more."
    ]
  },
  'napkin-set2': {
    name: 'Ikat Napkins — Set of 2', price: 14.99, maxPerOrder: 1,
    cardZoom: 1, cardX: 50,
    img: 'images/products/napkin/6.jpg', images: ['images/products/napkin/6.jpg','images/products/napkin/1.jpg','images/products/napkin/2.jpg','images/products/napkin/3.jpg','images/products/napkin/4.jpg','images/products/napkin/5.jpg'],
    size: '30 × 30 cm · set of 2', material: 'Ikat woven · 100% organic cotton',
    category: 'napkin', printType: 'ikat', rooms: ['dining'], favRank: 1,
    mini: "A tiny first batch — just a handful of sets exist. One set per person, so more of you get to try them.",
    desc: [
      "This is a very small first batch of napkins — small enough that we're selling them as a Set of 2, one set per person, so as many of you as possible get to actually try them before we decide on the next batch.",
      "A good napkin does more than wipe a mouth — fold it under the cutlery to finish a place setting, let it sit loose and colourful across the table, or hand it to the smallest person at dinner. Being 100% organic cotton, it is soft enough that we reach for these with children too — gentle on the skin, and it only gets softer with washing.",
      "Finished at 30 × 30 cm — generous enough for a lap, easy enough to fold into a neat square.",
      "Bigger sets (4 and 6) come back once we've heard from enough of you and made a proper-sized batch — tell us what you think after you've used them."
    ]
  },
  'napkin-set4': {
    name: 'Ikat Napkins — Set of 4', price: 24.99, comingSoon: true,
    img: 'images/products/napkin/1.jpg', images: ['images/products/napkin/1.jpg','images/products/napkin/2.jpg','images/products/napkin/3.jpg','images/products/napkin/4.jpg','images/products/napkin/5.jpg'],
    size: '30 × 30 cm · set of 4', material: 'Ikat woven · 100% organic cotton',
    category: 'napkin', printType: 'ikat', rooms: ['dining'], favRank: 60,
    mini: "Soft enough for children, finished enough for guests. Sold as a set of 4 — works out to about €6.25 per napkin.",
    desc: [
      "A good napkin does more than wipe a mouth — fold it under the cutlery to finish a place setting, let it sit loose and colourful across the table, or hand it to the smallest person at dinner. Being 100% organic cotton, it is soft enough that we reach for these with children too — gentle on the skin, and it only gets softer with washing.",
      "Finished at 30 × 30 cm — generous enough for a lap, easy enough to fold into a neat square.",
      "Sold only as a set of 4 (about €6.25 per napkin) — if you need a bigger table setting, the Set of 6 works out a little cheaper per napkin."
    ]
  },
  'napkin-set6': {
    name: 'Ikat Napkins — Set of 6', price: 36.99, comingSoon: true,
    img: 'images/products/napkin/2.jpg', images: ['images/products/napkin/2.jpg','images/products/napkin/1.jpg','images/products/napkin/3.jpg','images/products/napkin/4.jpg','images/products/napkin/5.jpg'],
    size: '30 × 30 cm · set of 6', material: 'Ikat woven · 100% organic cotton',
    category: 'napkin', printType: 'ikat', rooms: ['dining'], favRank: 61,
    mini: "Soft enough for children, finished enough for guests. Sold as a set of 6 — about €6.17 per napkin, our best per-napkin price.",
    desc: [
      "A good napkin does more than wipe a mouth — fold it under the cutlery to finish a place setting, let it sit loose and colourful across the table, or hand it to the smallest person at dinner. Being 100% organic cotton, it is soft enough that we reach for these with children too — gentle on the skin, and it only gets softer with washing.",
      "Finished at 30 × 30 cm — generous enough for a lap, easy enough to fold into a neat square.",
      "Sold only as a set of 6 — at about €6.17 per napkin, this is the better-value option if your table sits more than four."
    ]
  },
  'coaster-set2': {
    name: 'Ikat Coasters — Set of 2', price: 9.99, notForSale: true, freeGift: true,
    img: 'images/products/coaster/3.jpg', images: ['images/products/coaster/3.jpg','images/products/coaster/1.jpg','images/products/coaster/2.jpg','images/products/coaster/4.jpg'],
    size: '10 × 10 cm · set of 2', material: 'Ikat woven · 100% organic cotton',
    category: 'coaster', printType: 'ikat', rooms: ['dining'], favRank: 15,
    mini: "Zero-waste squares, cut from our own fabric offcuts. Sold as a set of 2, about €5.00 each.",
    desc: [
      "Every coaster is cut from fabric offcuts that would otherwise end up as waste — so alongside your morning chai, you are also keeping good cloth out of a landfill. Zero waste, and quietly rather lovely under a cup.",
      "They sit well under a glass or your favourite ceramic mug, and being 100% organic cotton, they wash easily and dry fast.",
      "Sold only as a set of 2 (about €5.00 each) — need more on the table? The Set of 4 works out to about €3.50 a coaster."
    ]
  },
  'coaster-set4': {
    name: 'Ikat Coasters — Set of 4', price: 13.99, notForSale: true, freeGift: true,
    img: 'images/products/coaster/4.jpg', images: ['images/products/coaster/4.jpg','images/products/coaster/1.jpg','images/products/coaster/2.jpg','images/products/coaster/3.jpg'],
    size: '10 × 10 cm · set of 4', material: 'Ikat woven · 100% organic cotton',
    category: 'coaster', printType: 'ikat', rooms: ['dining'], favRank: 16,
    mini: "Zero-waste squares, cut from our own fabric offcuts. Sold as a set of 4, about €3.50 each — our best per-coaster price.",
    desc: [
      "Every coaster is cut from fabric offcuts that would otherwise end up as waste — so alongside your morning chai, you are also keeping good cloth out of a landfill. Zero waste, and quietly rather lovely under a cup.",
      "They sit well under a glass or your favourite ceramic mug, and being 100% organic cotton, they wash easily and dry fast.",
      "Sold only as a set of 4 — at about €3.50 each, that's €5.99 less than buying two Sets of 2."
    ]
  },

  /* Everyday Tote Bag — one product, 4 variants sharing GHAR_STOCK_GROUPS.totebag
     (a combined pool of 3, since that is the true physical stock — see cart.js
     top and CLAUDE.md). Each variant is still its own id so it behaves like any
     other product in the cart/checkout — the variant name alone is what tells
     Dimple which physical bag was ordered. */
  'totebag-h-same': {
    name: 'Everyday Tote Bag — Horizontal, Same-colour Strap', price: 24.99, wasPrice: 39.99, notForSale: true,
    img: 'images/products/totebag/15.jpg', demo: 'images/products/totebag/demo-embed.html',
    images: ['images/products/totebag/15.jpg','images/products/totebag/14.jpg','images/products/totebag/8.jpg','images/products/totebag/1.jpg','images/products/totebag/2.jpg','images/products/totebag/3.jpg','images/products/totebag/4.jpg','images/products/totebag/5.jpg','images/products/totebag/6.jpg','images/products/totebag/7.jpg','images/products/totebag/9.jpg','images/products/totebag/10.jpg','images/products/totebag/11.jpg','images/products/totebag/12.jpg','images/products/totebag/13.jpg'],
    videos: ['images/products/totebag/video1.mp4','images/products/totebag/video2.mp4'],
    size: '52 × 36 × 10 cm · 35 cm strap (same colour)', material: 'Ikat woven · 100% organic cotton',
    category: 'tote-bag', printType: 'ikat', rooms: [], favRank: 30,
    variantGroup: 'totebag', variantLabel: 'Horizontal · Same-colour strap', mini: "Our very first tote bag. A sturdier, better one is on its way.",
    desc: null // shared GHAR_TOTE_DESC below
  },
  'totebag-h-contrast': {
    name: 'Everyday Tote Bag — Horizontal, Contrast Strap (White)', price: 24.99, wasPrice: 39.99, notForSale: true,
    img: 'images/products/totebag/15.jpg', demo: 'images/products/totebag/demo-embed.html',
    images: ['images/products/totebag/15.jpg','images/products/totebag/14.jpg','images/products/totebag/8.jpg','images/products/totebag/1.jpg','images/products/totebag/2.jpg','images/products/totebag/3.jpg','images/products/totebag/4.jpg','images/products/totebag/5.jpg','images/products/totebag/6.jpg','images/products/totebag/7.jpg','images/products/totebag/9.jpg','images/products/totebag/10.jpg','images/products/totebag/11.jpg','images/products/totebag/12.jpg','images/products/totebag/13.jpg'],
    videos: ['images/products/totebag/video1.mp4','images/products/totebag/video2.mp4'],
    size: '52 × 36 × 10 cm · 35 cm white contrast strap', material: 'Ikat woven · 100% organic cotton',
    category: 'tote-bag', printType: 'ikat', rooms: [], favRank: 31,
    variantGroup: 'totebag', variantLabel: 'Horizontal · Contrast strap (white)', mini: "Our very first tote bag. A sturdier, better one is on its way.",
    desc: null
  },
  'totebag-v-same': {
    name: 'Everyday Tote Bag — Vertical, Same-colour Strap', price: 24.99, wasPrice: 39.99, notForSale: true,
    img: 'images/products/totebag/15.jpg', demo: 'images/products/totebag/demo-embed.html',
    images: ['images/products/totebag/15.jpg','images/products/totebag/14.jpg','images/products/totebag/8.jpg','images/products/totebag/1.jpg','images/products/totebag/2.jpg','images/products/totebag/3.jpg','images/products/totebag/4.jpg','images/products/totebag/5.jpg','images/products/totebag/6.jpg','images/products/totebag/7.jpg','images/products/totebag/9.jpg','images/products/totebag/10.jpg','images/products/totebag/11.jpg','images/products/totebag/12.jpg','images/products/totebag/13.jpg'],
    videos: ['images/products/totebag/video1.mp4','images/products/totebag/video2.mp4'],
    size: '40 × 42 × 10 cm · 35 cm strap (same colour)', material: 'Ikat woven · 100% organic cotton',
    category: 'tote-bag', printType: 'ikat', rooms: [], favRank: 32,
    variantGroup: 'totebag', variantLabel: 'Vertical · Same-colour strap', mini: "Our very first tote bag. A sturdier, better one is on its way.",
    desc: null
  },
  'totebag-v-contrast': {
    name: 'Everyday Tote Bag — Vertical, Contrast Strap (White)', price: 24.99, wasPrice: 39.99, notForSale: true,
    img: 'images/products/totebag/15.jpg', demo: 'images/products/totebag/demo-embed.html',
    images: ['images/products/totebag/15.jpg','images/products/totebag/14.jpg','images/products/totebag/8.jpg','images/products/totebag/1.jpg','images/products/totebag/2.jpg','images/products/totebag/3.jpg','images/products/totebag/4.jpg','images/products/totebag/5.jpg','images/products/totebag/6.jpg','images/products/totebag/7.jpg','images/products/totebag/9.jpg','images/products/totebag/10.jpg','images/products/totebag/11.jpg','images/products/totebag/12.jpg','images/products/totebag/13.jpg'],
    videos: ['images/products/totebag/video1.mp4','images/products/totebag/video2.mp4'],
    size: '40 × 42 × 10 cm · 35 cm white contrast strap', material: 'Ikat woven · 100% organic cotton',
    category: 'tote-bag', printType: 'ikat', rooms: [], favRank: 33,
    variantGroup: 'totebag', variantLabel: 'Vertical · Contrast strap (white)', mini: "Our very first tote bag. A sturdier, better one is on its way.",
    desc: null
  },
  /* ── New collections, Nov 2026 (photos from the 30 Oct shoot). collection: delftpur | gulabi | haldi | ikat | nostalgia.
     `made` = the "Made by hand" lines in the product pop-up. Coming-soon pieces show no price. ── */
  'delftpur-cushion': {
    name: 'Delftpur Cushion Cover', price: 30.00,
    cardZoom: 1.3, cardX: 49,
    img: 'images/products/delftpur-cushion/1.jpg', images: ['images/products/delftpur-cushion/1.jpg','images/products/delftpur-cushion/2.jpg','images/products/delftpur-cushion/3.jpg','images/products/delftpur-cushion/4.jpg','images/products/delftpur-cushion/5.jpg','images/products/delftpur-cushion/6.jpg','images/products/delftpur-cushion/7.jpg'],
    size: '50 × 50 cm', material: '100% pure cotton · hand block printed',
    category: 'cushion-large', printType: 'block', collection: 'delftpur', rooms: ['living'], favRank: 101,
    mini: "A generous 50 × 50 cm cover, printed by hand.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished cover.",
    desc: [
      "Blue triangles that sit somewhere between India's blue cities and the blue-and-white tiles of Delft: two homes, one colour.",
      "Sized for the big, soft cushions that make a sofa feel lived in. The print runs edge to edge, finished with a neat hem and a zip that keeps the cover easy to wash.",
      "This is a cover only: no cushion insert included. A full insert gives a plump look, a softer one a relaxed fold."
    ]
  },
  'gulabi-cushion': {
    name: 'Gulabi Cushion Cover', price: 30.00,
    cardZoom: 1.3, cardX: 51,
    img: 'images/products/gulabi-cushion/1.jpg', images: ['images/products/gulabi-cushion/1.jpg','images/products/gulabi-cushion/2.jpg','images/products/gulabi-cushion/3.jpg','images/products/gulabi-cushion/4.jpg','images/products/gulabi-cushion/5.jpg','images/products/gulabi-cushion/6.jpg','images/products/gulabi-cushion/7.jpg','images/products/gulabi-cushion/8.jpg','images/products/gulabi-cushion/9.jpg','images/products/gulabi-cushion/10.jpg'],
    size: '50 × 50 cm', material: '100% pure cotton · hand block printed',
    category: 'cushion-large', printType: 'block', collection: 'gulabi', rooms: ['living'], favRank: 102,
    mini: "A generous 50 × 50 cm cover, printed by hand.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished cover.",
    desc: [
      "A soft rose-and-leaf pattern printed by hand in peachy pinks and garden greens.",
      "Sized for the big, soft cushions that make a sofa feel lived in. The print runs edge to edge, finished with a neat hem and a zip that keeps the cover easy to wash.",
      "This is a cover only: no cushion insert included. A full insert gives a plump look, a softer one a relaxed fold."
    ]
  },
  'haldi-cushion': {
    name: 'Haldi Cushion Cover', price: 30.00,
    cardZoom: 1.3, cardX: 51,
    img: 'images/products/haldi-cushion/1.jpg', images: ['images/products/haldi-cushion/1.jpg','images/products/haldi-cushion/2.jpg','images/products/haldi-cushion/3.jpg','images/products/haldi-cushion/4.jpg','images/products/haldi-cushion/5.jpg','images/products/haldi-cushion/6.jpg'],
    videos: ['images/products/haldi-cushion/video1.mp4','images/products/nostalgia-chameli-ivory/video1.mp4'],
    size: '50 × 50 cm', material: '100% pure cotton · hand block printed',
    category: 'cushion-large', printType: 'block', collection: 'haldi', rooms: ['living'], favRank: 103,
    mini: "A generous 50 × 50 cm cover, printed by hand.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished cover.",
    desc: [
      "A pink trellis scattered with orange rosebuds, finished with a warm turmeric-yellow edge.",
      "Sized for the big, soft cushions that make a sofa feel lived in. The print runs edge to edge, finished with a neat hem and a zip that keeps the cover easy to wash.",
      "This is a cover only: no cushion insert included. A full insert gives a plump look, a softer one a relaxed fold."
    ]
  },
  'nostalgia-rani': {
    name: 'Nostalgia Cushion Cover · Rani', price: 20.00,
    cardZoom: 1.3, cardX: 52,
    img: 'images/products/nostalgia-rani/1.jpg', images: ['images/products/nostalgia-rani/1.jpg','images/products/nostalgia-rani/2.jpg','images/products/nostalgia-rani/3.jpg','images/products/nostalgia-rani/4.jpg','images/products/nostalgia-rani/5.jpg','images/products/nostalgia-rani/6.jpg','images/products/nostalgia-rani/7.jpg','images/products/nostalgia-rani/8.jpg','images/products/nostalgia-rani/9.jpg','images/products/nostalgia-rani/10.jpg'],
    videos: ['images/products/nostalgia-rani/video1.mp4'],
    size: '45 × 45 cm', material: '100% pure cotton · hand block printed',
    category: 'cushion-large', printType: 'block', collection: 'nostalgia', rooms: ['living'], favRank: 104,
    mini: "Deep red flowers inside a printed border. Only 10 exist.",
    made: "Hand block printed in India by a small artisan-run workshop, from their own designs. We chose it, we did not design it: it simply felt like home.",
    desc: [
      "Part of Nostalgia, a collection of what home felt like: prints we did not design, chosen from artisan entrepreneurs because they remind us of the homes we grew up in.",
      "Rani is all reds and pinks, a bold flower print framed by a border. Only 10 of these covers exist.",
      "Sized for the big, soft cushions that make a sofa feel lived in. The print runs edge to edge, finished with a neat hem and a zip that keeps the cover easy to wash.",
      "This is a cover only: no cushion insert included. A full insert gives a plump look, a softer one a relaxed fold."
    ]
  },
  'nostalgia-chameli-pink': {
    name: 'Nostalgia Cushion Cover · Chameli Pink', price: 20.00,
    cardZoom: 1.3, cardX: 50,
    img: 'images/products/nostalgia-chameli-pink/1.jpg', images: ['images/products/nostalgia-chameli-pink/1.jpg','images/products/nostalgia-chameli-pink/2.jpg','images/products/nostalgia-chameli-pink/3.jpg','images/products/nostalgia-chameli-pink/4.jpg','images/products/nostalgia-chameli-pink/5.jpg'],
    size: '45 × 45 cm', material: '100% pure cotton · hand block printed',
    category: 'cushion-large', printType: 'block', collection: 'nostalgia', rooms: ['living'], favRank: 105,
    mini: "Dark climbing vines on a rosy pink ground. Only 10 exist.",
    made: "Hand block printed in India by a small artisan-run workshop, from their own designs. We chose it, we did not design it: it simply felt like home.",
    desc: [
      "Part of Nostalgia, a collection of what home felt like: prints we did not design, chosen from artisan entrepreneurs because they remind us of the homes we grew up in.",
      "Chameli is named after jasmine: dark vines and bright flowers climbing over a rosy pink ground, with a printed border. Only 10 of these covers exist.",
      "Sized for the big, soft cushions that make a sofa feel lived in. The print runs edge to edge, finished with a neat hem and a zip that keeps the cover easy to wash.",
      "This is a cover only: no cushion insert included. A full insert gives a plump look, a softer one a relaxed fold."
    ]
  },
  'nostalgia-chameli-ivory': {
    name: 'Nostalgia Cushion Cover · Chameli Ivory', price: 20.00,
    cardZoom: 1.3, cardX: 43,
    img: 'images/products/nostalgia-chameli-ivory/1.jpg', images: ['images/products/nostalgia-chameli-ivory/1.jpg','images/products/nostalgia-chameli-ivory/2.jpg','images/products/nostalgia-chameli-ivory/3.jpg','images/products/nostalgia-chameli-ivory/4.jpg','images/products/nostalgia-chameli-ivory/5.jpg','images/products/nostalgia-chameli-ivory/6.jpg'],
    videos: ['images/products/nostalgia-chameli-ivory/video1.mp4'],
    size: '45 × 45 cm', material: '100% pure cotton · hand block printed',
    category: 'cushion-large', printType: 'block', collection: 'nostalgia', rooms: ['living'], favRank: 106,
    mini: "The same climbing vines on ivory, with a sunny yellow border. Only 10 exist.",
    made: "Hand block printed in India by a small artisan-run workshop, from their own designs. We chose it, we did not design it: it simply felt like home.",
    desc: [
      "Part of Nostalgia, a collection of what home felt like: prints we did not design, chosen from artisan entrepreneurs because they remind us of the homes we grew up in.",
      "The Chameli print again, this time on ivory with a sunny yellow border. Only 10 of these covers exist.",
      "Sized for the big, soft cushions that make a sofa feel lived in. The print runs edge to edge, finished with a neat hem and a zip that keeps the cover easy to wash.",
      "This is a cover only: no cushion insert included. A full insert gives a plump look, a softer one a relaxed fold."
    ]
  },
  'gulabi-runner': {
    name: 'Gulabi Table Runner', price: 26.99,
    cardZoom: 1, cardX: 50,
    img: 'images/products/gulabi-runner/1.jpg', images: ['images/products/gulabi-runner/1.jpg','images/products/gulabi-runner/2.jpg','images/products/gulabi-runner/3.jpg','images/products/gulabi-runner/4.jpg','images/products/gulabi-runner/5.jpg','images/products/gulabi-runner/6.jpg','images/products/gulabi-runner/7.jpg','images/products/gulabi-runner/8.jpg','images/products/gulabi-runner/9.jpg','images/products/gulabi-runner/10.jpg'],
    size: '32 × 150 cm', material: '100% pure cotton · hand block printed',
    category: 'table-runner', printType: 'block', collection: 'gulabi', rooms: ['living','dining'], favRank: 107,
    mini: "Down the middle of the table, and the whole room changes colour.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 5 days from plain cotton to finished runner.",
    desc: [
      "A soft rose-and-leaf pattern printed by hand in peachy pinks and garden greens.",
      "Lay it along a dining table for dinner, or across a sideboard in the living room. At 32 × 150 cm it suits the long tables in so many Dutch homes.",
      "Wash under cold water and dry in the shade; it softens beautifully with use."
    ]
  },
  'haldi-runner': {
    name: 'Haldi Table Runner', price: 26.99,
    cardZoom: 1, cardX: 50,
    img: 'images/products/haldi-runner/1.jpg', images: ['images/products/haldi-runner/1.jpg','images/products/haldi-runner/2.jpg','images/products/haldi-runner/3.jpg','images/products/haldi-runner/4.jpg','images/products/haldi-runner/5.jpg','images/products/haldi-runner/6.jpg','images/products/haldi-runner/7.jpg','images/products/haldi-runner/8.jpg'],
    size: '32 × 150 cm', material: '100% pure cotton · hand block printed',
    category: 'table-runner', printType: 'block', collection: 'haldi', rooms: ['living','dining'], favRank: 108,
    mini: "Down the middle of the table, and the whole room changes colour.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 5 days from plain cotton to finished runner.",
    desc: [
      "A pink trellis scattered with orange rosebuds, finished with a warm turmeric-yellow edge.",
      "Lay it along a dining table for dinner, or across a sideboard in the living room. At 32 × 150 cm it suits the long tables in so many Dutch homes.",
      "Wash under cold water and dry in the shade; it softens beautifully with use."
    ]
  },
  'delftpur-roundmat': {
    name: 'Delftpur Round Table Mat', price: 14.99, bulk: { extra: 11.99 },
    cardZoom: 1.3, cardX: 54,
    img: 'images/products/delftpur-roundmat/1.jpg', images: ['images/products/delftpur-roundmat/1.jpg','images/products/delftpur-roundmat/2.jpg','images/products/delftpur-roundmat/3.jpg','images/products/delftpur-roundmat/4.jpg','images/products/delftpur-roundmat/5.jpg'],
    size: '30 cm diameter', material: '100% pure cotton · hand block printed',
    category: 'placemat', printType: 'block', collection: 'delftpur', rooms: ['dining'], favRank: 109,
    mini: "A round mat for a round plate. Every extra mat is €11.99.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished mat.",
    desc: [
      "Blue triangles that sit somewhere between India's blue cities and the blue-and-white tiles of Delft: two homes, one colour.",
      "Cut round and finished with a contrast edge, it sits under a full place setting and protects the table beneath.",
      "The first mat is €14.99, and every mat after that is €11.99."
    ]
  },
  'gulabi-roundmat': {
    name: 'Gulabi Round Table Mat', price: 14.99, bulk: { extra: 11.99 },
    cardZoom: 1.3, cardX: 50,
    img: 'images/products/gulabi-roundmat/1.jpg', images: ['images/products/gulabi-roundmat/1.jpg','images/products/gulabi-roundmat/2.jpg','images/products/gulabi-roundmat/3.jpg','images/products/gulabi-roundmat/4.jpg'],
    size: '30 cm diameter', material: '100% pure cotton · hand block printed',
    category: 'placemat', printType: 'block', collection: 'gulabi', rooms: ['dining'], favRank: 110,
    mini: "A round mat for a round plate. Every extra mat is €11.99.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished mat.",
    desc: [
      "A soft rose-and-leaf pattern printed by hand in peachy pinks and garden greens.",
      "Cut round and finished with a contrast edge, it sits under a full place setting and protects the table beneath.",
      "The first mat is €14.99, and every mat after that is €11.99."
    ]
  },
  'haldi-roundmat': {
    name: 'Haldi Round Table Mat', price: 14.99, bulk: { extra: 11.99 },
    cardZoom: 1.3, cardX: 49,
    img: 'images/products/haldi-roundmat/1.jpg', images: ['images/products/haldi-roundmat/1.jpg','images/products/haldi-roundmat/2.jpg','images/products/haldi-roundmat/3.jpg','images/products/haldi-roundmat/4.jpg','images/products/haldi-roundmat/5.jpg','images/products/haldi-roundmat/6.jpg'],
    size: '30 cm diameter', material: '100% pure cotton · hand block printed',
    category: 'placemat', printType: 'block', collection: 'haldi', rooms: ['dining'], favRank: 111,
    mini: "A round mat for a round plate. Every extra mat is €11.99.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished mat.",
    desc: [
      "A pink trellis scattered with orange rosebuds, finished with a warm turmeric-yellow edge.",
      "Cut round and finished with a contrast edge, it sits under a full place setting and protects the table beneath.",
      "The first mat is €14.99, and every mat after that is €11.99."
    ]
  },
  'delftpur-rectmat': {
    name: 'Delftpur Rectangle Table Mat', price: 14.99, bulk: { extra: 11.99 },
    cardZoom: 1.3, cardX: 51,
    img: 'images/products/delftpur-rectmat/5.jpg', images: ['images/products/delftpur-rectmat/5.jpg','images/products/delftpur-rectmat/1.jpg','images/products/delftpur-rectmat/2.jpg','images/products/delftpur-rectmat/3.jpg','images/products/delftpur-rectmat/4.jpg','images/products/delftpur-rectmat/6.jpg','images/products/delftpur-rectmat/7.jpg','images/products/delftpur-rectmat/8.jpg','images/products/delftpur-rectmat/9.jpg','images/products/delftpur-rectmat/10.jpg'],
    size: '32 × 45 cm', material: '100% pure cotton · hand block printed',
    category: 'placemat', printType: 'block', collection: 'delftpur', rooms: ['dining'], favRank: 112,
    mini: "Dress the table, protect the wood. Every extra mat is €11.99.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished mat.",
    desc: [
      "Blue triangles that sit somewhere between India's blue cities and the blue-and-white tiles of Delft: two homes, one colour.",
      "Sized to sit under a full place setting, with a contrast hem that gives each mat a clean edge on bare wood or a tablecloth.",
      "The first mat is €14.99, and every mat after that is €11.99."
    ]
  },
  'gulabi-rectmat': {
    name: 'Gulabi Rectangle Table Mat', price: 14.99, bulk: { extra: 11.99 },
    cardZoom: 1.3, cardX: 46,
    img: 'images/products/gulabi-rectmat/5.jpg', images: ['images/products/gulabi-rectmat/5.jpg','images/products/gulabi-rectmat/1.jpg','images/products/gulabi-rectmat/2.jpg','images/products/gulabi-rectmat/3.jpg','images/products/gulabi-rectmat/4.jpg','images/products/gulabi-rectmat/6.jpg','images/products/gulabi-rectmat/7.jpg','images/products/gulabi-rectmat/8.jpg','images/products/gulabi-rectmat/9.jpg','images/products/gulabi-rectmat/10.jpg'],
    size: '32 × 45 cm', material: '100% pure cotton · hand block printed',
    category: 'placemat', printType: 'block', collection: 'gulabi', rooms: ['dining'], favRank: 113,
    mini: "Dress the table, protect the wood. Every extra mat is €11.99.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished mat.",
    desc: [
      "A soft rose-and-leaf pattern printed by hand in peachy pinks and garden greens.",
      "Sized to sit under a full place setting, with a contrast hem that gives each mat a clean edge on bare wood or a tablecloth.",
      "The first mat is €14.99, and every mat after that is €11.99."
    ]
  },
  'gulabi-napkin': {
    name: 'Gulabi Napkins, Set of 2', price: 12.99,
    cardZoom: 1.2, cardX: 50,
    img: 'images/products/gulabi-napkin/2.jpg', images: ['images/products/gulabi-napkin/2.jpg','images/products/gulabi-napkin/1.jpg','images/products/gulabi-napkin/3.jpg','images/products/gulabi-napkin/4.jpg','images/products/gulabi-napkin/5.jpg','images/products/gulabi-napkin/6.jpg','images/products/gulabi-napkin/7.jpg','images/products/gulabi-napkin/8.jpg','images/products/gulabi-napkin/9.jpg'],
    size: '30 × 30 cm each', material: '100% pure cotton · hand block printed',
    category: 'napkin', printType: 'block', collection: 'gulabi', rooms: ['dining'], favRank: 114,
    mini: "Two napkins for the table, printed by hand.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 3 days from plain cotton to finished napkins.",
    desc: [
      "A soft rose-and-leaf pattern printed by hand in peachy pinks and garden greens.",
      "Two 30 × 30 cm napkins, soft enough for every day and pretty enough for guests.",
      "Wash under cold water and dry in the shade; the colours stay bright and the cotton gets softer."
    ]
  },
  'gulabi-coaster': {
    name: 'Gulabi Coasters, Set of 4', price: 15.99, notForSale: true, freeGift: true,
    img: 'images/products/gulabi-coaster/1.jpg', images: ['images/products/gulabi-coaster/1.jpg','images/products/gulabi-coaster/2.jpg','images/products/gulabi-coaster/3.jpg','images/products/gulabi-coaster/4.jpg','images/products/gulabi-coaster/5.jpg'],
    size: '10 × 10 cm each', material: '100% pure cotton · hand block printed',
    category: 'coaster', printType: 'block', collection: 'gulabi', rooms: ['dining','living'], favRank: 115,
    mini: "Four little squares for cups, mugs and glasses.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 2 days from plain cotton to finished coasters.",
    desc: [
      "A soft rose-and-leaf pattern printed by hand in peachy pinks and garden greens.",
      "A set of four 10 × 10 cm coasters, layered cotton so they soak up the drip from a cold glass or a hot cup of chai."
    ]
  },
  'gulabi-pouch': {
    name: 'Gulabi Everyday Pouch', price: 20.00,
    img: 'images/products/gulabi-pouch/1.jpg', images: ['images/products/gulabi-pouch/1.jpg','images/products/gulabi-pouch/11.jpg','images/products/gulabi-pouch/2.jpg','images/products/gulabi-pouch/3.jpg','images/products/gulabi-pouch/4.jpg','images/products/gulabi-pouch/5.jpg','images/products/gulabi-pouch/6.jpg','images/products/gulabi-pouch/7.jpg','images/products/gulabi-pouch/8.jpg','images/products/gulabi-pouch/9.jpg','images/products/gulabi-pouch/10.jpg'],
    size: '28 × 16 × 12 cm', material: 'Quilted 100% pure cotton · hand block printed',
    category: 'pouch', printType: 'block', collection: 'gulabi', rooms: [], favRank: 116,
    mini: "A quilted zip pouch for make-up, pens, chargers: everything that rattles in your bag.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About a week from plain cotton to finished pouch, as the quilting takes time.",
    desc: [
      "A soft rose-and-leaf pattern printed by hand in peachy pinks and garden greens.",
      "Quilted, lined and zipped, with room for make-up, a toothbrush and a charger, or pens and notebooks for the desk.",
      "It stands up on its own and opens wide, so you can see what is inside."
    ]
  },
  'delftpur-pouch': {
    name: 'Delftpur Everyday Pouch', price: 20.00,
    img: 'images/products/delftpur-pouch/3.jpg', images: ['images/products/delftpur-pouch/3.jpg','images/products/delftpur-pouch/4.jpg','images/products/delftpur-pouch/1.jpg','images/products/delftpur-pouch/2.jpg'],
    size: '28 × 16 × 12 cm', material: 'Quilted 100% pure cotton · hand block printed',
    category: 'pouch', printType: 'block', collection: 'delftpur', rooms: [], favRank: 117,
    mini: "A quilted zip pouch for make-up, pens, chargers: everything that rattles in your bag.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About a week from plain cotton to finished pouch, as the quilting takes time.",
    desc: [
      "Blue triangles that sit somewhere between India's blue cities and the blue-and-white tiles of Delft: two homes, one colour.",
      "Quilted, lined and zipped, with room for make-up, a toothbrush and a charger, or pens and notebooks for the desk.",
      "It stands up on its own and opens wide, so you can see what is inside."
    ]
  },
  'delftpur-apron': {
    name: 'Delftpur Kitchen Apron', price: 54.99,
    img: 'images/products/delftpur-apron/1.jpg', images: ['images/products/delftpur-apron/1.jpg','images/products/delftpur-apron/10.jpg','images/products/delftpur-apron/2.jpg','images/products/delftpur-apron/3.jpg','images/products/delftpur-apron/4.jpg','images/products/delftpur-apron/5.jpg','images/products/delftpur-apron/6.jpg','images/products/delftpur-apron/7.jpg','images/products/delftpur-apron/8.jpg','images/products/delftpur-apron/9.jpg'],
    size: 'One size, adjustable ties', material: '100% pure cotton',
    category: 'apron', printType: 'block', collection: 'delftpur', rooms: ['kitchen'], favRank: 118,
    mini: "Made for flour-dusted hands and long Sunday cooking.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About a week from plain cotton to finished apron.",
    desc: [
      "Blue triangles that sit somewhere between India's blue cities and the blue-and-white tiles of Delft: two homes, one colour.",
      "A full apron with long ties and a big front pocket, made for real cooking and baking.",
      "Wash it as often as you need: the cotton only gets softer."
    ]
  },
  'ikat-apron': {
    name: 'Ikat Kitchen Apron · Lal', price: 54.99,
    img: 'images/products/ikat-apron/1.jpg', images: ['images/products/ikat-apron/1.jpg','images/products/ikat-apron/4.jpg','images/products/ikat-apron/2.jpg','images/products/ikat-apron/3.jpg'],
    size: 'One size, adjustable ties', material: 'Handwoven ikat · 100% pure cotton',
    category: 'apron', printType: 'ikat', collection: 'ikat', rooms: ['kitchen'], favRank: 119,
    mini: "Handwoven ikat in chilli red, with a big front pocket.",
    made: "Handwoven ikat from India: the threads are tied and dyed before weaving, so the pattern appears as the cloth is woven. Weeks of work from thread to fabric, then cut and stitched by hand.",
    desc: [
      "Handwoven ikat in a deep chilli red.",
      "A full apron with long ties and a big front pocket, made for real cooking and baking.",
      "Wash it as often as you need: the cotton only gets softer."
    ]
  },
  'delftpur-runner': {
    name: 'Delftpur Table Runner', price: 26.99, comingSoon: true,
    img: '', images: [],
    size: '32 × 150 cm', material: '100% pure cotton · hand block printed',
    category: 'table-runner', printType: 'block', collection: 'delftpur', rooms: ['living','dining'], favRank: 120,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 5 days from plain cotton to finished runner.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "Blue triangles that sit somewhere between India's blue cities and the blue-and-white tiles of Delft: two homes, one colour.",
      "Lay it along a dining table for dinner, or across a sideboard in the living room. At 32 × 150 cm it suits the long tables in so many Dutch homes.",
      "Wash under cold water and dry in the shade; it softens beautifully with use."
    ]
  },
  'delftpur-napkin': {
    name: 'Delftpur Napkins, Set of 2', price: 12.99, comingSoon: true,
    img: '', images: [],
    size: '30 × 30 cm each', material: '100% pure cotton · hand block printed',
    category: 'napkin', printType: 'block', collection: 'delftpur', rooms: ['dining'], favRank: 121,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 3 days from plain cotton to finished napkins.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "Blue triangles that sit somewhere between India's blue cities and the blue-and-white tiles of Delft: two homes, one colour.",
      "Two 30 × 30 cm napkins, soft enough for every day and pretty enough for guests.",
      "Wash under cold water and dry in the shade; the colours stay bright and the cotton gets softer."
    ]
  },
  'delftpur-coaster': {
    name: 'Delftpur Coasters, Set of 4', price: 15.99, notForSale: true, freeGift: true, comingSoon: true,
    img: '', images: [],
    size: '10 × 10 cm each', material: '100% pure cotton · hand block printed',
    category: 'coaster', printType: 'block', collection: 'delftpur', rooms: ['dining','living'], favRank: 122,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 2 days from plain cotton to finished coasters.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "Blue triangles that sit somewhere between India's blue cities and the blue-and-white tiles of Delft: two homes, one colour.",
      "A set of four 10 × 10 cm coasters, layered cotton so they soak up the drip from a cold glass or a hot cup of chai."
    ]
  },
  'haldi-rectmat': {
    name: 'Haldi Rectangle Table Mat', price: 14.99, comingSoon: true,
    img: '', images: [],
    size: '32 × 45 cm', material: '100% pure cotton · hand block printed',
    category: 'placemat', printType: 'block', collection: 'haldi', rooms: ['dining'], favRank: 123,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished mat.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "A pink trellis scattered with orange rosebuds, finished with a warm turmeric-yellow edge.",
      "Sized to sit under a full place setting, with a contrast hem that gives each mat a clean edge on bare wood or a tablecloth.",
      "The first mat is €14.99, and every mat after that is €11.99."
    ]
  },
  'haldi-coaster': {
    name: 'Haldi Coasters, Set of 4', price: 15.99, notForSale: true, freeGift: true, comingSoon: true,
    img: '', images: [],
    size: '10 × 10 cm each', material: '100% pure cotton · hand block printed',
    category: 'coaster', printType: 'block', collection: 'haldi', rooms: ['dining','living'], favRank: 124,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 2 days from plain cotton to finished coasters.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "A pink trellis scattered with orange rosebuds, finished with a warm turmeric-yellow edge.",
      "A set of four 10 × 10 cm coasters, layered cotton so they soak up the drip from a cold glass or a hot cup of chai."
    ]
  },
  'haldi-pouch': {
    name: 'Haldi Everyday Pouch', price: 20.00, comingSoon: true,
    img: '', images: [],
    size: '28 × 16 × 12 cm', material: 'Quilted 100% pure cotton · hand block printed',
    category: 'pouch', printType: 'block', collection: 'haldi', rooms: [], favRank: 125,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About a week from plain cotton to finished pouch, as the quilting takes time.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "A pink trellis scattered with orange rosebuds, finished with a warm turmeric-yellow edge.",
      "Quilted, lined and zipped, with room for make-up, a toothbrush and a charger, or pens and notebooks for the desk.",
      "It stands up on its own and opens wide, so you can see what is inside."
    ]
  },
  'haldi-napkin': {
    name: 'Haldi Napkins, Set of 2', price: 12.99, comingSoon: true,
    img: '', images: [],
    size: '30 × 30 cm each', material: '100% pure cotton · hand block printed',
    category: 'napkin', printType: 'block', collection: 'haldi', rooms: ['dining'], favRank: 126,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 3 days from plain cotton to finished napkins.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "A pink trellis scattered with orange rosebuds, finished with a warm turmeric-yellow edge.",
      "Two 30 × 30 cm napkins, soft enough for every day and pretty enough for guests.",
      "Wash under cold water and dry in the shade; the colours stay bright and the cotton gets softer."
    ]
  },
  'delftpur-bottle': {
    name: 'Delftpur Bottle Holder', price: 19.99, comingSoon: true,
    img: '', images: [],
    size: '30 × 11 × 11 cm', material: '100% pure cotton · hand block printed',
    category: 'bottle', printType: 'block', collection: 'delftpur', rooms: ['kitchen','dining'], favRank: 127,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished holder.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "Blue triangles that sit somewhere between India's blue cities and the blue-and-white tiles of Delft: two homes, one colour.",
      "Slip in a bottle of wine or olive oil and it becomes a gift, no wrapping needed."
    ]
  },
  'gulabi-bottle': {
    name: 'Gulabi Bottle Holder', price: 19.99, comingSoon: true,
    img: '', images: [],
    size: '30 × 11 × 11 cm', material: '100% pure cotton · hand block printed',
    category: 'bottle', printType: 'block', collection: 'gulabi', rooms: ['kitchen','dining'], favRank: 128,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished holder.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "A soft rose-and-leaf pattern printed by hand in peachy pinks and garden greens.",
      "Slip in a bottle of wine or olive oil and it becomes a gift, no wrapping needed."
    ]
  },
  'haldi-bottle': {
    name: 'Haldi Bottle Holder', price: 19.99, comingSoon: true,
    img: '', images: [],
    size: '30 × 11 × 11 cm', material: '100% pure cotton · hand block printed',
    category: 'bottle', printType: 'block', collection: 'haldi', rooms: ['kitchen','dining'], favRank: 129,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India, one block and one colour at a time. Around five pairs of hands shape it: the block carver, the printer, the dyer who washes and sets the colour, the tailor who stitches it, and the person who checks and folds it. About 4 days from plain cotton to finished holder.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "A pink trellis scattered with orange rosebuds, finished with a warm turmeric-yellow edge.",
      "Slip in a bottle of wine or olive oil and it becomes a gift, no wrapping needed."
    ]
  },
  'nostalgia-tablecover-grey': {
    name: 'Nostalgia Table Cover · Monsoon Grey', price: 79.99, comingSoon: true,
    img: '', images: [],
    size: '150 × 230 cm', material: '100% pure cotton · hand block printed',
    category: 'tablecloth', printType: 'block', collection: 'nostalgia', rooms: ['dining'], favRank: 130,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India by a small artisan-run workshop, from their own designs. We chose it, we did not design it: it simply felt like home.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "Part of Nostalgia, a collection of what home felt like: prints we did not design, chosen from artisan entrepreneurs because they remind us of the homes we grew up in.",
      "Big enough for a six-seater table: a whole family, or a long dinner with friends."
    ]
  },
  'nostalgia-tablecover-yellow': {
    name: 'Nostalgia Table Cover · Sunlit Yellow', price: 79.99, comingSoon: true,
    img: '', images: [],
    size: '150 × 230 cm', material: '100% pure cotton · hand block printed',
    category: 'tablecloth', printType: 'block', collection: 'nostalgia', rooms: ['dining'], favRank: 131,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India by a small artisan-run workshop, from their own designs. We chose it, we did not design it: it simply felt like home.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "Part of Nostalgia, a collection of what home felt like: prints we did not design, chosen from artisan entrepreneurs because they remind us of the homes we grew up in.",
      "Big enough for a six-seater table: a whole family, or a long dinner with friends."
    ]
  },
  'nostalgia-tablecover-tulip': {
    name: 'Nostalgia Table Cover · Tulip', price: 79.99, comingSoon: true,
    img: '', images: [],
    size: '150 × 230 cm', material: '100% pure cotton · hand block printed',
    category: 'tablecloth', printType: 'block', collection: 'nostalgia', rooms: ['dining'], favRank: 132,
    mini: "Small quantities are being made by hand right now. Photos and price follow very soon.",
    made: "Hand block printed in India by a small artisan-run workshop, from their own designs. We chose it, we did not design it: it simply felt like home.",
    desc: [
      "Small quantities are being made by hand right now. Photos and price follow very soon.",
      "Part of Nostalgia, a collection of what home felt like: prints we did not design, chosen from artisan entrepreneurs because they remind us of the homes we grew up in.",
      "Big enough for a six-seater table: a whole family, or a long dinner with friends."
    ]
  }
};

/* Shared description for every Everyday Tote Bag variant (assigned after the
   object literal since it needs to reference itself — keeps the four entries
   above from repeating this in full). "Ghar" is Hindi for "home". */
const GHAR_TOTE_DESC = [
  "This is the very first tote bag we ever made, and we are proud of it.",
  "Along the way we realised it needs some improvements, so we are working on them. Very soon we will bring you a better tote: more comprehensive, sturdier, and one you will truly love to carry every day.",
  "It is inspired by this first design, with many, many improvements."
];
GHAR_STOCK_GROUPS.totebag.ids.forEach(function (id) { GHAR_PRODUCTS[id].desc = GHAR_TOTE_DESC; });

/* ── money formatting ── */
function gharFmt(n) { return '€' + (Math.round(n * 100) / 100).toFixed(2); }
/* For a product on a temporary discount (p.wasPrice set), shows the old price
   struck through before the current one. `prefix` is e.g. "From " for the
   tote bag's variant-picker card. */
function gharPriceHtml(p, prefix) {
  const cur = (prefix || '') + gharFmt(p.price);
  return p.wasPrice ? '<span class="price-was">' + gharFmt(p.wasPrice) + '</span> ' + cur : cur;
}

/* ── bulk (quantity) pricing ──
   A product can set `bulk: { extra: N }` — the first unit costs the normal
   `price`, and every unit after that costs a flat `extra` instead (a simple
   automatic discount for buying more than one, e.g. the Ikat table mats).
   Always compute cart/line totals through this — never `price * qty` directly. */
function gharLineTotal(id, qty) {
  const p = GHAR_PRODUCTS[id];
  if (!p) return 0;
  if (p.bulk && qty > 0) return p.price + p.bulk.extra * (qty - 1);
  return p.price * qty;
}
function gharUnitNote(id) {
  const p = GHAR_PRODUCTS[id];
  return (p && p.bulk) ? gharFmt(p.price) + ' first, ' + gharFmt(p.bulk.extra) + ' each extra' : null;
}
function gharBulkNote(id) {
  const p = GHAR_PRODUCTS[id];
  return (p && p.bulk) ? 'Buy more, save more — just ' + gharFmt(p.bulk.extra) + ' each after the first' : null;
}

/* ── cart storage ── */
function gharCart() {
  let c;
  try { c = JSON.parse(localStorage.getItem('gharCart')) || {}; }
  catch (e) { return {}; }
  Object.keys(c).forEach(function (id) {
    if (GHAR_PRODUCTS[id] && GHAR_PRODUCTS[id].notForSale) delete c[id];
  });
  return c;
}
function gharSaveCart(cart) {
  for (const id of Object.keys(cart)) {
    if (!GHAR_PRODUCTS[id] || cart[id] < 1) delete cart[id];
  }
  localStorage.setItem('gharCart', JSON.stringify(cart));
  gharUpdateBadge();
}
function gharCartCount() {
  return Object.values(gharCart()).reduce(function (a, b) { return a + b; }, 0);
}
function gharCartTotal() {
  const cart = gharCart();
  return Object.keys(cart).reduce(function (sum, id) {
    return sum + gharLineTotal(id, cart[id]);
  }, 0);
}
function gharSetQty(id, qty) {
  const cart = gharCart();
  const others = gharCartCount() - (cart[id] || 0);
  if (qty > 0 && others + qty > GHAR_MAX_PER_ORDER) qty = Math.max(0, GHAR_MAX_PER_ORDER - others);
  cart[id] = qty;
  gharSaveCart(cart);
}
function gharClearCart() {
  localStorage.removeItem('gharCart');
  gharUpdateBadge();
}

/* ── pricing (shipping + discount) ── */
function gharPromoStored() { return localStorage.getItem('gharPromo') === GHAR_PROMO_CODE; }
function gharTotals(country) {
  /* no country chosen yet → show the Netherlands rate (zone 0) */
  const zone = country ? gharShipZone(country) : GHAR_SHIP_ZONES[0];
  const sub = Math.round(gharCartTotal() * 100) / 100;
  const promo = gharPromoStored() && sub >= GHAR_PROMO_MIN;
  const discount = promo ? Math.round(sub * GHAR_PROMO_RATE * 100) / 100 : 0;
  const shipping = sub === 0 ? 0 : (sub >= zone.freeMin ? 0 : zone.price);
  const total = Math.round((sub - discount + shipping) * 100) / 100;
  return { sub: sub, discount: discount, shipping: shipping, total: total, promo: promo, zone: zone, country: country || '' };
}

/* ── nav badge ── */
function gharUpdateBadge() {
  const el = document.getElementById('nav-bag');
  if (!el) return;
  const n = gharCartCount();
  el.textContent = n > 0 ? 'Bag · ' + n : 'Bag';
}

/* ── stock ── */
let gharStock = null;
/* Fallback stock numbers for single-id products with no Stock tab row yet in
   the Google Sheet (added August 2026, real on-hand counts after accounting
   for pieces held back for display/photoshoot use). This only limits what
   THIS browser can add to cart in one session — it does NOT decrement across
   different customers' orders the way a real Stock tab row does. Add a real
   row with the same number to get true cross-order automatic tracking; once
   a row exists, the live Sheet value below takes over automatically. */
const GHAR_STATIC_STOCK = {
  runner: 10,
  largecushion: 7,
  rectmat: 8,
  circlemat: 9,
  marigold: 8,
  rivervine: 8,
  stone: 8,
  forest: 8,
  golden: 8,
  'napkin-set2': 6,
  /* new collections (Nov 2026 count; pouches capped at 10 per colour until counted) */
  'delftpur-cushion': 30,
  'gulabi-cushion': 31,
  'haldi-cushion': 6,
  'nostalgia-rani': 10,
  'nostalgia-chameli-pink': 10,
  'nostalgia-chameli-ivory': 10,
  'gulabi-runner': 24,
  'haldi-runner': 5,
  'delftpur-roundmat': 10,
  'gulabi-roundmat': 10,
  'haldi-roundmat': 6,
  'delftpur-rectmat': 10,
  'gulabi-rectmat': 10,
  'gulabi-napkin': 20,
  'gulabi-coaster': 12,
  'gulabi-pouch': 10,
  'delftpur-pouch': 10,
  'delftpur-apron': 3,
  'ikat-apron': 3
};
function gharRemaining(id) {
  if (gharStock && (id in gharStock)) return gharStock[id];
  if (id in GHAR_STATIC_STOCK) return GHAR_STATIC_STOCK[id];
  return Infinity;
}
/* Group-aware remaining: for a product sharing a GHAR_STOCK_GROUPS pool, caps
   at (group limit − however much of the group is already in this cart), on
   top of whatever the live per-id stock says. Ungrouped products just get
   gharRemaining(id) back unchanged. */
function gharGroupOf(id) {
  for (const key in GHAR_STOCK_GROUPS) {
    if (GHAR_STOCK_GROUPS[key].ids.indexOf(id) !== -1) return GHAR_STOCK_GROUPS[key];
  }
  return null;
}
function gharPieceWeight(group, id) {
  return (group.weights && group.weights[id]) || 1;
}
function gharEffectiveRemaining(id) {
  const group = gharGroupOf(id);
  if (!group) return gharRemaining(id);
  const cart = gharCart();
  const piecesInCart = group.ids.reduce(function (sum, gid) {
    return sum + (gid === id ? 0 : (cart[gid] || 0) * gharPieceWeight(group, gid));
  }, 0);
  const piecesLeft = Math.max(0, group.limit - piecesInCart);
  const unitsLeftFromPool = Math.floor(piecesLeft / gharPieceWeight(group, id));
  return Math.min(gharRemaining(id), unitsLeftFromPool);
}
function gharLoadStock(cb) {
  fetch(GHAR_API).then(function (r) { return r.json(); }).then(function (d) {
    if (d && d.remaining) {
      gharStock = d.remaining;
      gharApplyStockToShop();
      if (cb) cb();
    }
  }).catch(function () { /* stock unknown — fail open */ });
}
function gharApplyStockToShop() {
  document.querySelectorAll('.btn-add').forEach(function (btn) {
    const m = (btn.getAttribute('onclick') || '').match(/gharAdd\('([a-z0-9-]+)'/);
    if (!m) return;
    const id = m[1];
    const left = gharEffectiveRemaining(id);
    const card = btn.closest('.product');
    const imgWrap = card ? card.querySelector('.product-img') : null;
    const oldBadge = imgWrap ? imgWrap.querySelector('.stock-badge') : null;
    if (oldBadge) oldBadge.remove();
    if (left <= 0) {
      btn.disabled = true;
      btn.textContent = 'Sold out';
      if (imgWrap) {
        const b = document.createElement('span');
        b.className = 'stock-badge soldout'; b.textContent = 'Sold out';
        imgWrap.appendChild(b);
      }
    } else if (left <= GHAR_LOW_STOCK) {
      if (imgWrap) {
        const b = document.createElement('span');
        b.className = 'stock-badge low'; b.textContent = 'Last few pieces left';
        imgWrap.appendChild(b);
      }
    }
  });
}

/* Called by "Add to bag" buttons: gharAdd('marigold', this) */
function gharAdd(id, btn) {
  if (!GHAR_PRODUCTS[id] || GHAR_PRODUCTS[id].notForSale) return;
  if (gharCartCount() + 1 > GHAR_MAX_PER_ORDER) {
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Max ' + GHAR_MAX_PER_ORDER + ' per order';
      setTimeout(function () { btn.textContent = orig; }, 1800);
    }
    return;
  }
  const cart = gharCart();
  const current = cart[id] || 0;
  const p = GHAR_PRODUCTS[id];
  if (p.maxPerOrder && current + 1 > p.maxPerOrder) {
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Max ' + p.maxPerOrder + ' per person';
      setTimeout(function () { btn.textContent = orig; }, 1800);
    }
    return;
  }
  const left = gharEffectiveRemaining(id);
  if (current + 1 > left) {
    if (btn) {
      const original = btn.textContent;
      btn.textContent = left <= 0 ? 'Sold out' : 'Only ' + left + ' left';
      setTimeout(function () { btn.textContent = original; }, 1600);
    }
    return;
  }
  cart[id] = current + 1;
  gharSaveCart(cart);
  if (btn) {
    const original = btn.textContent;
    btn.textContent = 'Added ✓';
    btn.disabled = true;
    setTimeout(function () { btn.textContent = original; btn.disabled = false; }, 1200);
  }
}

/* ── site-wide modal ── */
function gharModalOpen(html, wide) {
  let ov = document.getElementById('ghar-modal');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'ghar-modal';
    ov.className = 'gpop-overlay';
    ov.innerHTML = '<div class="gpop"><button class="gpop-close" aria-label="Close" type="button">×</button><div id="ghar-modal-body"></div></div>';
    document.body.appendChild(ov);
    ov.querySelector('.gpop-close').onclick = gharModalClose;
    ov.addEventListener('click', function (e) { if (e.target === ov) gharModalClose(); });
  }
  ov.querySelector('.gpop').classList.toggle('gpop-product', !!wide);
  ov.querySelector('#ghar-modal-body').innerHTML = html;
  ov.hidden = false;
}
function gharModalClose() {
  const ov = document.getElementById('ghar-modal');
  if (ov) ov.hidden = true;
}
function gharEmailOk(email) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email); }

/* Shared "photo coming soon" block — used by the shop grid (inside a .photo
   parent, which is already position:relative — see styles.css) and by the
   product modal (pm-main is given position:relative for this same reason). */
function gharPhotoPlaceholder() {
  return '<div class="photo-label"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#143659" stroke-width="1.3">' +
    '<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="8.5" cy="10" r="1.4"/><path d="M3 16.5l5-5 4 4 3-3 6 6"/></svg>' +
    '<span>Photo coming soon</span></div>';
}

/* Combined photo+video gallery for the product modal. Videos live in a
   separate p.videos[] (never in p.images[]) so img/images[0] — used for the
   shop card thumbnail and cart line thumb — is always guaranteed a real
   photo, never a video. */
function gharProductMedia(p) {
  const demo = p.demo ? [{ type: 'demo', src: p.demo, thumb: p.img }] : [];
  return demo.concat(p.images.map(function (src) { return { type: 'img', src: src }; }))
    .concat((p.videos || []).map(function (src) { return { type: 'video', src: src }; }));
}
function gharMediaHtml(m) {
  if (m.type === 'video') return '<video src="' + m.src + '" autoplay muted loop playsinline></video>';
  if (m.type === 'demo') return '<iframe src="' + m.src + '" title="Feature walkthrough" loading="lazy"></iframe>';
  return '<img src="' + m.src + '" alt="">';
}

/* ── product detail viewer (shop) ── */
function gharProductModal(id) {
  const p = GHAR_PRODUCTS[id];
  if (!p) return;
  const media = gharProductMedia(p);
  const hasMedia = media.length > 0;
  const thumbs = media.length > 1
    ? '<div class="pm-thumbs">' + media.map(function (m, i) {
        if (m.type === 'demo') return '<span class="pm-thumb-demo' + (i === 0 ? ' active' : '') + '" data-i="' + i + '"><img src="' + m.thumb + '" alt=""><b>▶</b></span>';
        return m.type === 'video'
          ? '<video src="' + m.src + '" data-i="' + i + '" class="' + (i === 0 ? 'active' : '') + '" autoplay muted loop playsinline></video>'
          : '<img src="' + m.src + '" data-i="' + i + '" class="' + (i === 0 ? 'active' : '') + '" alt="">';
      }).join('') + '</div>'
    : '';
  const group = (p.variantGroup && !p.notForSale) ? GHAR_STOCK_GROUPS[p.variantGroup] : null;
  const variantPicker = group
    ? '<div class="pm-variants">' + group.ids.map(function (vid) {
        return '<button type="button" class="pm-variant' + (vid === id ? ' active' : '') + '" data-id="' + vid + '">' +
          GHAR_PRODUCTS[vid].variantLabel + '</button>';
      }).join('') + '</div>'
    : '';
  const firstIsImg = hasMedia && media[0].type === 'img';
  gharModalOpen(
    '<div class="pm-grid">' +
      '<div class="pm-gallery">' +
        '<div class="pm-main" id="pm-main"' + (firstIsImg ? '' : ' style="cursor:default"') + '>' +
          (hasMedia ? gharMediaHtml(media[0]) : gharPhotoPlaceholder()) +
          (media.length > 1 ? '<button type="button" class="pm-nav pm-prev" aria-label="Previous photo">‹</button><button type="button" class="pm-nav pm-next" aria-label="Next photo">›</button>' : '') +
        '</div>' +
        thumbs +
        '<p class="pm-zoomhint" id="pm-zoomhint" style="' + (firstIsImg ? '' : 'visibility:hidden') + '">Click the photo to zoom</p>' +
      '</div>' +
      '<div class="pm-info">' +
        '<p class="s-tag">' + (p.printType === 'ikat' ? 'Ikat collection' : 'The collection') + '</p>' +
        '<h3>' + ((p.notForSale && p.variantGroup) ? 'Everyday Tote Bag' : p.name) + '</h3>' +
        variantPicker +
        (p.notForSale ? '' :
          '<p class="pm-size" id="pm-variant-size">' + p.size + ' · ' + p.material + '</p>' +
          '<p class="pm-price price">' + gharPriceHtml(p) + '</p>' +
          (gharBulkNote(id) ? '<p class="pm-bulk">' + gharBulkNote(id) + '</p>' : '') +
          (p.maxPerOrder ? '<p class="pm-bulk">Just ' + p.maxPerOrder + ' per person — this batch is tiny.</p>' : '')) +
        '<div class="pm-desc">' + p.desc.map(function (d) { return '<p>' + d + '</p>'; }).join('') + '</div>' +
        (p.made ? '<div class="pm-made"><p class="pm-made-tag">Made by hand</p><p>' + p.made + '</p>' +
          '<a href="stories.html#' + (p.collection || 'journey') + '">Meet the hands behind it</a></div>' : '') +
        (p.notForSale ? '' : '<p class="pm-note">Every batch here is intentionally small — what you choose to buy tells us what to make more of next.</p>') +
        '<div id="pm-action"></div>' +
      '</div>' +
    '</div>', true
  );
  // zoom: click toggles, mouse position pans — bound once; re-queries main's
  // current <img> each time so it's a no-op whenever a video is showing
  // instead of a video (bind once, no duplicate listeners on thumb-switch)
  const main = document.getElementById('pm-main');
  main.addEventListener('click', function (e) {
    const img = main.querySelector('img');
    if (!img) return;
    const zoomed = img.classList.toggle('zoomed');
    if (zoomed) {
      const r = main.getBoundingClientRect();
      img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
    } else {
      img.style.transformOrigin = 'center';
    }
  });
  main.addEventListener('mousemove', function (e) {
    const img = main.querySelector('img');
    if (!img || !img.classList.contains('zoomed')) return;
    const r = main.getBoundingClientRect();
    img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
  });
  // thumbnails + prev/next arrows both swap pm-main's content through this one
  // function, so the "active" thumbnail and the arrows' notion of "current"
  // never fall out of sync with each other.
  let pmCurrent = 0;
  function gharShowMedia(i) {
    pmCurrent = (i + media.length) % media.length;
    const m = media[pmCurrent];
    main.innerHTML = gharMediaHtml(m) +
      (media.length > 1 ? '<button type="button" class="pm-nav pm-prev" aria-label="Previous photo">‹</button><button type="button" class="pm-nav pm-next" aria-label="Next photo">›</button>' : '');
    main.style.cursor = m.type === 'img' ? 'zoom-in' : 'default';
    const hint = document.getElementById('pm-zoomhint');
    if (hint) hint.style.visibility = m.type === 'img' ? 'visible' : 'hidden';
    document.querySelectorAll('.pm-thumbs > img, .pm-thumbs > video, .pm-thumbs > .pm-thumb-demo').forEach(function (x) {
      x.classList.toggle('active', Number(x.dataset.i) === pmCurrent);
    });
    gharBindPmNav();
  }
  function gharBindPmNav() {
    const prev = main.querySelector('.pm-prev');
    const next = main.querySelector('.pm-next');
    if (prev) prev.addEventListener('click', function (e) { e.stopPropagation(); gharShowMedia(pmCurrent - 1); });
    if (next) next.addEventListener('click', function (e) { e.stopPropagation(); gharShowMedia(pmCurrent + 1); });
  }
  gharBindPmNav();
  document.querySelectorAll('.pm-thumbs > img, .pm-thumbs > video, .pm-thumbs > .pm-thumb-demo').forEach(function (t) {
    t.addEventListener('click', function () { gharShowMedia(Number(t.dataset.i)); });
  });
  // variant picker (Everyday Tote Bag, etc.) — switches which id "Add to bag" targets
  document.querySelectorAll('.pm-variant').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const vid = btn.dataset.id;
      const vp = GHAR_PRODUCTS[vid];
      document.querySelectorAll('.pm-variant').forEach(function (b) { b.classList.toggle('active', b === btn); });
      document.getElementById('pm-variant-size').textContent = vp.size + ' · ' + vp.material;
      gharRenderPmAction(vid);
    });
  });
  // fills #pm-action with either the normal add button, or — once a product/variant
  // is sold out — a warm thank-you + "notify me for the next batch" email capture,
  // instead of just disabling the button. Called on initial render and again on
  // every variant switch, so it's always in sync with whichever id is selected.
  gharRenderPmAction(id);
}

function gharRenderPmAction(id) {
  const el = document.getElementById('pm-action');
  if (!el) return;
  const notForSale = !!GHAR_PRODUCTS[id].notForSale;
  if (!notForSale && gharEffectiveRemaining(id) > 0) {
    el.innerHTML = '<button class="btn-add pm-add" onclick="gharAdd(\'' + id + '\', this)">Yes, I\'m in</button>';
    return;
  }
  el.innerHTML =
    '<div class="pm-soldout">' +
      (notForSale
        ? '<p>Want to be the first to know when the new tote is ready? Leave your email below and we\'ll tell you the moment it is.</p>'
        : '<p>Thank you for your interest — this piece was part of a very first, very small production run. We keep every batch intentionally small: so nothing is overproduced, nothing ends up in a landfill, and the hands that made it by hand are valued for the time that took, not rushed into making more than needed.</p>' +
          '<p>Leave your email below and we\'ll let you know as soon as the next production is ready.</p>') +
      '<div class="pm-soldout-form">' +
        '<input type="email" id="pm-notify-email" placeholder="your@email.com" autocomplete="email">' +
        '<button type="button" id="pm-notify-send">Notify me</button>' +
      '</div>' +
      '<p id="pm-notify-status" role="status"></p>' +
    '</div>';
  document.getElementById('pm-notify-send').addEventListener('click', async function () {
    const email = document.getElementById('pm-notify-email').value.trim();
    const status = document.getElementById('pm-notify-status');
    if (!gharEmailOk(email)) { status.textContent = 'Please enter a valid email address.'; return; }
    this.disabled = true;
    try {
      await fetch(GHAR_API, { method: 'POST', body: JSON.stringify({ type: 'notify', email: email, product: GHAR_PRODUCTS[id].name, secret: GHAR_SECRET }) });
    } catch (e) { /* optimistic */ }
    status.textContent = 'Thank you — we\'ll let you know!';
  });
}

/* ── mobile hamburger menu (injected on every page) ── */
function gharBurger() {
  const nav = document.querySelector('nav');
  if (!nav || nav.querySelector('.nav-burger')) return;
  const btn = document.createElement('button');
  btn.className = 'nav-burger';
  btn.setAttribute('aria-label', 'Menu');
  btn.setAttribute('type', 'button');
  btn.innerHTML = '<span></span><span></span><span></span>';
  nav.insertBefore(btn, nav.querySelector('.nav-cart'));
  btn.addEventListener('click', function () { nav.classList.toggle('nav-open'); });
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () { nav.classList.remove('nav-open'); });
  });
}

/* ── footer links + newsletter wiring (runs on every page) ── */
function gharWireSite() {
  // Contact us: form popup
  document.querySelectorAll('a.ghar-contact').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      gharModalOpen(
        '<p class="s-tag">Contact us</p>' +
        '<h3>We would love to hear from you.</h3>' +
        '<p>Please reach out to us using this form:</p>' +
        '<div class="gform">' +
          '<input id="gc-name" placeholder="Full name" autocomplete="name">' +
          '<input id="gc-email" type="email" placeholder="Email address" autocomplete="email">' +
          '<textarea id="gc-msg" rows="4" placeholder="Message"></textarea>' +
          '<button id="gc-send" type="button" class="gform-btn">Send message</button>' +
          '<p id="gc-status" role="status"></p>' +
        '</div>' +
        '<p class="gpop-foot">You can also write to us at <a href="mailto:dimple@ghar.nl">dimple@ghar.nl</a> or find us on <a href="https://instagram.com/ghar_dam" target="_blank" rel="noopener">Instagram</a>.</p>'
      );
      document.getElementById('gc-send').onclick = async function () {
        const name = document.getElementById('gc-name').value.trim();
        const email = document.getElementById('gc-email').value.trim();
        const msg = document.getElementById('gc-msg').value.trim();
        const st = document.getElementById('gc-status');
        if (!name || !msg || !gharEmailOk(email)) { st.textContent = 'Please fill in your name, a valid email, and a message.'; return; }
        this.disabled = true;
        try {
          await fetch(GHAR_API, { method: 'POST', body: JSON.stringify({ type: 'contact', name: name, email: email, message: msg, secret: GHAR_SECRET }) });
        } catch (err) { /* optimistic */ }
        st.textContent = 'Thank you — we will reach out to you shortly!';
      };
    });
  });

  // Newsletter subscribe (all "Postcards from Ghar" forms)
  document.querySelectorAll('.nl-form').forEach(function (f) {
    const btn = f.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', async function () {
      const nameInput = f.querySelector('input[type="text"]');
      const emailInput = f.querySelector('input[type="email"]');
      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      let st = f.querySelector('.nl-status') || f.parentElement.querySelector('.nl-status');
      if (!st) { st = document.createElement('p'); st.className = 'nl-status'; f.appendChild(st); }
      if (!gharEmailOk(email)) { st.textContent = 'Please enter a valid email address.'; return; }
      btn.disabled = true;
      try {
        await fetch(GHAR_API, { method: 'POST', body: JSON.stringify({ type: 'subscribe', name: name, email: email, secret: GHAR_SECRET }) });
      } catch (err) { /* optimistic */ }
      st.textContent = 'Thank you — we will reach out to you shortly!';
      if (nameInput) nameInput.value = '';
      if (emailInput) emailInput.value = '';
      setTimeout(function () { btn.disabled = false; }, 2000);
    });
  });

  // Product cards open the detail viewer (shop page)
  document.querySelectorAll('.product').forEach(function (card) {
    const btn = card.querySelector('.btn-add');
    const m = btn ? (btn.getAttribute('onclick') || '').match(/gharAdd\('([a-z]+)'/) : null;
    if (!m) return;
    const id = m[1];
    const img = card.querySelector('.product-img');
    const title = card.querySelector('h3');
    [img, title].forEach(function (el) {
      if (!el) return;
      el.style.cursor = 'zoom-in';
      el.addEventListener('click', function () { gharProductModal(id); });
    });
  });
}

/* ── EVENTS POPUP (workshop 5 Dec + Westergas market 6 Dec) ──────────────
   Shows once per browser visit on every page except workshops/cart/markets, until the
   last event is over. Each event card disappears by itself once it has started
   (workshop) or ended (market). "I'll check later" hides it for this visit. */
const GHAR_EVENTS = [
  { id: 'ws05', until: '2026-12-05T10:00:00Z',
    tag: 'Workshop · Sat 5 Dec',
    title: 'Block printing workshop',
    meta: 'From 11:00 · Kringloop West, Amsterdam · €40 special price',
    text: 'Very limited spots! Print up to two tote bags with our hand-carved wooden blocks. Everything is included, and your first drink from the café is on us.',
    primary: { label: 'Yes, I’m in · book my spot', href: 'https://buy.stripe.com/9B65kw0bkfW267ad0FfnO00' },
    secondary: { label: 'More about the workshop', href: 'workshops.html' } },
  { id: 'mk06', until: '2026-12-06T17:00:00Z',
    tag: 'Market · Sun 6 Dec',
    title: 'Find us at Sunday Market Westergas',
    meta: '12:00 to 18:00 · Westergas, Pazzanistraat 41, Amsterdam',
    text: 'See the whole collection in person, feel the cotton, and try a block print yourself at our stall.',
    primary: { label: 'I’m interested · save the date', ics: true,
      start: '20261206T110000Z', end: '20261206T170000Z',
      summary: 'Ghar at Sunday Market Westergas', where: 'Westergas, Pazzanistraat 41, Amsterdam' },
    secondary: { label: 'More about the market', href: 'markets.html' } }
];
function gharEventsPopup() {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (page === 'workshops.html' || page === 'cart.html' || page === 'markets.html') return;
  if (page === 'shop.html') { try { if (!localStorage.getItem('gharNotifySeen')) return; } catch (e) {} }
  try { if (sessionStorage.getItem('gharEventsSeen')) return; } catch (e) {}
  const now = Date.now();
  const live = GHAR_EVENTS.filter(function (ev) { return now < Date.parse(ev.until); });
  if (!live.length) return;
  const esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  const cards = live.map(function (ev, i) {
    const p = ev.primary;
    const prim = p.ics
      ? '<button type="button" class="gev-btn" data-ics="' + i + '">' + esc(p.label) + '</button>'
      : '<a class="gev-btn" href="' + esc(p.href) + '" data-go>' + esc(p.label) + '</a>';
    const ext = /^https?:/.test(ev.secondary.href) ? ' target="_blank" rel="noopener"' : '';
    return '<div class="gev-card"><p class="gev-tag">' + esc(ev.tag) + '</p><h4>' + esc(ev.title) + '</h4>' +
      '<p class="gev-meta">' + esc(ev.meta) + '</p><p class="gev-text">' + esc(ev.text) + '</p>' + prim +
      '<a class="gev-link" href="' + esc(ev.secondary.href) + '"' + ext + ' data-go>' + esc(ev.secondary.label) + '</a></div>';
  }).join('');
  const ov = document.createElement('div');
  ov.className = 'gpop-overlay gev-overlay';
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'gev-h');
  ov.innerHTML = '<div class="gpop gev"><button class="gpop-close" aria-label="Close" type="button">×</button>' +
    '<p class="gev-kicker">Come and find us</p><h3 id="gev-h">' + (live.length > 1 ? 'Two dates with Ghar' : 'A date with Ghar') + '</h3>' +
    '<div class="gev-cards' + (live.length > 1 ? '' : ' one') + '">' + cards + '</div>' +
    '<button type="button" class="gpop-skip gev-later">I’ll check later</button></div>';
  document.body.appendChild(ov);
  function close() { ov.remove(); try { sessionStorage.setItem('gharEventsSeen', '1'); } catch (e) {} }
  ov.querySelector('.gpop-close').onclick = close;
  ov.querySelector('.gev-later').onclick = close;
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
  ov.querySelectorAll('[data-go]').forEach(function (a) { a.addEventListener('click', function () { try { sessionStorage.setItem('gharEventsSeen', '1'); } catch (e) {} }); });
  ov.querySelectorAll('[data-ics]').forEach(function (b) {
    b.addEventListener('click', function () {
      const p = live[+b.dataset.ics].primary;
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ghar//ghar.nl//EN', 'BEGIN:VEVENT',
        'UID:' + p.start + '-ghar@ghar.nl', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
        'DTSTART:' + p.start, 'DTEND:' + p.end, 'SUMMARY:' + p.summary, 'LOCATION:' + p.where.replace(/,/g, '\\,'),
        'URL:https://ghar.nl', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      a.download = 'ghar-westergas-6-dec.ics';
      document.body.appendChild(a); a.click(); a.remove();
      b.textContent = 'Saved · see you there!';
    });
  });
  const first = ov.querySelector('.gev-btn'); if (first) { try { first.focus({ preventScroll: true }); } catch (e) {} }
}

/* ── init ── */
function gharInit() {
  gharUpdateBadge();
  gharBurger();
  gharWireSite();
  gharEventsPopup();
  if (document.querySelector('.btn-add') || document.getElementById('cart-items')) {
    gharLoadStock(function () {
      if (typeof renderCart === 'function') renderCart();
    });
  }
}
if (document.readyState !== 'loading') gharInit();
else document.addEventListener('DOMContentLoaded', gharInit);
window.addEventListener('pageshow', gharUpdateBadge); // covers back/forward cache restores

/* ── ANALYTICS + COOKIE CONSENT ─────────────────────────────────
   Fill in the two IDs below to switch analytics on.
   - Cloudflare Web Analytics is cookie-free, so it runs for every visitor.
   - Google Analytics sets cookies, so it only loads after the visitor clicks
     "Accept" in the cookie banner. The choice is kept in localStorage
     ('gharConsent' = 'yes' | 'no') and can be changed via "Cookie settings"
     in the footer of every page. Empty IDs = nothing loads, no banner. */
const GHAR_CF_TOKEN = '155c5d5aca0f434cb9dfd591e5ce1378';  // token from the Cloudflare Web Analytics JS snippet
const GHAR_GA_ID = 'G-QMZ2F52Z77';     // Google Analytics 4 Measurement ID, e.g. 'G-XXXXXXXXXX'

function gharLoadCloudflare() {
  if (!GHAR_CF_TOKEN || document.querySelector('script[data-cf-beacon]')) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: GHAR_CF_TOKEN }));
  document.head.appendChild(s);
}
function gharLoadGA() {
  if (!GHAR_GA_ID || window.gharGALoaded) return;
  window.gharGALoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GHAR_GA_ID);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GHAR_GA_ID);
}
function gharConsent() { try { return localStorage.getItem('gharConsent'); } catch (e) { return null; } }
function gharSetConsent(v) {
  const was = gharConsent();
  try { localStorage.setItem('gharConsent', v); } catch (e) {}
  if (v === 'yes') gharLoadGA();
  else if (was === 'yes') {
    // withdrawn: remove the Google Analytics cookies and reload without them
    document.cookie.split(';').forEach(function (c) {
      const n = c.split('=')[0].trim();
      if (n.indexOf('_ga') !== 0) return;
      [location.hostname, '.' + location.hostname.replace(/^www\./, '')].forEach(function (d) {
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + d;
      });
      document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });
    location.reload();
  }
}
function gharCookieBanner() {
  if (document.getElementById('ghar-cookies')) return;
  const b = document.createElement('div');
  b.id = 'ghar-cookies';
  b.className = 'gcookie';
  b.setAttribute('role', 'dialog');
  b.setAttribute('aria-label', 'Cookie choice');
  b.innerHTML =
    '<p>May we use Google Analytics cookies to see how people find and use Ghar? No ads, and we never sell your data. <a href="privacy.html">Privacy</a></p>' +
    '<div class="gcookie-btns"><button type="button" class="btn-pri" data-c="yes">Accept</button>' +
    '<button type="button" class="gcookie-no" data-c="no">No thanks</button></div>';
  b.addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-c]');
    if (!btn) return;
    b.remove();
    gharSetConsent(btn.getAttribute('data-c'));
  });
  document.body.appendChild(b);
}
function gharInitAnalytics() {
  gharLoadCloudflare();
  // footer links: Privacy (always) and Cookie settings (only when Google Analytics is set up)
  const fb = document.querySelector('.footer-bottom');
  if (fb && !fb.querySelector('.gcookie-links')) {
    const p = document.createElement('p');
    p.className = 'gcookie-links';
    p.innerHTML = '<a href="privacy.html">Privacy</a>' + (GHAR_GA_ID ? ' · <a href="#" class="gcookie-settings">Cookie settings</a>' : '');
    fb.appendChild(p);
    const cs = p.querySelector('.gcookie-settings');
    if (cs) cs.addEventListener('click', function (e) { e.preventDefault(); gharCookieBanner(); });
  }
  if (!GHAR_GA_ID) return;
  const c = gharConsent();
  if (c === 'yes') gharLoadGA();
  else if (c !== 'no') gharCookieBanner();
}
if (document.readyState !== 'loading') gharInitAnalytics();
else document.addEventListener('DOMContentLoaded', gharInitAnalytics);
