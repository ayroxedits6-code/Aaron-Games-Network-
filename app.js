/* =========================================
   GG MODS - APP.JS
========================================= */

"use strict";

/* =========================================
   STORAGE
========================================= */

const STORAGE = {
  users: "ggmods_users",
  session: "ggmods_session",
  theme: "ggmods_theme",
  games: "ggmods_games",
  movies: "ggmods_movies",
  posts: "ggmods_posts",
  requests: "ggmods_requests",
  messages: "ggmods_messages",
  notifications: "ggmods_notifications"
};

/* =========================================
   HELPERS
========================================= */

function read(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error("Storage error:", error);
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession() {
  return localStorage.getItem(STORAGE.session);
}

function setSession(username) {
  localStorage.setItem(STORAGE.session, username);
}

function clearSession() {
  localStorage.removeItem(STORAGE.session);
}

function getUsers() {
  return read(STORAGE.users, []);
}

function getCurrentUser() {
  const username = getSession();

  if (!username) {
    return null;
  }

  return getUsers().find(
    user => user.username === username
  ) || null;
}

function isAdmin() {
  const user = getCurrentUser();

  return Boolean(user && user.role === "admin");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateId(prefix = "id") {
  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}

function formatDate(date = new Date()) {
  return new Date(date).toLocaleDateString();
}

function formatTime(date = new Date()) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* =========================================
   ADMIN SETUP
========================================= */

function seedAdmin() {
  const users = getUsers();

  const adminExists = users.some(
    user => user.role === "admin"
  );

  if (!adminExists) {
    users.push({
      id: generateId("user"),
      username: "Admin",
      email: "admin@ggmods.local",
      password: "admin123",
      role: "admin",
      coins: 0,
      avatar: "",
      joinedAt: new Date().toISOString(),
      online: true
    });

    write(STORAGE.users, users);
  }
}

/* =========================================
   DEFAULT DATA
========================================= */

function seedDefaultData() {
  if (!localStorage.getItem(STORAGE.games)) {
    write(STORAGE.games, []);
  }

  if (!localStorage.getItem(STORAGE.movies)) {
    write(STORAGE.movies, []);
  }

  if (!localStorage.getItem(STORAGE.posts)) {
    write(STORAGE.posts, []);
  }

  if (!localStorage.getItem(STORAGE.requests)) {
    write(STORAGE.requests, []);
  }

  if (!localStorage.getItem(STORAGE.messages)) {
    write(STORAGE.messages, []);
  }

  if (!localStorage.getItem(STORAGE.notifications)) {
    write(STORAGE.notifications, []);
  }
}

/* =========================================
   DOM
========================================= */

const appContent = document.getElementById(
  "appContent"
);

const pageTitle = document.getElementById(
  "pageTitle"
);

const adminNavItem = document.getElementById(
  "adminNavItem"
);

const sidebarUsername = document.getElementById(
  "sidebarUsername"
);

const sidebarUserStatus = document.getElementById(
  "sidebarUserStatus"
);

const sidebarUserAvatar = document.getElementById(
  "sidebarUserAvatar"
);

const topbarUsername = document.getElementById(
  "topbarUsername"
);

const topbarCoins = document.getElementById(
  "topbarCoins"
);

const topbarAvatar = document.getElementById(
  "topbarAvatar"
);

const authScreen = document.getElementById(
  "authScreen"
);

const loginForm = document.getElementById(
  "loginForm"
);

const registerForm = document.getElementById(
  "registerForm"
);

const globalModal = document.getElementById(
  "globalModal"
);

const modalContent = document.getElementById(
  "modalContent"
);

const toastContainer = document.getElementById(
  "toastContainer"
);

/* =========================================
   TOAST
========================================= */

function showToast(message, type = "info") {
  if (!toastContainer) {
    return;
  }

  const toast = document.createElement("div");

  toast.className = "toast";

  if (type === "success") {
    toast.style.borderLeftColor =
      "var(--success)";
  }

  if (type === "error") {
    toast.style.borderLeftColor =
      "var(--danger)";
  }

  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/* =========================================
   MODAL
========================================= */

function openModal(content) {
  if (!globalModal || !modalContent) {
    return;
  }

  modalContent.innerHTML = content;

  globalModal.hidden = false;
}

function closeModal() {
  if (globalModal) {
    globalModal.hidden = true;
  }
}

document
  .getElementById("closeModalButton")
  ?.addEventListener("click", closeModal);

document
  .querySelector(".modal-overlay")
  ?.addEventListener("click", closeModal);

/* =========================================
   AUTH SCREEN
========================================= */

function updateAuthScreen() {
  if (!authScreen) {
    return;
  }

  if (getCurrentUser()) {
    authScreen.hidden = true;
  } else {
    authScreen.hidden = false;
  }
}

document
  .getElementById("showRegisterButton")
  ?.addEventListener("click", () => {
    loginForm.hidden = true;
    registerForm.hidden = false;
  });

document
  .getElementById("showLoginButton")
  ?.addEventListener("click", () => {
    registerForm.hidden = true;
    loginForm.hidden = false;
  });

/* =========================================
   REGISTER
========================================= */

registerForm?.addEventListener(
  "submit",
  event => {
    event.preventDefault();

    const formData =
      new FormData(registerForm);

    const username =
      String(
        formData.get("username") || ""
      ).trim();

    const email =
      String(
        formData.get("email") || ""
      ).trim();

    const password =
      String(
        formData.get("password") || ""
      );

    if (
      !username ||
      !email ||
      !password
    ) {
      showToast(
        "Please complete all fields.",
        "error"
      );

      return;
    }

    const users = getUsers();

    const exists = users.some(
      user =>
        user.username.toLowerCase() ===
        username.toLowerCase()
    );

    if (exists) {
      showToast(
        "That username already exists.",
        "error"
      );

      return;
    }

    const newUser = {
      id: generateId("user"),
      username,
      email,
      password,
      role: "member",
      coins: 0,
      avatar: "",
      joinedAt:
        new Date().toISOString(),
      online: true
    };

    users.push(newUser);

    write(STORAGE.users, users);

    setSession(username);

    registerForm.reset();

    showToast(
      "Account created successfully!",
      "success"
    );

    updateUserUI();
    updateAuthScreen();
    renderPage("home");
  }
);

/* =========================================
   LOGIN
========================================= */

loginForm?.addEventListener(
  "submit",
  event => {
    event.preventDefault();

    const formData =
      new FormData(loginForm);

    const username =
      String(
        formData.get("username") || ""
      ).trim();

    const password =
      String(
        formData.get("password") || ""
      );

    const user = getUsers().find(
      item =>
        item.username.toLowerCase() ===
          username.toLowerCase() &&
        item.password === password
    );

    if (!user) {
      showToast(
        "Invalid username or password.",
        "error"
      );

      return;
    }

    user.online = true;

    const users = getUsers().map(item =>
      item.id === user.id
        ? user
        : item
    );

    write(STORAGE.users, users);

    setSession(user.username);

    loginForm.reset();

    showToast(
      "Welcome back, " +
        user.username +
        "!",
      "success"
    );

    updateUserUI();
    updateAuthScreen();
    renderPage("home");
  }
);

/* =========================================
   LOGOUT
========================================= */

document
  .getElementById("logoutButton")
  ?.addEventListener("click", () => {
    const user = getCurrentUser();

    if (user) {
      const users = getUsers().map(item => {
        if (item.id === user.id) {
          return {
            ...item,
            online: false
          };
        }

        return item;
      });

      write(STORAGE.users, users);
    }

    clearSession();

    updateUserUI();
    updateAuthScreen();

    showToast(
      "You have been logged out.",
      "success"
    );
  });

/* =========================================
   USER UI
========================================= */

function updateUserUI() {
  const user = getCurrentUser();

  if (!user) {
    sidebarUsername.textContent = "Guest";
    sidebarUserStatus.textContent =
      "Not logged in";

    topbarUsername.textContent = "Guest";
    topbarCoins.textContent = "0 Coins";

    sidebarUserAvatar.textContent = "G";
    topbarAvatar.textContent = "G";

    if (adminNavItem) {
      adminNavItem.hidden = true;
    }

    return;
  }

  const firstLetter =
    user.username
      .charAt(0)
      .toUpperCase();

  sidebarUsername.textContent =
    user.username;

  sidebarUserStatus.textContent =
    user.role === "admin"
      ? "Administrator"
      : "Member";

  topbarUsername.textContent =
    user.username;

  topbarCoins.textContent =
    `${user.coins || 0} Coins`;

  sidebarUserAvatar.textContent =
    firstLetter;

  topbarAvatar.textContent =
    firstLetter;

  if (adminNavItem) {
    adminNavItem.hidden =
      user.role !== "admin";
  }
}

/* =========================================
   NAVIGATION
========================================= */

const pageNames = {
  home: "GG MODS",
  games: "Games",
  movies: "Movies",
  chat: "Chat",
  members: "Members",
  coins: "Coins",
  upcoming: "Upcoming Games",
  profile: "Profile",
  settings: "Settings",
  admin: "Admin Panel"
};

function setActiveNavigation(page) {
  document
    .querySelectorAll(
      ".nav-item, .mobile-nav-item"
    )
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === page
      );
    });
}

