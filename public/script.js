// public/script.js
document.addEventListener("DOMContentLoaded", () => {

  // -------------------- FLOATING ITEMS & HERO LOGO --------------------
  const floatingContainer = document.querySelector(".floating-items");
  const topImage = document.querySelector(".top-image");
  const logo = document.querySelector(".logo");
  const dishInput = document.getElementById("dishInput");
  const feedbackDiv = document.getElementById("searchFeedback");
  const recipeResultsDiv = document.getElementById("recipeResults");

  function updateLayout() {
    const imageHeight = topImage.offsetHeight;
    const logoHeight = logo.offsetHeight;
    logo.style.marginTop = imageHeight + "px";
    floatingContainer.style.top = imageHeight + logoHeight + 10 + "px";
    floatingContainer.style.height = window.innerHeight - imageHeight - logoHeight - 10 + "px";
  }

  window.addEventListener("load", () => {
    const heroImg = document.querySelector(".top-image img");
    if (heroImg.complete) initializeLayout();
    else heroImg.addEventListener("load", initializeLayout);
  });

  function initializeLayout() {
    updateLayout();
    createFloatingItems();
    revealFoodCards();
    startFlashcards();
    loadPlanner();

    const backBtn = document.getElementById("backToSearch");
    if (backBtn) backBtn.addEventListener("click", () => {
      document.querySelector(".recipe-section").classList.add("hidden");
      document.querySelector(".search-area").style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  window.addEventListener("resize", () => {
    updateLayout();
    createFloatingItems();
  });

  // -------------------- FLOATING ITEMS --------------------
  const images = ["images/1.png","images/2.png","images/3.png","images/4.png","images/6.png","images/7.png","images/8.png","images/9.png","images/10.png","images/11.png","images/12.png","images/13.png","images/14.png","images/15.png","images/16.png"];
  const cols = 10, rows = 6, padding = 10, itemSize = 180;

  function createFloatingItems() {
    floatingContainer.innerHTML = "";
    const cellWidth = window.innerWidth / cols;
    const cellHeight = floatingContainer.offsetHeight / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const img = document.createElement("img");
        img.src = images[Math.floor(Math.random() * images.length)];
        img.classList.add("float");
        const x = col * cellWidth + padding + Math.random() * (cellWidth - 2 * padding - itemSize);
        const y = row * cellHeight + padding + Math.random() * (cellHeight - 2 * padding - itemSize);
        img.style.left = x + "px";
        img.style.top = y + "px";
        img.style.width = itemSize + "px";
        floatingContainer.appendChild(img);
        gsap.to(img, { x: "+=" + (Math.random() * 50 - 25), y: "+=" + (Math.random() * 50 - 25), duration: 3 + Math.random() * 3, yoyo: true, repeat: -1, ease: "sine.inOut" });
        gsap.to(img, { rotate: Math.random() * 30 - 15, duration: 4 + Math.random() * 3, yoyo: true, repeat: -1, ease: "sine.inOut" });
      }
    }
  }

  // -------------------- SCROLL FADE FOR FLOATING ITEMS --------------------
  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const fadeStart = 100; 
    const fadeEnd = 600;   
    const opacity = 1 - (scrollTop - fadeStart) / (fadeEnd - fadeStart);
    floatingContainer.style.opacity = Math.max(0, Math.min(1, opacity));
  });

  // -------------------- FOOD CARDS --------------------
  const foodCards = document.querySelectorAll(".food-card");

  function revealFoodCards() {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    foodCards.forEach(card => observer.observe(card));
    foodCards.forEach(card => card.addEventListener("click", () => dishInput.value = card.dataset.dish));
  }

  // -------------------- FLASHCARDS --------------------
  const flashImages = ["images/f1.jpg","images/f6.jpg","images/f7.jpg","images/f10.jpg","images/f12.jpg","images/f13.jpg","images/f14.jpg","images/f16.jpg"];
  const flashImg = document.getElementById("flashImage");
  let flashIndex = 0;

  function startFlashcards() {
    setInterval(() => {
      flashIndex = (flashIndex + 1) % flashImages.length;
      flashImg.style.opacity = 0;
      setTimeout(() => { flashImg.src = flashImages[flashIndex]; flashImg.style.opacity = 1; }, 500);
    }, 3000);
  }

  // -------------------- SEARCH & DIRECT DISPLAY --------------------
  async function searchDish() {
    const dish = dishInput.value.trim();
    feedbackDiv.textContent = "";
    recipeResultsDiv.innerHTML = ""; 
    if (!dish) { 
      alert("Please enter a dish name!");  // ✅ popup alert
      return; 
    }

    try {
      const res = await fetch("/getRecipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish })
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "No recipes found 😢");  // ✅ alert instead of page text
        return;
      }

      const data = await res.json();
      if (!data.length) {
        alert("No recipes found 😢");  // ✅ alert if empty
        return;
      }

      // Directly show first recipe
      showRecipe(data[0]);

    } catch (err) {
      console.error(err);
      alert("Error fetching recipe 😢");  // ✅ alert on fetch error
    }
  }

  window.searchDish = searchDish;

  // -------------------- DISPLAY RECIPE --------------------
  function showRecipe(data) {
    document.querySelector(".search-area").style.display = "none";
    const recipeSection = document.querySelector(".recipe-section");
    recipeSection.classList.remove("hidden");
    recipeSection.scrollIntoView({ behavior: "smooth" });

    const ul = document.getElementById("recipeSteps");
    ul.innerHTML = "";

    // Ingredients
    if (data.ingredients && data.ingredients.length) {
      const header = document.createElement("li");
      header.textContent = "🛒 Ingredients:";
      header.style.fontWeight = "bold";
      ul.appendChild(header);
      data.ingredients.forEach(ing => {
        const li = document.createElement("li");
        li.textContent = `- ${ing}`;
        ul.appendChild(li);
      });
    }

    // Steps
    if (data.steps && data.steps.length) {
      const header = document.createElement("li");
      header.textContent = "📋 Steps:";
      header.style.fontWeight = "bold";
      ul.appendChild(header);
      data.steps.forEach((step, i) => {
        const li = document.createElement("li");
        li.textContent = `${i+1}. ${step}`;
        li.classList.add("recipe-step");
        ul.appendChild(li);
      });
    }

    gsap.from("#recipeSteps li", { y: 20, stagger: 0.15, duration: 0.6, ease: "power2.out" });
  }

  // -------------------- PLANNER --------------------
  function addPlannerItem(type, value = "") {
    const ul = document.getElementById(type);
    const li = document.createElement("li");
    const input = document.createElement("input");
    const del = document.createElement("span");
    input.value = value; input.placeholder = "Type here...";
    del.textContent = "✕"; del.className = "delete-btn";
    del.onclick = () => { li.remove(); savePlanner(); };
    input.oninput = savePlanner;
    li.appendChild(input); li.appendChild(del);
    ul.appendChild(li);
    input.focus();
    savePlanner();
  }

  function savePlanner() {
    const data = {};
    ["made","todo","buy"].forEach(type => {
      data[type] = [...document.querySelectorAll(`#${type} input`)].map(i=>i.value.trim()).filter(Boolean);
    });
    localStorage.setItem("plannerData", JSON.stringify(data));
  }

  function loadPlanner() {
    const data = JSON.parse(localStorage.getItem("plannerData")) || { made: [], todo: [], buy: [] };
    ["made","todo","buy"].forEach(type => {
      const ul = document.getElementById(type); ul.innerHTML = "";
      if (!data[type]) return;
      data[type].forEach(text => {
        const li = document.createElement("li");
        const input = document.createElement("input");
        const del = document.createElement("span");
        input.value = text; del.textContent = "✕"; del.className = "delete-btn";
        input.oninput = savePlanner;
        del.onclick = () => { li.remove(); savePlanner(); };
        li.appendChild(input); li.appendChild(del);
        ul.appendChild(li);
      });
    });
  }

  window.addPlannerItem = addPlannerItem;

});
