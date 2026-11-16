(() => {
  const STORAGE_KEY = "tolerance-wall-messages-v1";
  const SEED_FLAG = "tolerance-wall-seeded-v1";
  const ALLOWED_CATEGORIES = Object.freeze([
    "متبرعة كريمة",
    "دارسة فاضلة",
    "عضو الفريق",
  ]);

  const form = document.getElementById("tolerance-form");
  const nameInput = document.getElementById("name");
  const messageInput = document.getElementById("message");
  const charCount = document.getElementById("char-count");
  const formStatus = document.getElementById("form-status");
  const wallGrid = document.getElementById("wall-grid");
  const wallCount = document.getElementById("wall-count");
  const emptyWall = document.getElementById("empty-wall");
  const goToWallBtn = document.getElementById("go-to-wall");
  const toggleButtons = document.querySelectorAll(".toggle-btn");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const viewForm = document.getElementById("view-form");
  const viewWall = document.getElementById("view-wall");

  let activeFilter = "all";

  const seedMessages = [
    {
      id: "seed-1",
      name: "نورة العطية",
      category: "متبرعة كريمة",
      message: "التسامح بابٌ يفتح القلوب على بعضها، فلنُبقِه مشرعًا بالودّ.",
      createdAt: "2026-03-10T09:00:00.000Z",
    },
    {
      id: "seed-2",
      name: "سارة المنصوري",
      category: "دارسة فاضلة",
      message: "في كل كلمة طيبة أثرٌ يبقى… فلتكن بصمتنا رحمةً ونقاءً.",
      createdAt: "2026-03-11T11:30:00.000Z",
    },
    {
      id: "seed-3",
      name: "فريق الرعاية",
      category: "عضو الفريق",
      message: "نزرع التآلف كما نزرع الأمل؛ جداريتنا مساحة أثرٍ جميل.",
      createdAt: "2026-03-12T14:15:00.000Z",
    },
  ];

  function sanitizeText(value, maxLen) {
    return String(value ?? "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .trim()
      .slice(0, maxLen);
  }

  function isAllowedCategory(category) {
    return ALLOWED_CATEGORIES.includes(category);
  }

  function normalizeMessage(raw) {
    if (!raw || typeof raw !== "object") return null;
    const name = sanitizeText(raw.name, 60);
    const message = sanitizeText(raw.message, 280);
    const category = sanitizeText(raw.category, 40);
    const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : "";
    const id = sanitizeText(raw.id, 80);
    if (!name || !message || !isAllowedCategory(category) || !id) return null;
    const dateOk = !Number.isNaN(Date.parse(createdAt));
    return {
      id,
      name,
      category,
      message,
      createdAt: dateOk ? createdAt : new Date().toISOString(),
    };
  }

  function loadMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeMessage).filter(Boolean);
    } catch {
      return [];
    }
  }

  function saveMessages(messages) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }

  function ensureSeed() {
    if (localStorage.getItem(SEED_FLAG)) return;
    const existing = loadMessages();
    if (existing.length === 0) {
      saveMessages(seedMessages);
    }
    localStorage.setItem(SEED_FLAG, "1");
  }

  function formatDate(iso) {
    try {
      return new Intl.DateTimeFormat("ar", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(iso));
    } catch {
      return "";
    }
  }

  function buildCard(item, index) {
    const article = document.createElement("article");
    article.className = "message-card";
    article.dataset.category = item.category;
    article.tabIndex = 0;
    article.style.setProperty("--stagger", `${Math.min(index * 55, 330)}ms`);

    const category = document.createElement("span");
    category.className = "card-category";
    category.textContent = item.category;

    const message = document.createElement("p");
    message.className = "card-message";
    message.textContent = `«${item.message}»`;

    const meta = document.createElement("div");
    meta.className = "card-meta";

    const name = document.createElement("span");
    name.className = "card-name";
    name.textContent = item.name;

    const time = document.createElement("time");
    time.dateTime = item.createdAt;
    time.textContent = formatDate(item.createdAt);

    meta.append(name, time);
    article.append(category, message, meta);
    return article;
  }

  function renderWall() {
    const messages = loadMessages()
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const filtered =
      activeFilter === "all"
        ? messages
        : messages.filter((m) => m.category === activeFilter);

    wallCount.textContent =
      messages.length === 0
        ? "لا رسائل بعد — كن أول من يترك بصمة."
        : `${messages.length} رسالة على الجدارية`;

    while (wallGrid.firstChild) {
      wallGrid.removeChild(wallGrid.firstChild);
    }

    if (filtered.length === 0) {
      emptyWall.hidden = false;
      return;
    }

    emptyWall.hidden = true;

    const fragment = document.createDocumentFragment();
    filtered.forEach((item, index) => {
      fragment.appendChild(buildCard(item, index));
    });
    wallGrid.appendChild(fragment);
  }

  function setView(view) {
    const showForm = view === "form";
    viewForm.classList.toggle("is-visible", showForm);
    viewWall.classList.toggle("is-visible", !showForm);
    viewForm.hidden = !showForm;
    viewWall.hidden = showForm;

    toggleButtons.forEach((btn) => {
      const active = btn.dataset.view === view;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (!showForm) renderWall();
  }

  function updateCharCount() {
    charCount.textContent = `${messageInput.value.length} / 280`;
  }

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  goToWallBtn.addEventListener("click", () => setView("wall"));

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
      renderWall();
    });
  });

  messageInput.addEventListener("input", updateCharCount);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formStatus.textContent = "";
    formStatus.classList.remove("is-error");

    const name = sanitizeText(nameInput.value, 60);
    const message = sanitizeText(messageInput.value, 280);
    const categoryInput = form.querySelector('input[name="category"]:checked');
    const category = categoryInput ? sanitizeText(categoryInput.value, 40) : "";

    if (!name || !message || !isAllowedCategory(category)) {
      formStatus.textContent = "يرجى تعبئة الاسم والتصنيف والرسالة.";
      formStatus.classList.add("is-error");
      return;
    }

    const entry = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      category,
      message,
      createdAt: new Date().toISOString(),
    };

    const messages = loadMessages();
    messages.push(entry);
    saveMessages(messages);

    form.reset();
    updateCharCount();
    setView("wall");
    wallCount.textContent = `نُشرت رسالتك بنجاح — ${loadMessages().length} رسالة على الجدارية`;
  });

  ensureSeed();
  updateCharCount();
  setView("form");
})();
