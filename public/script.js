// public/script.js
document.addEventListener("DOMContentLoaded", () => {

  // ──────────────────────────────────────────────────────────────
  //  LAYOUT
  // ──────────────────────────────────────────────────────────────
  const floatingContainer = document.querySelector(".floating-items");
  const topImage          = document.querySelector(".top-image");
  const logo              = document.querySelector(".logo");
  const dishInput         = document.getElementById("dishInput");

  function updateLayout() {
    const ih = topImage.offsetHeight, lh = logo.offsetHeight;
    logo.style.marginTop           = ih + "px";
    floatingContainer.style.top    = (ih + lh + 10) + "px";
    floatingContainer.style.height = (window.innerHeight - ih - lh - 10) + "px";
  }

  window.addEventListener("load", () => {
    const heroImg = document.querySelector(".top-image img");
    if (heroImg.complete) init(); else heroImg.addEventListener("load", init);
  });

  function init() {
    updateLayout();
    createFloatingItems();
    revealFoodCards();
    buildFlashcardDeck();
    loadPlanner();

    document.getElementById("backToSearch")?.addEventListener("click", () => {
      document.querySelector(".recipe-section").classList.add("hidden");
      document.querySelector(".search-area").style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  window.addEventListener("resize", () => { updateLayout(); createFloatingItems(); });

  // ──────────────────────────────────────────────────────────────
  //  FLOATING BACKGROUND ITEMS
  // ──────────────────────────────────────────────────────────────
  const bgImages = [
    "images/1.png","images/2.png","images/3.png","images/4.png",
    "images/6.png","images/7.png","images/8.png","images/9.png",
    "images/10.png","images/11.png","images/12.png","images/13.png",
    "images/14.png","images/15.png","images/16.png"
  ];

  function createFloatingItems() {
    floatingContainer.innerHTML = "";
    const W = window.innerWidth;
    const H = floatingContainer.offsetHeight || window.innerHeight;
    for (let i = 0; i < 50; i++) {
      const img = document.createElement("img");
      img.src   = bgImages[Math.floor(Math.random() * bgImages.length)];
      img.classList.add("float");
      const size = 70 + Math.random() * 80;
      const rot  = Math.random() * 40 - 20;
      img.style.cssText = `left:${Math.random()*(W-size)}px;top:${Math.random()*(H-size)}px;
        width:${size}px;transform:rotate(${rot}deg);
        opacity:${(0.45+Math.random()*0.4).toFixed(2)};will-change:transform`;
      floatingContainer.appendChild(img);
      gsap.to(img, { x: Math.random()*40-20, y: Math.random()*40-20,
        duration: 4+Math.random()*4, yoyo:true, repeat:-1, ease:"sine.inOut" });
      gsap.to(img, { rotate: rot+(Math.random()*16-8),
        duration: 5+Math.random()*4, yoyo:true, repeat:-1, ease:"sine.inOut" });
    }
  }

  window.addEventListener("scroll", () => {
    floatingContainer.style.opacity =
      Math.max(0, Math.min(1, 1-(window.scrollY-100)/500));
  }, { passive: true });

  // ──────────────────────────────────────────────────────────────
  //  FOOD CATEGORY CARDS  — click fills input AND auto-searches
  // ──────────────────────────────────────────────────────────────
  function revealFoodCards() {
    const cards = document.querySelectorAll(".food-card");
    const obs   = new IntersectionObserver((entries, o) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("show"); o.unobserve(e.target); }});
    }, { threshold: 0.3 });
    cards.forEach(c => {
      obs.observe(c);
      c.addEventListener("click", () => {
        dishInput.value = c.dataset.dish;
        searchDish();
      });
    });
  }

  // ──────────────────────────────────────────────────────────────
  //  FLASHCARD DECK — fetches real recipe images from /random
  // ──────────────────────────────────────────────────────────────
  let flashCards   = [];
  let flashIndex   = 0;
  let flashFlipped = false;

  async function buildFlashcardDeck() {
    const container = document.querySelector(".illustration-flashcard");
    if (!container) return;

    // Build new stacked-deck HTML
    container.innerHTML = `
      <div class="fc-deck">
        <div class="fc-stack">
          <div class="fc-card" id="fcCard">
            <div class="fc-front">
              <img id="fcImg" src="" alt="Recipe" />
              <div class="fc-front-label">tap to flip</div>
              <div class="fc-front-info">
                <div id="fcFrontTitle" class="fc-front-title"></div>
                <div class="fc-front-badge">
                  <span id="fcBadgeRating" class="fc-badge-rating" style="display:none"></span>
                  <span id="fcBadgeTime"   class="fc-badge-time"   style="display:none"></span>
                </div>
              </div>
            </div>
            <div class="fc-back">
              <div class="fc-back-content">
                <div id="fcBackNum"  class="fc-back-num"></div>
                <div id="fcTitle"    class="fc-title"></div>
                <div id="fcCuisine" class="fc-cuisine"></div>
                <div class="fc-divider"></div>
                <div id="fcMeta" class="fc-meta"></div>
                <button class="fc-try-btn" id="fcTryBtn">🔍 Search this Recipe</button>
              </div>
            </div>
          </div>
        </div>
        <div class="fc-controls">
          <button class="fc-nav" id="fcPrev">←</button>
          <span   class="fc-counter" id="fcCounter">— / —</span>
          <button class="fc-nav" id="fcNext">→</button>
        </div>
      </div>`;

    // Fetch cards — try /random, fall back to static images
    try {
      const res = await fetch("/random?count=16");
      if (res.ok) {
        const json = await res.json();
        // Filter cards that have a usable image
        flashCards = json.filter(c => c.img && c.img.startsWith("http"));
      }
    } catch {}

    // Fallback: use local flashcard images if server returned nothing useful
    if (!flashCards.length) {
      flashCards = [
        "images/f1.jpg","images/f6.jpg","images/f7.jpg",
        "images/f10.jpg","images/f12.jpg","images/f13.jpg",
        "images/f14.jpg","images/f16.jpg"
      ].map((img, i) => ({ title: `Recipe #${i+1}`, img, cuisine: "", rating: "", time: "" }));
    }

    renderFlashCard();

    // Flip on card click
    document.getElementById("fcCard").addEventListener("click", () => {
      flashFlipped = !flashFlipped;
      document.getElementById("fcCard").classList.toggle("flipped", flashFlipped);
    });

    // Navigate — slide transition
    function navigate(dir) {
      const fcCard = document.getElementById("fcCard");
      flashFlipped = false;
      fcCard.classList.remove("flipped");

      // Slide out
      fcCard.style.transition = "transform 0.2s ease-in, opacity 0.2s ease-in";
      fcCard.style.transform  = `translateX(${dir === 1 ? "-60px" : "60px"}) scale(0.96)`;
      fcCard.style.opacity    = "0";

      setTimeout(() => {
        flashIndex = (flashIndex + dir + flashCards.length) % flashCards.length;
        renderFlashCard();
        // Slide in from opposite side
        fcCard.style.transition = "none";
        fcCard.style.transform  = `translateX(${dir === 1 ? "60px" : "-60px"}) scale(0.96)`;
        fcCard.style.opacity    = "0";
        // Force reflow
        void fcCard.offsetHeight;
        fcCard.style.transition = "transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease-out";
        fcCard.style.transform  = "translateX(0) scale(1)";
        fcCard.style.opacity    = "1";
      }, 200);
    }

    document.getElementById("fcPrev").addEventListener("click", e => { e.stopPropagation(); navigate(-1); });
    document.getElementById("fcNext").addEventListener("click", e => { e.stopPropagation(); navigate(1); });

    document.getElementById("fcTryBtn").addEventListener("click", e => {
      e.stopPropagation();
      const card = flashCards[flashIndex];
      if (card?.title) {
        dishInput.value = card.title;
        document.querySelector(".search-area").scrollIntoView({ behavior: "smooth" });
        setTimeout(() => searchDish(), 300);
      }
    });
  }

  function renderFlashCard() {
    const card = flashCards[flashIndex];
    if (!card) return;

    // Front
    const img = document.getElementById("fcImg");
    img.src     = card.img || "images/f1.jpg";
    img.onerror = () => { img.src = "images/f1.jpg"; };

    document.getElementById("fcFrontTitle").textContent = card.title || "Mystery Recipe";

    const ratingBadge = document.getElementById("fcBadgeRating");
    const timeBadge   = document.getElementById("fcBadgeTime");
    if (card.rating) {
      ratingBadge.textContent     = `★ ${parseFloat(card.rating).toFixed(1)}`;
      ratingBadge.style.display   = "";
    } else { ratingBadge.style.display = "none"; }
    if (card.time) {
      timeBadge.textContent   = `⏱ ${card.time}`;
      timeBadge.style.display = "";
    } else { timeBadge.style.display = "none"; }

    // Back
    document.getElementById("fcBackNum").textContent  = String(flashIndex + 1).padStart(2, "0");
    document.getElementById("fcTitle").textContent    = card.title || "Mystery Recipe";

    const parts = (card.cuisine || "").split("/").filter(Boolean);
    document.getElementById("fcCuisine").textContent  = parts.length ? parts.join(" › ") : "International Cuisine";

    const meta    = document.getElementById("fcMeta");
    const rating  = parseFloat(card.rating) || 0;
    const stars   = rating ? "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating)) : "";
    meta.innerHTML = [
      stars   && `<span class="fc-meta-chip gold">${stars} ${card.rating}</span>`,
      card.time && `<span class="fc-meta-chip">⏱ ${card.time}</span>`,
    ].filter(Boolean).join("") || `<span class="fc-meta-chip">✨ Tap to search</span>`;

    document.getElementById("fcCounter").textContent = `${flashIndex + 1} / ${flashCards.length}`;
  }

  // ──────────────────────────────────────────────────────────────
  //  RECIPE SEARCH
  // ──────────────────────────────────────────────────────────────
  async function searchDish() {
    const dish = dishInput.value.trim();
    if (!dish) { showToast("Please type a dish name 🍽️"); return; }

    const btn = document.querySelector(".search-box button");
    btn.textContent = "Searching…";
    btn.disabled    = true;

    try {
      const res = await fetch("/getRecipe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ dish }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "No recipes found 😢");
        return;
      }

      const data = await res.json();
      if (!data.length) { showToast("No recipes found 😢"); return; }

      data.length === 1 ? showRecipe(data[0]) : showResultPicker(data);

    } catch {
      showToast("Server error — is the server running? 😢");
    } finally {
      btn.textContent = "Find Recipe";
      btn.disabled    = false;
    }
  }

  window.searchDish = searchDish;
  dishInput?.addEventListener("keydown", e => { if (e.key === "Enter") searchDish(); });

  // ──────────────────────────────────────────────────────────────
  //  RESULT PICKER
  // ──────────────────────────────────────────────────────────────
  function showResultPicker(results) {
    const div = document.getElementById("recipeResults");
    div.innerHTML = `<p class="picker-label">Found ${results.length} matches — pick one:</p>`;
    results.forEach(r => {
      const btn = document.createElement("button");
      btn.className = "picker-btn";
      btn.innerHTML = `
        <span class="picker-name">${r.title}</span>
        ${r.rating     ? `<span class="picker-rating">★ ${r.rating}</span>` : ""}
        ${r.total_time ? `<span class="picker-time">⏱ ${r.total_time}</span>` : ""}`;
      btn.onclick = () => { div.innerHTML = ""; showRecipe(r); };
      div.appendChild(btn);
    });
    div.scrollIntoView({ behavior: "smooth" });
  }

  // ──────────────────────────────────────────────────────────────
  //  RECIPE DISPLAY
  // ──────────────────────────────────────────────────────────────
  function showRecipe(data) {
    document.getElementById("recipeResults").innerHTML = "";
    document.querySelector(".search-area").style.display = "none";
    const section = document.querySelector(".recipe-section");
    section.classList.remove("hidden");
    section.scrollIntoView({ behavior: "smooth" });

    const ul = document.getElementById("recipeSteps");
    ul.innerHTML = "";

    function addLi(className, html) {
      const li = document.createElement("li");
      li.className = className;
      li.innerHTML = html;
      ul.appendChild(li);
      return li;
    }

    // Hero image
    if (data.img_src) {
      addLi("recipe-hero-img",
        `<img src="${data.img_src}" alt="${data.title}"
              onerror="this.parentElement.style.display='none'">`);
    }

    // Title
    addLi("recipe-title-item", data.title || "Recipe");

    // Meta chips
    const chips = [
      data.total_time && `<span class="meta-chip">⏱ ${data.total_time}</span>`,
      data.prep_time  && `<span class="meta-chip">🔪 Prep ${data.prep_time}</span>`,
      data.cook_time  && `<span class="meta-chip">🔥 Cook ${data.cook_time}</span>`,
      data.servings   && `<span class="meta-chip">👥 ${data.servings} servings</span>`,
      data.rating     && `<span class="meta-chip meta-chip--rating">★ ${data.rating}</span>`,
    ].filter(Boolean).join("");
    if (chips) addLi("recipe-meta-row", chips);

    // Cuisine breadcrumb
    if (data.cuisine) {
      const parts = data.cuisine.split("/").filter(Boolean);
      addLi("recipe-cuisine-tag",
        parts.map(p => `<span>${p}</span>`).join(" <span class='sep'>›</span> "));
    }

    // Ingredients
    if (data.ingredients?.length) {
      addLi("recipe-section-header", `<span>🛒</span> Ingredients`);
      const grid = addLi("ingredients-grid", "");
      data.ingredients.forEach(ing => {
        const chip = document.createElement("span");
        chip.className   = "ingredient-chip";
        chip.textContent = ing;
        grid.appendChild(chip);
      });
    }

    // Steps
    if (data.steps?.length) {
      addLi("recipe-section-header", `<span>📋</span> Steps`);
      data.steps.forEach((step, i) => {
        addLi("recipe-step",
          `<span class="step-num">${i + 1}</span><span class="step-text">${step}</span>`);
      });
    }

    // Nutrition
    if (data.nutrition) {
      addLi("recipe-section-header", `<span>📊</span> Nutrition`);
      const items = data.nutrition.split(",").map(s => s.trim()).filter(Boolean);
      addLi("nutrition-row", items.map(n => `<span class="nut-chip">${n}</span>`).join(""));
    }

    // Source link
    if (data.url) {
      addLi("recipe-source",
        `<a href="${data.url}" target="_blank" rel="noopener">View original recipe ↗</a>`);
    }

    gsap.from("#recipeSteps > li", {
      y: 18, opacity: 0, stagger: 0.07, duration: 0.5, ease: "power2.out"
    });
  }

  // ──────────────────────────────────────────────────────────────
  //  TOAST — replaces all alert() calls
  // ──────────────────────────────────────────────────────────────
  function showToast(msg) {
    let toast = document.getElementById("cookina-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cookina-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("toast-show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("toast-show"), 3000);
  }

  // ──────────────────────────────────────────────────────────────
  //  PLANNER — server-synced, falls back to localStorage
  //            supports checkboxes + text items
  // ──────────────────────────────────────────────────────────────
  const TYPES = ["made", "todo", "buy"];

  async function savePlanner() {
    const data = {};
    TYPES.forEach(type => {
      data[type] = [...document.querySelectorAll(`#${type} .planner-item`)]
        .map(li => ({
          text:    li.querySelector("input").value.trim(),
          checked: li.querySelector(".planner-check").classList.contains("checked"),
        }))
        .filter(item => item.text);
    });
    localStorage.setItem("plannerData", JSON.stringify(data));
    try {
      await fetch("/planner", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
    } catch { /* server offline — localStorage already saved */ }
  }

  async function loadPlanner() {
    let data = { made: [], todo: [], buy: [] };
    try {
      const res = await fetch("/planner");
      if (res.ok) data = await res.json();
    } catch {
      const stored = localStorage.getItem("plannerData");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          TYPES.forEach(type => {
            if (Array.isArray(parsed[type])) {
              data[type] = parsed[type].map(item =>
                typeof item === "string"
                  ? { text: item, checked: false }
                  : item
              );
            }
          });
        } catch {}
      }
    }
    TYPES.forEach(type => {
      document.getElementById(type).innerHTML = "";
      (data[type] || []).forEach(item => _addItem(type, item.text, item.checked));
    });
  }

  function _addItem(type, value = "", checked = false) {
    const ul  = document.getElementById(type);
    const li  = document.createElement("li");
    li.className = "planner-item";

    const check     = document.createElement("span");
    check.className = "planner-check" + (checked ? " checked" : "");
    check.onclick   = () => {
      check.classList.toggle("checked");
      input.classList.toggle("done");
      savePlanner();
    };

    const input     = document.createElement("input");
    input.value       = value;
    input.placeholder = "Type here…";
    if (checked) input.classList.add("done");
    input.oninput     = savePlanner;

    const del     = document.createElement("span");
    del.textContent = "✕";
    del.className   = "delete-btn";
    del.onclick     = () => { li.remove(); savePlanner(); };

    li.appendChild(check);
    li.appendChild(input);
    li.appendChild(del);
    ul.appendChild(li);
  }

  function addPlannerItem(type) {
    _addItem(type, "", false);
    // Focus the new input
    const ul    = document.getElementById(type);
    const last  = ul.querySelector(".planner-item:last-child input");
    last?.focus();
    savePlanner();
  }

  window.addPlannerItem = addPlannerItem;
});