function renderPage(page) {
  if (
    page === "admin" &&
    !isAdmin()
  ) {
    showToast(
      "Admin access only.",
      "error"
    );

    page = "home";
  }

  pageTitle.textContent =
    pageNames[page] || "GG MODS";

  setActiveNavigation(page);

  switch (page) {
    case "games":
      renderGames();
      break;

    case "movies":
      renderMovies();
      break;

    case "chat":
      renderChat();
      break;

    case "members":
      renderMembers();
      break;

    case "coins":
      renderCoins();
      break;

    case "upcoming":
      renderUpcoming();
      break;

    case "profile":
      renderProfile();
      break;

    case "settings":
      renderSettings();
      break;

    case "admin":
      renderAdmin();
      break;

    default:
      renderHome();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document
  .querySelectorAll(
    ".nav-item, .mobile-nav-item"
  )
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        renderPage(
          button.dataset.page
        );

        document
          .getElementById("sidebar")
          ?.classList.remove(
            "open"
          );
      }
    );
  });

/* =========================================
   HOME
========================================= */

function renderHome() {
  const users = getUsers();
  const games = read(
    STORAGE.games,
    []
  );

  const posts = read(
    STORAGE.posts,
    []
  );

  const popularGames =
    games.filter(
      game => game.popular
    );

  appContent.innerHTML = `
    <section class="hero">
      <div class="hero-content">

        <span class="hero-tag">
          GG MODS COMMUNITY
        </span>

        <h2>
          Gaming Starts Here.
        </h2>

        <p>
          Discover games, mods, movies,
          community chats and upcoming
          releases all in one place.
        </p>

        <div class="hero-actions">

          <button
            class="primary-button"
            onclick="renderPage('games')"
          >
            🎮 Explore Games
          </button>

          <button
            class="secondary-button"
            onclick="renderPage('members')"
          >
            👥 View Members
          </button>

        </div>

      </div>
    </section>


    <section class="section">

      <div class="section-header">
        <div>
          <h2>Community Overview</h2>
          <p>
            What's happening inside GG MODS.
          </p>
        </div>
      </div>

      <div class="stats-grid">

        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-number">
            ${users.length}
          </div>
          <div class="stat-label">
            Registered Members
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎮</div>
          <div class="stat-number">
            ${games.length}
          </div>
          <div class="stat-label">
            Games
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎬</div>
          <div class="stat-number">
            ${read(STORAGE.movies, []).length}
          </div>
          <div class="stat-label">
            Movies
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-number">
            ${posts.length}
          </div>
          <div class="stat-label">
            Community Posts
          </div>
        </div>

      </div>

    </section>


    <section class="section">

      <div class="section-header">

        <div>
          <h2>Popular Games</h2>
          <p>
            Games selected by the admin.
          </p>
        </div>

        <button
          class="secondary-button"
          onclick="renderPage('games')"
        >
          View All
        </button>

      </div>

      ${
        popularGames.length
          ? `
            <div class="game-grid">
              ${popularGames
                .slice(0, 5)
                .map(gameCard)
                .join("")}
            </div>
          `
          : `
            <div class="empty-state">

              <div class="empty-state-icon">
                🎮
              </div>

              <h3>
                No popular games yet
              </h3>

              <p>
                Games marked as popular
                by the admin will appear here.
              </p>

            </div>
          `
      }

    </section>
  `;
}

