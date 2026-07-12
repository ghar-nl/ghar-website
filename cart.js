/* ── GHAR CART — shared across all pages ─────────────────────
   Cart lives in localStorage under "gharCart" as {productId: qty}.
   Include with: <script src="cart.js" defer></script>              */

const GHAR_PRODUCTS = {
  marigold:  { name: 'Marigold Garden Cushion Cover',  price: 22, img: 'images/product4.jpeg',  size: '30 × 30 cm' },
  rivervine: { name: 'River Vine Cushion Cover',       price: 22, img: 'images/product3.jpeg',  size: '30 × 30 cm' },
  stone:     { name: 'Stone Lattice Cushion Cover',    price: 22, img: 'images/product2.jpeg',  size: '30 × 30 cm' },
  forest:    { name: 'Forest Arabesque Cushion Cover', price: 22, img: 'images/lifestyle2.jpeg', size: '30 × 30 cm' }
};

function gharCart() {
  try { return JSON.parse(localStorage.getItem('gharCart')) || {}; }
  catch (e) { return {}; }
}

function gharSaveCart(cart) {
  // Drop zero/negative quantities and unknown products
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

function gharUpdateBadge() {
  const el = document.getElementById('nav-bag');
  if (!el) return;
  const n = gharCartCount();
  el.textContent = n > 0 ? 'Bag · ' + n : 'Bag';
}

/* Called by "Add to bag" buttons: gharAdd('marigold', this) */
function gharAdd(id, btn) {
  if (!GHAR_PRODUCTS[id]) return;
  const cart = gharCart();
  cart[id] = (cart[id] || 0) + 1;
  gharSaveCart(cart);
  if (btn) {
    const original = btn.textContent;
    btn.textContent = 'Added ✓';
    btn.disabled = true;
    setTimeout(function () { btn.textContent = original; btn.disabled = false; }, 1200);
  }
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

if (document.readyState !== 'loading') gharUpdateBadge();
else document.addEventListener('DOMContentLoaded', gharUpdateBadge);
window.addEventListener('pageshow', gharUpdateBadge); // covers back/forward cache restores
