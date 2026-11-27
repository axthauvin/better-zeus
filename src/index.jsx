import React from "react";
import { createRoot } from "react-dom/client";
import { getUiVersion, UI_CLASSIC } from "./utils/uiVersion";

// The views are imported lazily (webpack keeps them in this same bundle, see
// webpack.config.js) so that only the selected interface injects its CSS.

// Show loading state immediately
showLoadingState();

// Wait for the page to load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function getPreferredTheme() {
  try {
    const saved = localStorage.getItem("better-zeus-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // ignore storage errors
  }
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getThemeBackground() {
  return getPreferredTheme() === "dark" ? "#1c1c1e" : "#f6f6f8";
}

function showLoadingState() {
  const isDark = getPreferredTheme() === "dark";
  const tile = isDark ? "#f5f5f7" : "#1d1d1f";
  const glyph = isDark ? "#1d1d1f" : "#ffffff";

  const loader = document.createElement("div");
  loader.id = "better-zeus-loader";
  loader.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background-color: ${getThemeBackground()};
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    ">
      <div style="
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background: ${tile};
        display: flex;
        align-items: center;
        justify-content: center;
        animation: bz-loader-pulse 1.4s ease-in-out infinite;
      ">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.31994 13.2814H12.4099V20.4814C12.4099 21.5414 13.7299 22.0414 14.4299 21.2414L21.9999 12.6414C22.6599 11.8914 22.1299 10.7214 21.1299 10.7214H18.0399V3.52143C18.0399 2.46143 16.7199 1.96143 16.0199 2.76143L8.44994 11.3614C7.79994 12.1114 8.32994 13.2814 9.31994 13.2814Z" fill="${glyph}"/>
          <path d="M8.5 4.75H1.5C1.09 4.75 0.75 4.41 0.75 4C0.75 3.59 1.09 3.25 1.5 3.25H8.5C8.91 3.25 9.25 3.59 9.25 4C9.25 4.41 8.91 4.75 8.5 4.75Z" fill="${glyph}"/>
          <path d="M7.5 20.75H1.5C1.09 20.75 0.75 20.41 0.75 20C0.75 19.59 1.09 19.25 1.5 19.25H7.5C7.91 19.25 8.25 19.59 8.25 20C8.25 20.41 7.91 20.75 7.5 20.75Z" fill="${glyph}"/>
          <path d="M4.5 12.75H1.5C1.09 12.75 0.75 12.41 0.75 12C0.75 11.59 1.09 11.25 1.5 11.25H4.5C4.91 11.25 5.25 11.59 5.25 12C5.25 12.41 4.91 12.75 4.5 12.75Z" fill="${glyph}"/>
        </svg>
      </div>
    </div>
    <style>
      @keyframes bz-loader-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.55; transform: scale(0.96); }
      }
    </style>
  `;
  document.body.appendChild(loader);
}

function hideLoadingState() {
  const loader = document.getElementById("better-zeus-loader");
  if (loader) {
    loader.remove();
  }
}

function init() {
  setTimeout(() => {
    console.log("Better Zeus: Initializing");

    const isHomePage =
      window.location.href.includes("/home") ||
      window.location.href.includes("officeConnect");
    const isLoginPage =
      !isHomePage &&
      (window.location.pathname === "/login" ||
        window.location.pathname.includes("login"));

    console.log("On page", window.location.href);

    // Show login view on login page
    if (isLoginPage) {
      console.log("Better Zeus: Showing login view");
      showLoginView();
      return;
    }

    // Show calendar on home page
    if (isHomePage) {
      console.log("Better Zeus: Showing calendar");
      showCalendar();
      return;
    }

    console.log("Better Zeus: Not on login or home page");
    hideLoadingState();
  }, 20);
}

function showLoginView() {
  // Hide loading state
  hideLoadingState();

  // Create container for our login view
  const container = document.createElement("div");
  container.id = "better-zeus-login";

  // Append to body
  document.body.appendChild(container);

  // Hide the original Zeus content
  const zeusRoot = document.querySelector("zeus-root");
  if (zeusRoot) zeusRoot.style.display = "none";

  const mainContent = document.querySelector("main");
  if (mainContent) mainContent.style.display = "none";

  // Render the login view
  import("./views/LoginView").then(({ default: LoginView }) => {
    createRoot(container).render(<LoginView />);
  });
}

function showCalendar() {
  // Wait until we're actually redirected to the home page
  if (!window.location.href.includes("/home")) {
    setTimeout(showCalendar, 50);
    return;
  }

  // Hide loading state
  hideLoadingState();

  // Create container for our calendar
  const container = document.createElement("div");
  container.id = "better-zeus-calendar";

  const body = document.body;
  const previousBodyOverflow = body.style.overflow;

  // Insert at the beginning of the main content
  if (body.firstChild) {
    body.insertBefore(container, body.firstChild);
  } else {
    body.appendChild(container);
  }

  // Ensure the container fills the viewport and prevents body scrolling
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100vh",
    zIndex: "9999",
    overflow: "hidden",
    backgroundColor: getThemeBackground(),
  });

  // Lock body scroll while the calendar overlay is shown
  body.style.overflow = "hidden";

  // Restore body overflow when the page is unloaded
  function restoreBodyOverflow() {
    body.style.overflow = previousBodyOverflow;
    window.removeEventListener("beforeunload", restoreBodyOverflow);
  }
  window.addEventListener("beforeunload", restoreBodyOverflow);

  /* Hide Zeus root element if present */
  const zeusRoot = document.querySelector("zeus-root");
  if (zeusRoot) zeusRoot.style.display = "none";

  // Render the selected interface (the new one unless the user opted out).
  // The classic interface is unmaintained, kept for compatibility only.
  const loadInterface =
    getUiVersion() === UI_CLASSIC
      ? import("./classic/mount")
      : import("./modernCalendar");
  loadInterface.then(({ renderCalendar }) => {
    renderCalendar(createRoot(container));
  });
}
