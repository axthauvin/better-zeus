// Which interface Better Zeus renders: the current one ("modern", default)
// or the pre-3.0 one ("classic").
// The classic interface is NOT maintained: it only exists for compatibility
// with users who preferred it. See src/classic/README.md.
export const UI_VERSION_KEY = "better-zeus-ui";
export const UI_MODERN = "modern";
export const UI_CLASSIC = "classic";

export function getUiVersion() {
  try {
    return localStorage.getItem(UI_VERSION_KEY) === UI_CLASSIC
      ? UI_CLASSIC
      : UI_MODERN;
  } catch {
    return UI_MODERN;
  }
}

// Both interfaces inject global styles, so switching needs a fresh page.
export function switchUiVersion(version) {
  try {
    localStorage.setItem(UI_VERSION_KEY, version);
  } catch {
    // ignore storage errors
  }
  window.location.reload();
}
