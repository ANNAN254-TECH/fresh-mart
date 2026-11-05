/* ============================================
   FRESHMART SUPERMARKET - SCRIPT.JS
   Shopping Cart, WhatsApp Ordering, Order
   Confirmation and Customer Feedback
   ============================================ */

// 1. STORE SETTINGS

const STORE = {
  name: "FreshMart Supermarket",
  whatsapp: "254118363225", // orders and feedback are sent to this number (254XXXXXXXXX)
  currency: "KSh"
};

const FALLBACK_IMG =
  "https://placehold.co/400x300/e8edf8/1d3f9e?text=FreshMart";

const MAX_QTY = 99;


// 2. PRODUCT DATABASE

const products = [
  { id: 1, name: "Fresh Tomatoes", category: "Vegetables", price: 80, unit: "1 kg", description: "Fresh farm tomatoes", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=500", offer: "Fresh" },
  { id: 2, name: "Irish Potatoes", category: "Vegetables", price: 120, unit: "2 kg", description: "Quality fresh potatoes", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500", offer: "" },
  { id: 3, name: "Fresh Carrots", category: "Vegetables", price: 90, unit: "1 kg", description: "Crunchy fresh carrots", image: "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=500", offer: "" },
  { id: 4, name: "Green Cabbage", category: "Vegetables", price: 70, unit: "1 piece", description: "Fresh green cabbage", image: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500", offer: "" },
  { id: 5, name: "Fresh Bananas", category: "Fruits", price: 100, unit: "1 bunch", description: "Sweet ripe bananas", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500", offer: "Popular" },
  { id: 6, name: "Fresh Apples", category: "Fruits", price: 250, unit: "1 kg", description: "Crispy sweet apples", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500", offer: "" },
  { id: 7, name: "Fresh Oranges", category: "Fruits", price: 150, unit: "1 kg", description: "Juicy fresh oranges", image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=500", offer: "" },
  { id: 8, name: "Fresh Avocados", category: "Fruits", price: 30, unit: "1 piece", description: "Creamy ripe avocados", image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500", offer: "" },
  { id: 9, name: "Fresh Milk", category: "Dairy", price: 65, unit: "500 ml", description: "Fresh everyday milk", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500", offer: "" },
  { id: 10, name: "Farm Fresh Eggs", category: "Dairy", price: 450, unit: "Tray of 30", description: "Fresh farm eggs", image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500", offer: "Popular" },
  { id: 11, name: "White Bread", category: "Bakery", price: 70, unit: "400 g", description: "Soft fresh bread", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500", offer: "" },
  { id: 12, name: "Brown Bread", category: "Bakery", price: 85, unit: "400 g", description: "Fresh wholemeal bread", image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500", offer: "" },
  { id: 13, name: "Premium Rice", category: "Pantry", price: 180, unit: "1 kg", description: "Quality cooking rice", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500", offer: "" },
  { id: 14, name: "Cooking Oil", category: "Pantry", price: 320, unit: "1 litre", description: "Quality vegetable cooking oil", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500", offer: "" },
  { id: 15, name: "Washing Powder", category: "Household", price: 150, unit: "1 kg", description: "Powerful cleaning detergent", image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=500", offer: "" },
  { id: 16, name: "Bathing Soap", category: "Household", price: 60, unit: "1 piece", description: "Gentle everyday soap", image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=500", offer: "" }
];


// 3. STATE

let cart = [];
let activeCategory = "All";
let searchTerm = "";


// 4. HELPERS

const $ = id => document.getElementById(id);

function formatMoney(amount) {
  return STORE.currency + " " + Number(amount).toLocaleString("en-KE");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getProduct(id) {
  return products.find(p => p.id === id);
}

function cartTotal() {
  return cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}

// Safe storage: private mode or blocked storage must not break the shop
function saveCart() {
  try {
    localStorage.setItem("freshmart_cart", JSON.stringify(cart));
  } catch (error) {
    /* ignore */
  }
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("freshmart_cart"));
    if (Array.isArray(saved)) {
      cart = saved
        .filter(item =>
          getProduct(item.id) &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
        )
        .map(item => ({
          id: item.id,
          quantity: Math.min(item.quantity, MAX_QTY)
        }));
    }
  } catch (error) {
    cart = [];
  }
}

// Message shown inside the basket (checkout errors)
function showMessage(message) {
  const msg = $("msg");
  if (msg) msg.textContent = message;
}

// Small popup that is visible even when the basket is closed
let toastTimer;

function showToast(message) {
  let toast = $("fm-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "fm-toast";
    toast.setAttribute("role", "status");
    toast.style.cssText =
      "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);" +
      "background:#0b1f55;color:#fff;padding:12px 20px;border-radius:999px;" +
      "font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.25);z-index:9999;" +
      "opacity:0;transition:opacity .25s;pointer-events:none;max-width:90vw;" +
      "text-align:center";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = "1";

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}


// 5. CATEGORIES

function displayCategories() {
  const cats = $("cats");
  if (!cats) return;

  const categories = ["All", ...new Set(products.map(p => p.category))];

  cats.innerHTML = categories.map(category => `
    <button
      type="button"
      class="${activeCategory === category ? "active" : ""}"
      data-category="${escapeHTML(category)}"
    >${escapeHTML(category)}</button>
  `).join("");
}


// 6. PRODUCTS

function displayProducts() {
  const grid = $("grid");
  if (!grid) return;

  const filtered = products.filter(product => {
    const categoryMatch =
      activeCategory === "All" || product.category === activeCategory;

    const searchMatch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm);

    return categoryMatch && searchMatch;
  });

  const info = $("resultInfo");
  if (info) {
    info.textContent =
      filtered.length === 1
        ? "1 product available"
        : `${filtered.length} products available`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px">
        <h3>No products found</h3>
        <p>Try another search.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const item = cart.find(p => p.id === product.id);

    return `
      <article class="product-card">
        <div class="product-image">
          <img
            src="${escapeHTML(product.image)}"
            alt="${escapeHTML(product.name)}"
            loading="lazy"
            data-fallback
          >
          ${product.offer ? `
            <span class="product-badge">${escapeHTML(product.offer)}</span>
          ` : ""}
        </div>

        <div class="product-content">
          <small class="product-category">${escapeHTML(product.category)}</small>
          <h3>${escapeHTML(product.name)}</h3>
          <p>${escapeHTML(product.description)}</p>

          <div class="product-bottom">
            <div>
              <strong>${formatMoney(product.price)}</strong>
              <small>${escapeHTML(product.unit)}</small>
            </div>

            <button type="button" class="add-btn" data-add="${product.id}">
              ${item ? "Added (" + item.quantity + ")" : "Add +"}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}


// 7. PROMOTIONAL OFFERS (click a tile to search for those products)

function displayOffers() {
  const tiles = $("offerTiles");
  if (!tiles) return;

  const offers = [
    {
      title: "Fresh Fruits",
      subtitle: "Quality fruits every day",
      q: "fruit",
      image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500"
    },
    {
      title: "Fresh Vegetables",
      subtitle: "Straight from the farm",
      q: "vegetable",
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500"
    }
  ];

  tiles.innerHTML = offers.map(offer => `
    <div class="offer-card" data-q="${escapeHTML(offer.q)}"
      style="background-color:#1d3f9e;background-size:cover;background-position:center;background-image:linear-gradient(0deg,rgba(0,0,0,.7),transparent),url('${escapeHTML(offer.image)}')">
      <div class="offer-content">
        <h3>${escapeHTML(offer.title)}</h3>
        <p>${escapeHTML(offer.subtitle)}</p>
      </div>
    </div>
  `).join("");
}

$("offerTiles")?.addEventListener("click", event => {
  const tile = event.target.closest("[data-q]");
  if (!tile) return;

  const search = $("q");
  if (search) search.value = tile.dataset.q;

  applySearch(tile.dataset.q);
  $("shop")?.scrollIntoView({ behavior: "smooth" });
});


// 8. BASKET LOGIC

function addToCart(id) {
  const product = getProduct(id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);

  if (existing) {
    if (existing.quantity >= MAX_QTY) {
      showToast("Maximum quantity reached for " + product.name + ".");
      return;
    }
    existing.quantity++;
  } else {
    cart.push({ id: id, quantity: 1 });
  }

  updateCart();
  showToast(product.name + " added to basket.");
}

function changeQuantity(id, amount) {
  const item = cart.find(p => p.id === id);
  if (!item) return;

  item.quantity = Math.min(item.quantity + amount, MAX_QTY);

  if (item.quantity <= 0) {
    cart = cart.filter(p => p.id !== id);
  }

  updateCart();
}

function updateCart() {
  saveCart();

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const countEl = $("count");
  const totalEl = $("total");

  if (countEl) countEl.textContent = count;
  if (totalEl) totalEl.textContent = formatMoney(cartTotal());

  displayCart();
  displayProducts();
}

function displayCart() {
  const lines = $("lines");
  if (!lines) return;

  if (cart.length === 0) {
    lines.innerHTML = `
      <div class="empty-cart">
        <div style="font-size:45px">🛒</div>
        <h3>Your basket is empty</h3>
        <p>Add products to start shopping.</p>
      </div>
    `;
    return;
  }

  lines.innerHTML = cart.map(item => {
    const product = getProduct(item.id);
    if (!product) return "";

    return `
      <div class="cart-item">
        <img
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}"
          data-fallback
        >

        <div class="cart-details">
          <h4>${escapeHTML(product.name)}</h4>
          <p>${formatMoney(product.price)}</p>

          <div class="quantity-controls">
            <button type="button" data-id="${product.id}" data-change="-1" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-id="${product.id}" data-change="1" aria-label="Increase quantity">+</button>
          </div>
        </div>

        <strong>${formatMoney(product.price * item.quantity)}</strong>
      </div>
    `;
  }).join("");
}


// 9. OPEN / CLOSE BASKET

const drawer = $("drawer");
const scrim = $("scrim");

function openBasket() {
  if (!drawer || !scrim) return;
  drawer.classList.add("open");
  scrim.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeBasket() {
  if (!drawer || !scrim) return;
  drawer.classList.remove("open");
  scrim.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

$("openCart")?.addEventListener("click", openBasket);
$("closeCart")?.addEventListener("click", closeBasket);
scrim?.addEventListener("click", closeBasket);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeOrderModal();
    closeBasket();
  }
});


// 10. EVENT DELEGATION (one listener each, survives re-rendering)

$("cats")?.addEventListener("click", event => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;

  activeCategory = button.dataset.category;
  displayCategories();
  displayProducts();
});

$("grid")?.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (!button) return;

  addToCart(Number(button.dataset.add));
});

$("lines")?.addEventListener("click", event => {
  const button = event.target.closest("[data-change]");
  if (!button) return;

  changeQuantity(Number(button.dataset.id), Number(button.dataset.change));
});

// Image fallback for product and basket images
document.addEventListener("error", event => {
  const img = event.target;

  if (img.tagName === "IMG" && img.hasAttribute("data-fallback") && img.src !== FALLBACK_IMG) {
    img.src = FALLBACK_IMG;
  }
}, true);


// 11. SEARCH

function applySearch(value) {
  searchTerm = value.trim().toLowerCase();

  if (searchTerm) activeCategory = "All";

  displayCategories();
  displayProducts();
}

$("searchForm")?.addEventListener("submit", event => {
  event.preventDefault();

  applySearch($("q")?.value || "");

  $("shop")?.scrollIntoView({ behavior: "smooth" });
});

$("q")?.addEventListener("input", event => {
  applySearch(event.target.value);
});


// 12. PICKUP / DELIVERY (address shows "Not applicable" for pickup)

const mode = $("cMode");
const address = $("cAddr");

function syncDeliveryMode() {
  if (!mode || !address) return;

  const isDelivery = mode.value === "Delivery";

  address.style.display = "block";
  address.disabled = !isDelivery;
  address.required = isDelivery;
  address.value = isDelivery ? "" : "Not applicable";
}

mode?.addEventListener("change", syncDeliveryMode);


// 13. WHATSAPP ORDER CHECKOUT

$("orderBtn")?.addEventListener("click", () => {
  const name = $("cName")?.value.trim() || "";
  const phone = $("cPhone")?.value.trim() || "";
  const deliveryType = mode ? mode.value : "Pickup";
  const deliveryAddress = address ? address.value.trim() : "";

  if (cart.length === 0) {
    showMessage("Your basket is empty. Add products first.");
    return;
  }

  if (!name || !phone) {
    showMessage("Please enter your name and phone number.");
    return;
  }

  if (!/^[+0-9\s()-]{7,20}$/.test(phone)) {
    showMessage("Please enter a valid phone number.");
    return;
  }

  if (deliveryType === "Delivery" && !deliveryAddress) {
    showMessage("Please enter your delivery address.");
    address?.focus();
    return;
  }

  if (!/^254\d{9}$/.test(STORE.whatsapp)) {
    showMessage("Please configure your WhatsApp number in script.js.");
    return;
  }

  showMessage("");

  const lines = [
    "*NEW ORDER - " + STORE.name.toUpperCase() + "*",
    "",
    "Customer: " + name,
    "Phone: " + phone,
    "Order type: " + deliveryType,
    "Address: " + (deliveryType === "Delivery" ? deliveryAddress : "Not applicable"),
    "",
    "*ORDER DETAILS*"
  ];

  cart.forEach(item => {
    const product = getProduct(item.id);
    if (!product) return;

    lines.push(
      "",
      product.name + " (" + product.unit + ")",
      "Quantity: " + item.quantity,
      "Subtotal: " + formatMoney(product.price * item.quantity)
    );
  });

  const total = cartTotal();

  lines.push(
    "",
    "-----------------------",
    "TOTAL: " + formatMoney(total),
    "-----------------------",
    "",
    "Please confirm my order.",
    "",
    "Thank you!"
  );

  const whatsappURL =
    "https://wa.me/" + STORE.whatsapp +
    "?text=" + encodeURIComponent(lines.join("\n"));

  const opened = window.open(whatsappURL, "_blank");

  // Popup blocked? Fall back to the same tab
  if (!opened) {
    window.location.href = whatsappURL;
    return;
  }

  // Clear the basket, then show the confirmation and feedback window
  cart = [];
  updateCart();
  closeBasket();

  showOrderComplete({
    name: name,
    phone: phone,
    type: deliveryType,
    total: total
  });
});


// 14. ORDER CONFIRMATION + CUSTOMER FEEDBACK

const RATING_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

function closeOrderModal() {
  const modal = $("fm-modal");
  if (!modal) return;

  modal.remove();
  document.body.style.overflow = "";
}

function showOrderComplete(order) {
  closeOrderModal();

  const firstName = escapeHTML(order.name.split(/\s+/)[0]);
  const paymentLine =
    order.type === "Delivery"
      ? "Pay when your order arrives."
      : "Pay when you collect your order.";

  const modal = document.createElement("div");
  modal.id = "fm-modal";
  modal.className = "fm-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "fm-modal-title");

  modal.innerHTML = `
    <div class="fm-modal-box">
      <div class="fm-check" aria-hidden="true">✓</div>
      <h2 id="fm-modal-title">Thank you, ${firstName}!</h2>
      <p class="fm-lead">
        Your ${escapeHTML(order.type.toLowerCase())} order of
        <b>${formatMoney(order.total)}</b> is ready in WhatsApp.
      </p>

      <ol class="fm-steps">
        <li><b>Press Send</b> in WhatsApp so we receive your order.</li>
        <li>We will call you to <b>confirm</b> it.</li>
        <li>${paymentLine}</li>
      </ol>

      <div class="fm-feedback" id="fm-feedback">
        <h3>How was your ordering experience?</h3>

        <div class="fm-stars" id="fm-stars" role="radiogroup" aria-label="Rating">
          ${[1, 2, 3, 4, 5].map(n => `
            <button type="button" data-star="${n}" role="radio" aria-checked="false"
              aria-label="${n} star${n > 1 ? "s" : ""}">★</button>
          `).join("")}
        </div>
        <div class="fm-rating-label" id="fm-rating-label"></div>

        <textarea id="fm-comment" rows="3" maxlength="500"
          placeholder="Tell us how we can serve you better (optional)"
          aria-label="Your comments"></textarea>

        <p class="fm-error" id="fm-error" role="alert"></p>

        <div class="fm-actions">
          <button type="button" class="fm-primary" id="fm-send">Send feedback</button>
          <button type="button" class="fm-ghost" id="fm-skip">Skip</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  let rating = 0;

  const stars = modal.querySelectorAll("[data-star]");
  const label = $("fm-rating-label");
  const errorEl = $("fm-error");

  function paintStars() {
    stars.forEach(star => {
      const value = Number(star.dataset.star);
      star.classList.toggle("on", value <= rating);
      star.setAttribute("aria-checked", String(value === rating));
    });
    label.textContent = rating ? RATING_LABELS[rating - 1] : "";
  }

  stars.forEach(star => {
    star.addEventListener("click", () => {
      rating = Number(star.dataset.star);
      errorEl.textContent = "";
      paintStars();
    });
  });

  // Click outside the window closes it
  modal.addEventListener("click", event => {
    if (event.target === modal) closeOrderModal();
  });

  $("fm-skip").addEventListener("click", closeOrderModal);

  $("fm-send").addEventListener("click", () => {
    if (!rating) {
      errorEl.textContent = "Please choose a star rating first.";
      return;
    }

    const comment = $("fm-comment").value.trim();

    const feedbackLines = [
      "*CUSTOMER FEEDBACK - " + STORE.name.toUpperCase() + "*",
      "",
      "Customer: " + order.name,
      "Phone: " + order.phone,
      "Order type: " + order.type,
      "Order total: " + formatMoney(order.total),
      "",
      "Rating: " + rating + "/5 (" + RATING_LABELS[rating - 1] + ")",
      "Comments: " + (comment || "None")
    ];

    const feedbackURL =
      "https://wa.me/" + STORE.whatsapp +
      "?text=" + encodeURIComponent(feedbackLines.join("\n"));

    window.open(feedbackURL, "_blank");

    $("fm-feedback").innerHTML = `
      <div class="fm-done">
        <h3>Thank you for your feedback!</h3>
        <p>Press Send in WhatsApp to deliver it to us. We value every comment.</p>
        <button type="button" class="fm-primary" id="fm-close" style="width:100%">Close</button>
      </div>
    `;

    $("fm-close").addEventListener("click", closeOrderModal);
  });
}


// 15. COPYRIGHT YEAR

const yearEl = $("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();


// 16. START WEBSITE

function startFreshMart() {
  loadCart();
  syncDeliveryMode();
  displayCategories();
  displayOffers();
  updateCart(); // also renders products
}

startFreshMart();