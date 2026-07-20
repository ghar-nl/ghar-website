/* ── GHAR CART — shared across all pages ─────────────────────
   Cart lives in localStorage under "gharCart" as {productId: qty}.
   Include with: <script src="cart.js" defer></script>              */

const GHAR_API = 'https://script.google.com/macros/s/AKfycbwPyxknSnMjppLX_leBgCdiEBlrzqYHj98iEMJHjgbmeNtes_BQjEHx3Pa51t-MuOEdDw/exec';
const GHAR_SECRET = '47d80edaf79922927989f72c'; // must match Apps Script

const GHAR_SHIPPING = 5;            // € flat shipping
const GHAR_FREE_SHIP_MIN = 50;      // € free shipping threshold
const GHAR_PROMO_CODE = 'GHARPREORDER20';
const GHAR_PROMO_RATE = 0.20;       // 20% off
const GHAR_PROMO_MIN = 50;          // on orders above €50
const GHAR_LOW_STOCK = 5;           // "last few pieces" threshold
const GHAR_MAX_PER_ORDER = 6;       // max cushions per person/order

const GHAR_DESC_SHARED = [
  "The border is block printed separately and finished with contrasting piping — it strengthens every edge and gives the cover its clean, tailored line.",
  "The zip sits hidden at the centre of the back panel — never running end to end — so it stays strong for years and never works loose.",
  "Slip in a thick insert for a full, plump look, or a thinner one for a relaxed, lived-in fold. We love it beside plain covers — but it's your home: play."
];

const GHAR_PRODUCTS = {
  marigold: {
    name: 'Marigold Garden Cushion Cover', price: 27.99,
    img: 'images/product4.jpeg', images: ['images/product4.jpeg'],
    size: '30 × 30 cm',
    material: 'Hand block printed · 100% pure cotton',
    desc: [
      "Drawn from Rajasthani floral folklore, this pattern took five hand-carved teak blocks to build — one for every colour. Each bloom is pressed by hand, so no two covers are ever identical. That is the point."
    ].concat(GHAR_DESC_SHARED)
  },
  rivervine: {
    name: 'River Vine Cushion Cover', price: 27.99,
    img: 'images/product3.jpeg', images: ['images/product3.jpeg'],
    size: '30 × 30 cm',
    material: 'Hand block printed · 100% pure cotton',
    desc: [
      "A winding vine in river blues, inspired by the leaf-and-water motifs of Indian block printing. Each colour comes from its own hand-carved teak block, pressed one over the other until the pattern flows."
    ].concat(GHAR_DESC_SHARED)
  },
  stone: {
    name: 'Stone Lattice Cushion Cover', price: 27.99,
    img: 'images/product2.jpeg', images: ['images/product2.jpeg'],
    size: '30 × 30 cm',
    material: 'Hand block printed · 100% pure cotton · different print on front & back',
    desc: [
      "One cover, two prints: a graphic lattice on the front and a companion print on the back — two full sets of carved blocks, printed separately and brought together in a single piece. Flip it whenever your room asks for a change."
    ].concat(GHAR_DESC_SHARED)
  },
  forest: {
    name: 'Forest Arabesque Cushion Cover', price: 27.99,
    img: 'images/lifestyle2.jpeg', images: ['images/lifestyle2.jpeg'],
    size: '30 × 30 cm',
    material: 'Hand block printed · 100% pure cotton',
    desc: [
      "Deep greens and indigo in an arabesque that echoes centuries of Indo-Persian pattern-making. Hand-carved blocks, layered colour by colour, on soft pure cotton."
    ].concat(GHAR_DESC_SHARED)
  }
};

/* ── money formatting ── */
function gharFmt(n) { return '€' + (Math.round(n * 100) / 100).toFixed(2); }

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
    return sum + GHAR_PRODUCTS[id].price * cart[id];
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
    const left = gharRemaining(id);
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
  const left = gharRemaining(id);
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

