/* Hartwood & Co. — shared storefront logic (cart, cards, quick view, toasts) */
(function () {
  const CART_KEY = "hartwood_cart";

  /* ---------- cart storage ---------- */
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }
  function addToCart(id, qty) {
    qty = qty || 1;
    const cart = getCart();
    const line = cart.find((l) => l.id === id);
    if (line) line.qty += qty;
    else cart.push({ id: id, qty: qty });
    saveCart(cart);
    const p = PRODUCTS.find((p) => p.id === id);
    showToast((p ? p.name : "Item") + " added to cart");
  }
  function setQty(id, qty) {
    let cart = getCart();
    if (qty <= 0) {
      cart = cart.filter((l) => l.id !== id);
    } else {
      const line = cart.find((l) => l.id === id);
      if (line) line.qty = qty;
    }
    saveCart(cart);
  }
  function cartCount() {
    return getCart().reduce((n, l) => n + l.qty, 0);
  }
  function updateCartBadge() {
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      const n = cartCount();
      el.textContent = n;
      el.style.display = n > 0 ? "inline-flex" : "none";
    });
  }

  /* ---------- formatting ---------- */
  function money(n) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function stars(rating) {
    let out = "";
    for (let i = 1; i <= 5; i++) {
      out += i <= Math.round(rating) ? "★" : "☆";
    }
    return out;
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function showToast(msg) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  /* ---------- product card ---------- */
  function productCard(p) {
    const badge = p.badge ? `<span class="badge badge-${p.badge.toLowerCase()}">${p.badge}</span>` : "";
    const old = p.oldPrice ? `<s>${money(p.oldPrice)}</s>` : "";
    return `
      <article class="card reveal">
        <div class="card-media">
          <a href="javascript:void(0)" data-qv="${p.id}" aria-label="Quick view ${p.name}">
            <img src="${p.img}" alt="${p.name}" loading="lazy">
          </a>
          ${badge}
          <button class="quickview" data-qv="${p.id}">Quick view</button>
        </div>
        <div class="card-body">
          <span class="card-cat">${p.category}</span>
          <h3 class="card-name">${p.name}</h3>
          <div class="card-rating"><span class="stars">${stars(p.rating)}</span> <span class="reviews">(${p.reviews})</span></div>
          <div class="card-foot">
            <div class="price">${money(p.price)} ${old}</div>
            <button class="btn btn-dark btn-sm" data-add="${p.id}">Add to cart</button>
          </div>
        </div>
      </article>`;
  }

  /* ---------- quick view modal ---------- */
  function ensureModal() {
    let ov = document.querySelector(".modal-overlay");
    if (ov) return ov;
    ov = document.createElement("div");
    ov.className = "modal-overlay";
    ov.innerHTML = `<div class="modal-content" role="dialog" aria-modal="true"></div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click", (e) => {
      if (e.target === ov || e.target.closest("[data-close]")) ov.classList.remove("open");
    });
    return ov;
  }
  function openQuickView(id) {
    const p = PRODUCTS.find((p) => p.id === id);
    if (!p) return;
    const ov = ensureModal();
    const old = p.oldPrice ? `<s>${money(p.oldPrice)}</s>` : "";
    ov.querySelector(".modal-content").innerHTML = `
      <button class="modal-x" data-close aria-label="Close">×</button>
      <img src="${p.img}" alt="${p.name}">
      <div class="modal-info">
        <span class="card-cat">${p.category}</span>
        <h2>${p.name}</h2>
        <div class="card-rating"><span class="stars">${stars(p.rating)}</span> ${p.rating} · ${p.reviews} reviews</div>
        <div class="price modal-price">${money(p.price)} ${old}</div>
        <p>${p.desc}</p>
        <button class="btn btn-primary" data-add="${p.id}">Add to cart</button>
      </div>`;
    ov.classList.add("open");
  }

  /* ---------- global click delegation ---------- */
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      addToCart(add.getAttribute("data-add"), 1);
      return;
    }
    const qv = e.target.closest("[data-qv]");
    if (qv) {
      openQuickView(qv.getAttribute("data-qv"));
    }
  });

  /* ---------- demo forms ---------- */
  document.addEventListener("submit", (e) => {
    const f = e.target;
    if (f.classList.contains("demo-form")) {
      e.preventDefault();
      showToast(f.getAttribute("data-toast") || "Thanks! This is a demo — nothing was sent.");
      f.reset();
    }
  });

  /* ---------- nav ---------- */
  function initNav() {
    const page = document.body.getAttribute("data-page");
    document.querySelectorAll(".nav a[data-nav]").forEach((a) => {
      if (a.getAttribute("data-nav") === page) a.classList.add("active");
    });
    const burger = document.querySelector(".burger");
    const nav = document.querySelector(".nav");
    if (burger && nav) {
      burger.addEventListener("click", () => nav.classList.toggle("open"));
    }
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    updateCartBadge();
    initReveal();
  });

  /* expose for page scripts */
  window.Store = {
    getCart, saveCart, addToCart, setQty, cartCount,
    updateCartBadge, money, stars, showToast, productCard,
  };
})();
