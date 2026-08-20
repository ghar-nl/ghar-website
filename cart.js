/* ── GHAR CART — shared across all pages ─────────────────────
   Cart lives in localStorage under "gharCart" as {productId: qty}.
   Include with: <script src="cart.js" defer></script>              */

const GHAR_API = 'https://script.google.com/macros/s/AKfycbwPyxknSnMjppLX_leBgCdiEBlrzqYHj98iEMJHjgbmeNtes_BQjEHx3Pa51t-MuOEdDw/exec';
const GHAR_SECRET = '47d80edaf79922927989f72c'; // must match Apps Script

const GHAR_SHIPPING = 5;            // € flat shipping
const GHAR_FREE_SHIP_MIN = 59.99;   // € free shipping threshold
const GHAR_PROMO_CODE = 'GHARPREORDER20';
const GHAR_PROMO_RATE = 0.20;       // 20% off
const GHAR_PROMO_MIN = 100;         // on orders above €100
const GHAR_LOW_STOCK = 5;           // "last few pieces" threshold
const GHAR_MAX_PER_ORDER = 6;       // max items per person/order, across the whole catalog

/* Some products are sold from one shared, combined stock pool under several ids
   (e.g. the tote bag's 4 colour/orientation variants share one batch of 3 — see
   CLAUDE.md "Shared stock groups"). Until each id has its own row in the Sheet's
   Stock tab, this is the only place that limit is enforced. */
const GHAR_STOCK_GROUPS = {
  totebag: { ids: ['totebag-h-same', 'totebag-h-contrast', 'totebag-v-same', 'totebag-v-contrast'], limit: 3 }
};