/* ── product detail viewer (shop) ── */
function gharProductModal(id) {
  const p = GHAR_PRODUCTS[id];
  if (!p) return;
  const thumbs = p.images.length > 1
    ? '<div class="pm-thumbs">' + p.images.map(function (src, i) {
        return '<img src="' + src + '" data-i="' + i + '" class="' + (i === 0 ? 'active' : '') + '" alt="">';
      }).join('') + '</div>'
    : '';
  gharModalOpen(
    '<div class="pm-grid">' +
      '<div class="pm-gallery">' +
        '<div class="pm-main" id="pm-main"><img src="' + p.images[0] + '" alt="' + p.name + '"></div>' +
        thumbs +
        '<p class="pm-zoomhint">Click the photo to zoom · more photos coming soon</p>' +
      '</div>' +
      '<div class="pm-info">' +
        '<p class="s-tag">The collection</p>' +
        '<h3>' + p.name + '</h3>' +
        '<p class="pm-size">' + p.size + ' · ' + p.material + '</p>' +
        '<p class="pm-price price">' + gharFmt(p.price) + '</p>' +
        '<div class="pm-desc">' + p.desc.map(function (d) { return '<p>' + d + '</p>'; }).join('') + '</div>' +
        '<button class="btn-add pm-add" onclick="gharAdd(\'' + id + '\', this)">Add to bag</button>' +
      '</div>' +
    '</div>', true
  );
  // zoom: click toggles, mouse position pans
  const main = document.getElementById('pm-main');
  const img = main.querySelector('img');
  main.addEventListener('click', function (e) {
    const zoomed = img.classList.toggle('zoomed');
    if (zoomed) {
      const r = main.getBoundingClientRect();
      img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
    } else {
      img.style.transformOrigin = 'center';
    }
  });
  main.addEventListener('mousemove', function (e) {
    if (!img.classList.contains('zoomed')) return;
    const r = main.getBoundingClientRect();
    img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
  });
  // thumbnails
  document.querySelectorAll('.pm-thumbs img').forEach(function (t) {
    t.addEventListener('click', function () {
      img.classList.remove('zoomed');
      img.src = p.images[Number(t.dataset.i)];
      document.querySelectorAll('.pm-thumbs img').forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
    });
  });
  // stock state on the modal button
  const addBtn = document.querySelector('.pm-add');
  if (gharRemaining(id) <= 0 && addBtn) { addBtn.disabled = true; addBtn.textContent = 'Sold out'; }
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
  // Shipping info / Returns: work-in-progress notice
  document.querySelectorAll('a.ghar-wip').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      const topic = a.textContent.toLowerCase().indexOf('return') !== -1 ? 'returns policy' : 'shipping policy';
      gharModalOpen(
        '<p class="s-tag">' + a.textContent.trim() + '</p>' +
        '<h3>We are still building the website.</h3>' +
        '<p>You will see more information about our ' + topic + ' shortly. Thank you for your patience!</p>'
      );
    });
  });

  // Workshops: coming soon popup
  document.querySelectorAll('a.ghar-workshops').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      gharModalOpen(
        '<div class="ws-art"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
          '<rect x="10" y="70" width="80" height="18" rx="1" fill="rgba(20,54,89,0.05)" stroke="#143659" stroke-width="0.8"/>' +
          '<ellipse cx="50" cy="78" rx="18" ry="5" fill="rgba(192,122,96,0.4)" stroke="rgba(192,122,96,0.7)" stroke-width="0.6"/>' +
          '<rect x="28" y="42" width="44" height="26" rx="1.5" fill="rgba(20,54,89,0.07)" stroke="#143659" stroke-width="1.1"/>' +
          '<circle cx="42" cy="52" r="5" fill="none" stroke="#143659" stroke-width="0.9"/>' +
          '<circle cx="58" cy="52" r="4" fill="none" stroke="#143659" stroke-width="0.9"/>' +
          '<path d="M38 42 L38 20 Q38 15 44 15 L56 15 Q62 15 62 20 L62 42" fill="rgba(20,54,89,0.1)" stroke="#143659" stroke-width="1.1" stroke-linejoin="round"/>' +
          '<line x1="84" y1="30" x2="84" y2="55" stroke="rgba(192,122,96,0.8)" stroke-width="1.2" stroke-linecap="round"/>' +
          '<path d="M80 50 L84 57 L88 50" fill="none" stroke="rgba(192,122,96,0.8)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg></div>' +
        '<p class="s-tag">Workshops</p>' +
        '<h3>Workshops coming soon.</h3>' +
        '<p>Soon you can experience the art of making your own fabric: real hand-carved wooden blocks, trays of colour, and the joy of pressing your very first print. Ink on your fingers, a pattern of your own to take home.</p>' +
        '<p>Keep an eye on this space — or subscribe below and we\'ll tell you the moment dates are out.</p>'
      );
    });
  });

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
