/* ── GHAR CART — shared across all pages ─────────────────────
   Cart lives in localStorage under "gharCart" as {productId: qty}.
   Include with: <script src="cart.js" defer></script>              */

const GHAR_API = 'https://script.google.com/macros/s/AKfycbwPyxknSnMjppLX_leBgCdiEBlrzqYHj98iEMJHjgbmeNtes_BQjEHx3Pa51t-MuOEdDw/exec';
const GHAR_SECRET = '47d80edaf79922927989f72c'; // must match Apps Script

const GHAR_SHIPPING = 5;            // € flat shipping
const GHAR_FREE_SHIP_MIN = 50;      // € free shipping threshold
const GHAR_PROMO_CODE = 'GHARPREORDER20';
const GHAR_PROMO_RATE = 0.20;       // 20% off
const GHAR_PROMO_MIN = 50;          // on orders of €50+
const GHAR_LOW_STOCK = 5;           // "last few pieces" threshold

const GHAR_PRODUCTS = {
  marigold:  { name: 'Marigold Garden Cushion Cover',  price: 22, img: 'images/product4.jpeg',  size: '30 × 30 cm' },
  rivervine: { name: 'River Vine Cushion Cover',       price: 22, img: 'images/product3.jpeg',  size: '30 × 30 cm' },
  stone:     { name: 'Stone Lattice Cushion Cover',    price: 22, img: 'images/product2.jpeg',  size: '30 × 30 cm' },
  forest:    { name: 'Forest Arabesque Cushion Cover', price: 22, img: 'images/lifestyle2.jpeg', size: '30 × 30 cm' }
};

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
  const sub = gharCartTotal();
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
function gharModalOpen(html) {
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
  ov.querySelector('#ghar-modal-body').innerHTML = html;
  ov.hidden = false;
}
function gharModalClose() {
  const ov = document.getElementById('ghar-modal');
  if (ov) ov.hidden = true;
}
function gharEmailOk(email) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email); }

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

  // Newsletter subscribe (all "Be the first to know" forms)
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