const GHAR_DESC_SHARED = [
  "The border is block printed separately and finished with contrasting piping — it strengthens every edge and gives the cover its clean, tailored line.",
  "The zip sits hidden at the centre of the back panel — never running end to end — so it stays strong for years and never works loose.",
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
    img: 'images/products/rivervine/5.jpg', images: ['images/products/rivervine/5.jpg','images/products/rivervine/1.jpg','images/products/rivervine/2.jpg','images/products/rivervine/3.jpg','images/products/rivervine/4.jpg','images/products/rivervine/6.jpg','images/products/rivervine/7.jpg','images/products/rivervine/8.jpg','images/products/rivervine/9.jpg'],
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
    img: 'images/products/stone/6.jpg', images: ['images/products/stone/6.jpg','images/products/stone/1.jpg','images/products/stone/2.jpg','images/products/stone/3.jpg','images/products/stone/4.jpg','images/products/stone/5.jpg','images/products/stone/7.jpg','images/products/stone/8.jpg','images/products/stone/9.jpg','images/products/stone/10.jpg','images/products/stone/11.jpg','images/products/stone/12.jpg','images/products/stone/13.jpg','images/products/stone/14.jpg','images/products/stone/15.jpg','images/products/stone/16.jpg'],
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
    img: 'images/products/forest/4.jpg', images: ['images/products/forest/4.jpg','images/products/forest/1.jpg','images/products/forest/2.jpg','images/products/forest/3.jpg','images/products/forest/5.jpg','images/products/forest/6.jpg'],
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
    img: 'images/products/golden/5.jpg', images: ['images/products/golden/5.jpg','images/products/golden/1.jpg','images/products/golden/2.jpg','images/products/golden/3.jpg','images/products/golden/4.jpg','images/products/golden/6.jpg'],
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
    category: 'wall-art', printType: 'ikat', rooms: ['living'], favRank: 1,
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
    img: 'images/products/largecushion/1.jpg', images: ['images/products/largecushion/1.jpg','images/products/largecushion/2.jpg','images/products/largecushion/3.jpg','images/products/largecushion/4.jpg','images/products/largecushion/5.jpg','images/products/largecushion/6.jpg','images/products/largecushion/7.jpg','images/products/largecushion/8.jpg'],
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
    name: 'Ikat Table Runner', price: 20.99,
    img: 'images/products/runner/2.jpg', images: ['images/products/runner/2.jpg','images/products/runner/1.jpg','images/products/runner/3.jpg','images/products/runner/4.jpg','images/products/runner/5.jpg','images/products/runner/6.jpg','images/products/runner/7.jpg'],
    size: '35 × 150 cm', material: 'Ikat woven · 100% organic cotton',
    category: 'table-runner', printType: 'ikat', rooms: ['living', 'dining'], favRank: 3,
    mini: "A dark red border gives this ikat runner one last, quiet highlight.",
    desc: [
      "A table runner is the fastest way to change a room without changing anything in it — lay it down the centre of the dining table for dinner, or across a console or sideboard in the living room, and the whole space shifts colour with it.",
      "At 35 × 150 cm, it is sized generously for the long tables we keep seeing in Dutch homes, with a dark red border that gives the ikat pattern one last, quiet highlight. The base is 100% organic cotton — easy to wash under cold water, and just as easy to live with."
    ]
  },
  rectmat: {
    name: 'Ikat Rectangle Table Mat', price: 12.99, bulk: { extra: 11.00 },
    img: 'images/products/rectmat/1.jpg', images: ['images/products/rectmat/1.jpg','images/products/rectmat/2.jpg','images/products/rectmat/3.jpg','images/products/rectmat/4.jpg','images/products/rectmat/5.jpg','images/products/rectmat/6.jpg'],
    size: '32 × 45 cm', material: 'Ikat woven cotton',
    category: 'placemat', printType: 'ikat', rooms: ['dining'], favRank: 20,
    mini: "A well-dressed table starts here — hemmed in a soft contrast colour. Buy 2 or more and every extra mat is just €11.",
    desc: [
      "Whether you are protecting the table, dressing it up for guests, or simply keeping the wood beneath it safe, a good placemat does more work than it gets credit for. Ours are cut to sit beautifully under a full place setting, and we will admit it — we are a little obsessed with them ourselves.",
      "Each mat is finished with a hem in a soft contrast colour, giving it a clean, defined edge against any tablecloth or bare wood. Wash under cold water with a gentle detergent (or just cold water alone) and dry in the shade — no fuss, no fading.",
      "The first mat is €12.99 — every mat after that is just €11.00, automatically, right in your bag. Setting a table for four? That's €45.99 instead of €51.96.",
      "See a few of the ways we have used them in our own homes, below."
    ]
  },
  circlemat: {
    name: 'Ikat Round Table Mat', price: 12.99, bulk: { extra: 11.00 },
    img: 'images/products/circlemat/6.jpg', images: ['images/products/circlemat/6.jpg','images/products/circlemat/1.jpg','images/products/circlemat/2.jpg','images/products/circlemat/3.jpg','images/products/circlemat/4.jpg','images/products/circlemat/5.jpg'],
    size: '30 cm diameter', material: 'Ikat woven cotton',
    category: 'placemat', printType: 'ikat', rooms: ['dining'], favRank: 21,
    mini: "The same idea, in the round — elegant under any dinner plate. Buy 2 or more and every extra mat is just €11.",
    desc: [
      "The same idea, in the round: a circle mat brings a softer line to the table and suits a round plate especially well. In our ikat red, it gives just the right amount of contrast against plain white or stoneware — enough to notice, not enough to shout.",
      "The first mat is €12.99 — every mat after that is just €11.00, automatically, right in your bag. Setting a table for four? That's €45.99 instead of €51.96.",
      "Wash under cold water and dry in the shade, same as the rest of the collection — these are made to be used, not saved for best."
    ]
  },
  'napkin-set4': {
    name: 'Ikat Napkins — Set of 4', price: 24.99,
    img: 'images/products/napkin/1.jpg', images: ['images/products/napkin/1.jpg','images/products/napkin/2.jpg','images/products/napkin/3.jpg','images/products/napkin/4.jpg','images/products/napkin/5.jpg'],
    size: '40 × 40 cm · set of 4', material: 'Ikat woven · 100% organic cotton',
    category: 'napkin', printType: 'ikat', rooms: ['dining'], favRank: 22,
    mini: "Soft enough for children, finished enough for guests. Sold as a set of 4 — works out to about €6.25 per napkin.",
    desc: [
      "A good napkin does more than wipe a mouth — fold it under the cutlery to finish a place setting, let it sit loose and colourful across the table, or hand it to the smallest person at dinner. Being 100% organic cotton, it is soft enough that we reach for these with children too — gentle on the skin, and it only gets softer with washing.",
      "Finished at 40 × 40 cm — generous enough for a lap, easy enough to fold into a neat square.",
      "Sold only as a set of 4 (about €6.25 per napkin) — if you need a bigger table setting, the Set of 6 works out a little cheaper per napkin."
    ]
  },
  'napkin-set6': {
    name: 'Ikat Napkins — Set of 6', price: 36.99,
    img: 'images/products/napkin/2.jpg', images: ['images/products/napkin/2.jpg','images/products/napkin/1.jpg','images/products/napkin/3.jpg','images/products/napkin/4.jpg','images/products/napkin/5.jpg'],
    size: '40 × 40 cm · set of 6', material: 'Ikat woven · 100% organic cotton',
    category: 'napkin', printType: 'ikat', rooms: ['dining'], favRank: 23,
    mini: "Soft enough for children, finished enough for guests. Sold as a set of 6 — about €6.17 per napkin, our best per-napkin price.",
    desc: [
      "A good napkin does more than wipe a mouth — fold it under the cutlery to finish a place setting, let it sit loose and colourful across the table, or hand it to the smallest person at dinner. Being 100% organic cotton, it is soft enough that we reach for these with children too — gentle on the skin, and it only gets softer with washing.",
      "Finished at 40 × 40 cm — generous enough for a lap, easy enough to fold into a neat square.",
      "Sold only as a set of 6 — at about €6.17 per napkin, this is the better-value option if your table sits more than four."
    ]
  },
  'coaster-set2': {
    name: 'Ikat Coasters — Set of 2', price: 8.99,
    img: 'images/products/coaster/3.jpg', images: ['images/products/coaster/3.jpg','images/products/coaster/1.jpg','images/products/coaster/2.jpg','images/products/coaster/4.jpg'],
    size: '10 × 10 cm · set of 2', material: 'Ikat woven · 100% organic cotton',
    category: 'coaster', printType: 'ikat', rooms: ['dining'], favRank: 24,
    mini: "Zero-waste squares, cut from our own fabric offcuts. Sold as a set of 2, about €4.50 each.",
    desc: [
      "Every coaster is cut from fabric offcuts that would otherwise end up as waste — so alongside your morning chai, you are also keeping good cloth out of a landfill. Zero waste, and quietly rather lovely under a cup.",
      "They sit well under a glass or your favourite ceramic mug, and being 100% organic cotton, they wash easily and dry fast.",
      "Sold only as a set of 2 (about €4.50 each) — need more on the table? The Set of 4 works out to about €3.25 a coaster."
    ]
  },
  'coaster-set4': {
    name: 'Ikat Coasters — Set of 4', price: 12.99,
    img: 'images/products/coaster/4.jpg', images: ['images/products/coaster/4.jpg','images/products/coaster/1.jpg','images/products/coaster/2.jpg','images/products/coaster/3.jpg'],
    size: '10 × 10 cm · set of 4', material: 'Ikat woven · 100% organic cotton',
    category: 'coaster', printType: 'ikat', rooms: ['dining'], favRank: 25,
    mini: "Zero-waste squares, cut from our own fabric offcuts. Sold as a set of 4, about €3.25 each — our best per-coaster price.",
    desc: [
      "Every coaster is cut from fabric offcuts that would otherwise end up as waste — so alongside your morning chai, you are also keeping good cloth out of a landfill. Zero waste, and quietly rather lovely under a cup.",
      "They sit well under a glass or your favourite ceramic mug, and being 100% organic cotton, they wash easily and dry fast.",
      "Sold only as a set of 4 — at about €3.25 each, that's €4.99 less than buying two Sets of 2."
    ]
  },

  /* Everyday Tote Bag — one product, 4 variants sharing GHAR_STOCK_GROUPS.totebag
     (a combined pool of 3, since that is the true physical stock — see cart.js
     top and CLAUDE.md). Each variant is still its own id so it behaves like any
     other product in the cart/checkout — the variant name alone is what tells
     Dimple which physical bag was ordered. */
  'totebag-h-same': {
    name: 'Everyday Tote Bag — Horizontal, Same-colour Strap', price: 32.99,
    img: 'images/products/totebag/8.jpg', demo: 'images/products/totebag/demo-embed.html',
    images: ['images/products/totebag/8.jpg','images/products/totebag/1.jpg','images/products/totebag/2.jpg','images/products/totebag/3.jpg','images/products/totebag/4.jpg','images/products/totebag/5.jpg','images/products/totebag/6.jpg','images/products/totebag/7.jpg','images/products/totebag/9.jpg','images/products/totebag/10.jpg'],
    videos: ['images/products/totebag/video1.mp4','images/products/totebag/video2.mp4'],
    size: '52 × 36 × 10 cm · 35 cm strap (same colour)', material: 'Ikat woven · 100% organic cotton',
    category: 'tote-bag', printType: 'ikat', rooms: [], favRank: 30,
    variantGroup: 'totebag', variantLabel: 'Horizontal · Same-colour strap', mini: "3 deep pockets, a bottle holder, and room for absolutely everything.",
    desc: null // shared GHAR_TOTE_DESC below
  },
  'totebag-h-contrast': {
    name: 'Everyday Tote Bag — Horizontal, Contrast Strap (White)', price: 32.99,
    img: 'images/products/totebag/8.jpg', demo: 'images/products/totebag/demo-embed.html',
    images: ['images/products/totebag/8.jpg','images/products/totebag/1.jpg','images/products/totebag/2.jpg','images/products/totebag/3.jpg','images/products/totebag/4.jpg','images/products/totebag/5.jpg','images/products/totebag/6.jpg','images/products/totebag/7.jpg','images/products/totebag/9.jpg','images/products/totebag/10.jpg'],
    videos: ['images/products/totebag/video1.mp4','images/products/totebag/video2.mp4'],
    size: '52 × 36 × 10 cm · 35 cm white contrast strap', material: 'Ikat woven · 100% organic cotton',
    category: 'tote-bag', printType: 'ikat', rooms: [], favRank: 31,
    variantGroup: 'totebag', variantLabel: 'Horizontal · Contrast strap (white)', mini: "3 deep pockets, a bottle holder, and room for absolutely everything.",
    desc: null
  },
  'totebag-v-same': {
    name: 'Everyday Tote Bag — Vertical, Same-colour Strap', price: 32.99,
    img: 'images/products/totebag/8.jpg', demo: 'images/products/totebag/demo-embed.html',
    images: ['images/products/totebag/8.jpg','images/products/totebag/1.jpg','images/products/totebag/2.jpg','images/products/totebag/3.jpg','images/products/totebag/4.jpg','images/products/totebag/5.jpg','images/products/totebag/6.jpg','images/products/totebag/7.jpg','images/products/totebag/9.jpg','images/products/totebag/10.jpg'],
    videos: ['images/products/totebag/video1.mp4','images/products/totebag/video2.mp4'],
    size: '40 × 42 × 10 cm · 35 cm strap (same colour)', material: 'Ikat woven · 100% organic cotton',
    category: 'tote-bag', printType: 'ikat', rooms: [], favRank: 32,
    variantGroup: 'totebag', variantLabel: 'Vertical · Same-colour strap', mini: "3 deep pockets, a bottle holder, and room for absolutely everything.",
    desc: null
  },
  'totebag-v-contrast': {
    name: 'Everyday Tote Bag — Vertical, Contrast Strap (White)', price: 32.99,
    img: 'images/products/totebag/8.jpg', demo: 'images/products/totebag/demo-embed.html',
    images: ['images/products/totebag/8.jpg','images/products/totebag/1.jpg','images/products/totebag/2.jpg','images/products/totebag/3.jpg','images/products/totebag/4.jpg','images/products/totebag/5.jpg','images/products/totebag/6.jpg','images/products/totebag/7.jpg','images/products/totebag/9.jpg','images/products/totebag/10.jpg'],
    videos: ['images/products/totebag/video1.mp4','images/products/totebag/video2.mp4'],
    size: '40 × 42 × 10 cm · 35 cm white contrast strap', material: 'Ikat woven · 100% organic cotton',
    category: 'tote-bag', printType: 'ikat', rooms: [], favRank: 33,
    variantGroup: 'totebag', variantLabel: 'Vertical · Contrast strap (white)', mini: "3 deep pockets, a bottle holder, and room for absolutely everything.",
    desc: null
  }
};

