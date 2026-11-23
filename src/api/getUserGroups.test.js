/**
 * @jest-environment jsdom
 */
import { getUserGroups } from "./index.js";

describe("getUserGroups", () => {
  afterEach(() => localStorage.clear());

  test("builds string paths for every root, not array indexes", () => {
    localStorage.setItem(
      "ZEUS-groupHierarchy",
      JSON.stringify({
        values: [
          { id: 1, name: "EPITA", children: [{ id: 2, name: "ING1", children: [] }] },
          { id: 3, name: "ISG", children: [{ id: 4, name: "BBA", children: [] }] },
        ],
      }),
    );

    const groups = getUserGroups();
    const byId = Object.fromEntries(groups.map((g) => [g.id, g.path]));

    groups.forEach((g) => expect(typeof g.path).toBe("string"));
    expect(byId[1]).toBe("");
    expect(byId[3]).toBe("");
    expect(byId[2]).toBe("EPITA");
    expect(byId[4]).toBe("ISG");
  });
});
