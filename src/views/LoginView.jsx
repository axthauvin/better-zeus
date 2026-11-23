import React, { useState, useEffect, useRef } from "react";
import "../styles/theme.css";
import "./LoginView.css";
import BrandMark from "../components/BrandMark";

const getInitialTheme = () => {
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
};

// Zeus renders its Office 365 button asynchronously: look it up on demand.
const findOfficeButton = () => {
  const candidates = document.querySelectorAll("button, a");
  for (const element of candidates) {
    if (element.closest(".login-view")) continue;
    const image = element.querySelector("img");
    const source = image?.getAttribute("src") || "";
    const label = `${element.textContent || ""} ${image?.alt || ""}`;
    if (/office|microsoft/i.test(source) || /office|microsoft/i.test(label)) {
      return element;
    }
  }
  return null;
};

const MicrosoftLogo = () => (
  <svg
    className="microsoft-icon"
    viewBox="0 0 23 23"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M0 0H11V11H0V0Z" fill="#F25022" />
    <path d="M12 0H23V11H12V0Z" fill="#7FBA00" />
    <path d="M0 12H11V23H0V12Z" fill="#00A4EF" />
    <path d="M12 12H23V23H12V12Z" fill="#FFB900" />
  </svg>
);

const LoginView = () => {
  const [theme] = useState(getInitialTheme);
  const [status, setStatus] = useState("idle"); // idle | connecting | unavailable
  const [isHidden, setIsHidden] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const handleOfficeLogin = () => {
    if (status === "connecting") return;
    setStatus("connecting");

    const immediate = findOfficeButton();
    if (immediate) {
      immediate.click();
      return;
    }

    // Zeus may still be booting: wait for its button for a few seconds
    let attempts = 0;
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      attempts += 1;
      const button = findOfficeButton();
      if (button) {
        clearInterval(pollRef.current);
        button.click();
      } else if (attempts >= 30) {
        clearInterval(pollRef.current);
        setStatus("unavailable");
      }
    }, 100);
  };

  const showOriginalPage = () => {
    const zeusRoot = document.querySelector("zeus-root");
    if (zeusRoot) zeusRoot.style.display = "";
    const mainContent = document.querySelector("main");
    if (mainContent) mainContent.style.display = "";
    setIsHidden(true);
  };

  if (isHidden) return null;

  return (
    <div className="login-view bz-theme" data-theme={theme}>
      <main className="login-container">
        <BrandMark className="login-mark" />

        <h1 className="login-title">Better Zeus</h1>
        <p className="login-subtitle">
          Enfin un emploi du temps <strong style={{color: "#f0685f"}}>stylé</strong>
        </p>

        <button
          type="button"
          className="office-login-button"
          onClick={handleOfficeLogin}
          disabled={status === "connecting"}
          aria-busy={status === "connecting"}
        >
          {status === "connecting" ? (
            <>
              <span className="login-spinner" aria-hidden="true" />
              Redirection vers Microsoft…
            </>
          ) : (
            <>
              <MicrosoftLogo />
              Se connecter avec Microsoft
            </>
          )}
        </button>

        {status === "unavailable" ? (
          <p className="login-notice" role="alert">
            La connexion Zeus n'a pas répondu.{" "}
            <button
              type="button"
              className="login-link"
              onClick={() => {
                setStatus("idle");
                handleOfficeLogin();
              }}
            >
              Réessayer
            </button>{" "}
            ou{" "}
            <button
              type="button"
              className="login-link"
              onClick={showOriginalPage}
            >
              afficher la page Zeus
            </button>
            .
          </p>
        ) : (
          <p className="login-hint">
            Better Zeus n'a jamais accès à votre mot de passe.
          </p>
        )}
      </main>

      <footer className="login-footer">
        <a
          href="https://github.com/Axthauvin/better-zeus"
          target="_blank"
          rel="noopener noreferrer"
        >
          Projet open source
        </a>
        <span aria-hidden="true">·</span>
        <button type="button" className="login-link" onClick={showOriginalPage}>
          Page Zeus d'origine
        </button>
      </footer>
    </div>
  );
};

export default LoginView;