/* Shared description for every Everyday Tote Bag variant (assigned after the
   object literal since it needs to reference itself — keeps the four entries
   above from repeating this in full). "Ghar" is Hindi for "home". */
const GHAR_TOTE_DESC = [
  "These are meant to carry your Ghar (home) with you — but they are built to carry rather more than that. Not a basic tote: there are three deep pockets, a compartment sized for a laptop, books, or a change of gym clothes, and a bottle holder generous enough for a water bottle on a hot day or a bottle of wine on the way to a friend's.",
  "Take it to the beach, the office, the gym, or just the supermarket — it is cut for all of it. We have kept the strap long enough to sling across your body on a bike, and added a front pocket for whatever you reach for without looking: earphones, mints, your phone for a quick photo. Inside, two more deep pockets mean your smaller things stop sliding around at the bottom.",
  "We hear from customers who take theirs to the gym and use the compartments to keep before-and-after workout clothes apart — that is the kind of everyday tote this is meant to be. And since it is 100% organic cotton, the whole thing goes straight into the wash, then hangs dry and comes back looking new.",
  "Available in four fits — horizontal or vertical, with the strap either matching the body or in white for contrast — choose whichever feels most like you."
];
GHAR_STOCK_GROUPS.totebag.ids.forEach(function (id) { GHAR_PRODUCTS[id].desc = GHAR_TOTE_DESC; });

