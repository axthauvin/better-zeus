/**
 * @jest-environment jsdom
 */
import { getUiVersion, UI_CLASSIC, UI_MODERN, UI_VERSION_KEY } from "./uiVersion.js";

describe("getUiVersion", () => {
  afterEach(() => localStorage.clear());

  test("defaults to the modern interface", () => {
    expect(getUiVersion()).toBe(UI_MODERN);
  });

  test("returns classic only when explicitly chosen", () => {
    localStorage.setItem(UI_VERSION_KEY, "classic");
    expect(getUiVersion()).toBe(UI_CLASSIC);
    localStorage.setItem(UI_VERSION_KEY, "something-else");
    expect(getUiVersion()).toBe(UI_MODERN);
  });
});