/* =========================================
   GAME CARD
========================================= */

function gameCard(game) {
  return `
    <article class="game-card">

      ${
        game.image
          ? `
            <img
              class="card-image"
              src="${escapeHTML(game.image)}"
              alt="${escapeHTML(game.title)}"
            >
          `
          : `
            <div
              class="card-image"
              style="
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:45px;
              "
            >
              🎮
            </div>
          `
      }

      <div class="card-body">

        <h3>
          ${escapeHTML(game.title)}
        </h3>

        <p>
          ${escapeHTML(
            game.description ||
            "Gaming content from GG MODS."
          )}
        </p>

        <div class="card-meta">

          ${
            game.popular
              ? `
                <span class="badge accent">
                  ⭐ Popular
                </span>
              `
              : ""
          }

          <span class="badge">
            ${escapeHTML(
              game.category || "Game"
            )}
          </span>

        </div>

      </div>

    </article>
  `;
}

/* =========================================
   GAMES
========================================= */

function renderGames() {
  const games = read(
    STORAGE.games,
    []
  );

  appContent.innerHTML = `
    <section class="section">

      <div class="section-header">

        <div>
          <h2>Games</h2>
          <p>
            Browse the games available
            in GG MODS.
          </p>
        </div>

        ${
          isAdmin()
            ? `
              <button
                class="primary-button"
                onclick="openAddGameModal()"
              >
                + Add Game
              </button>
            `
            : ""
        }

      </div>

      ${
        games.length
          ? `
            <div class="game-grid">
              ${games
                .map(gameCard)
                .join("")}
            </div>
          `
          : `
            <div class="empty-state">

              <div class="empty-state-icon">
                🎮
              </div>

              <h3>
                No games posted yet
              </h3>

              <p>
                ${
                  isAdmin()
                    ? "Use the Add Game button to add your first game."
                    : "The admin has not posted any games yet."
                }
              </p>

            </div>
          `
      }

    </section>
  `;
}

/* =========================================
   ADD GAME
========================================= */

function openAddGameModal() {
  if (!isAdmin()) {
    return;
  }

  openModal(`
    <h2>Add Game</h2>

    <form id="addGameForm">

      <div class="form-group">
        <label>Game Name</label>
        <input
          name="title"
          required
          placeholder="Example: FIFA 16 MOD FC 27"
        >
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea
          name="description"
          placeholder="Game description"
        ></textarea>
      </div>

      <div class="form-group">
        <label>Category</label>
        <input
          name="category"
          placeholder="Football"
        >
      </div>

      <div class="form-group">
        <label>Image URL</label>
        <input
          name="image"
          placeholder="https://..."
        >
      </div>

      <label>
        <input
          type="checkbox"
          name="popular"
        >
        Mark as Popular
      </label>

      <button
        class="primary-button"
        type="submit"
      >
        Add Game
      </button>

    </form>
  `);

  document
    .getElementById("addGameForm")
    ?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const form =
          event.currentTarget;

        const data =
          new FormData(form);

        const games =
          read(STORAGE.games, []);

        games.push({
          id: generateId("game"),
          title: data.get("title"),
          description:
            data.get("description"),
          category:
            data.get("category