/* ── money formatting ── */
function gharFmt(n) { return '€' + (Math.round(n * 100) / 100).toFixed(2); }

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
  try { return JSON.parse(localStorage.getItem('gharCart')) || {}; }
  catch (e) { return {}; }
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
function gharTotals() {
  const sub = Math.round(gharCartTotal() * 100) / 100;
  const promo = gharPromoStored() && sub >= GHAR_PROMO_MIN;
  const discount = promo ? Math.round(sub * GHAR_PROMO_RATE * 100) / 100 : 0;
  const shipping = sub === 0 ? 0 : (sub >= GHAR_FREE_SHIP_MIN ? 0 : GHAR_SHIPPING);
  const total = Math.round((sub - discount + shipping) * 100) / 100;
  return { sub: sub, discount: discount, shipping: shipping, total: total, promo: promo };
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
function gharRemaining(id) {
  return (gharStock && (id in gharStock)) ? gharStock[id] : Infinity;
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
function gharEffectiveRemaining(id) {
  const group = gharGroupOf(id);
  if (!group) return gharRemaining(id);
  const cart = gharCart();
  const inCart = group.ids.reduce(function (sum, gid) { return sum + (gid === id ? 0 : (cart[gid] || 0)); }, 0);
  return Math.min(gharRemaining(id), Math.max(0, group.limit - inCart));
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
    const m = (btn.getAttribute('onclick') || '').match(/gharAdd\('([a-z]+)'/);
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
  if (!GHAR_PRODUCTS[id]) return;
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
  const group = p.variantGroup ? GHAR_STOCK_GROUPS[p.variantGroup] : null;
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
        '</div>' +
        thumbs +
        '<p class="pm-zoomhint" id="pm-zoomhint" style="' + (firstIsImg ? '' : 'visibility:hidden') + '">Click the photo to zoom</p>' +
      '</div>' +
      '<div class="pm-info">' +
        '<p class="s-tag">' + (p.printType === 'ikat' ? 'Ikat collection' : 'The collection') + '</p>' +
        '<h3>' + p.name + '</h3>' +
        variantPicker +
        '<p class="pm-size" id="pm-variant-size">' + p.size + ' · ' + p.material + '</p>' +
        '<p class="pm-price price">' + gharFmt(p.price) + '</p>' +
        (gharBulkNote(id) ? '<p class="pm-bulk">' + gharBulkNote(id) + '</p>' : '') +
        '<div class="pm-desc">' + p.desc.map(function (d) { return '<p>' + d + '</p>'; }).join('') + '</div>' +
        '<button class="btn-add pm-add" onclick="gharAdd(\'' + id + '\', this)">Add to bag</button>' +
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
  // thumbnails — swap pm-main's content between photo, video and demo as needed
  document.querySelectorAll('.pm-thumbs > img, .pm-thumbs > video, .pm-thumbs > .pm-thumb-demo').forEach(function (t) {
    t.addEventListener('click', function () {
      const m = media[Number(t.dataset.i)];
      main.innerHTML = gharMediaHtml(m);
      main.style.cursor = m.type === 'img' ? 'zoom-in' : 'default';
      const hint = document.getElementById('pm-zoomhint');
      if (hint) hint.style.visibility = m.type === 'img' ? 'visible' : 'hidden';
      document.querySelectorAll('.pm-thumbs > img, .pm-thumbs > video, .pm-thumbs > .pm-thumb-demo').forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
    });
  });
  // variant picker (Everyday Tote Bag, etc.) — switches which id "Add to bag" targets
  document.querySelectorAll('.pm-variant').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const vid = btn.dataset.id;
      const vp = GHAR_PRODUCTS[vid];
      document.querySelectorAll('.pm-variant').forEach(function (b) { b.classList.toggle('active', b === btn); });
      document.getElementById('pm-variant-size').textContent = vp.size + ' · ' + vp.material;
      const addBtn2 = document.querySelector('.pm-add');
      addBtn2.setAttribute('onclick', "gharAdd('" + vid + "', this)");
      const left2 = gharEffectiveRemaining(vid);
      addBtn2.disabled = left2 <= 0;
      addBtn2.textContent = left2 <= 0 ? 'Sold out' : 'Add to bag';
    });
  });
  // stock state on the modal button
  const addBtn = document.querySelector('.pm-add');
  if (gharEffectiveRemaining(id) <= 0 && addBtn) { addBtn.disabled = true; addBtn.textContent = 'Sold out'; }
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

/* ── init ── */
function gharInit() {
  gharUpdateBadge();
  gharBurger();
  gharWireSite();
  if (document.querySelector('.btn-add') || document.getElementById('cart-items')) {
    gharLoadStock(function () {
      if (typeof renderCart === 'function') renderCart();
    });
  }
}
if (document.readyState !== 'loading') gharInit();
else document.addEventListener('DOMContentLoaded', gharInit);
window.addEventListener('pageshow', gharUpdateBadge); // covers back/forward cache restores
