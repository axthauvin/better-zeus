import { DAY_W, PLAYER_X, MEETING_CLEARANCE, createRunner, jump, update, clock } from "./engine.js";

const rng = () => 0.99; // no extra traps, no coffee bonus

describe("Survie au lundi engine", () => {
  test("starts on the time line on Monday at 8:00", () => {
    const state = createRunner({ rng });
    expect(state.player.y).toBe(0);
    expect(clock(state)).toEqual({ day: 0, minutes: 8 * 60 });
  });

  test("builds obstacles from the real courses of the day", () => {
    const schedule = [[], [{ title: "Anglais", startMinutes: 9 * 60, minutes: 90, exam: false, style: null }]];
    const state = createRunner({ schedule, rng });
    update(state, 16);
    expect(state.obstacles.some((o) => o.title === "Anglais")).toBe(true);
  });

  test("jumps, double jumps once, then lands", () => {
    const state = createRunner({ rng });
    state.nextDay = Infinity;
    jump(state);
    update(state, 16);
    jump(state);
    const afterDouble = state.player.vy;
    jump(state);
    expect(state.player.vy).toBe(afterDouble);
    for (let i = 0; i < 150; i += 1) update(state, 16);
    expect(state.player.onGround).toBe(true);
  });

  test("running into a course ends the run", () => {
    const state = createRunner({ rng });
    state.nextDay = Infinity;
    state.obstacles.push({ kind: "course", x: 10, w: 40, h: 40 });
    update(state, 16);
    expect(state.over).toBe(true);
  });

  test("a meeting can be passed on the line but not by jumping into it", () => {
    const passing = createRunner({ rng });
    passing.nextDay = Infinity;
    passing.obstacles.push({ kind: "meeting", x: 5, w: 60 });
    update(passing, 16);
    expect(passing.over).toBe(false);

    const jumping = createRunner({ rng });
    jumping.nextDay = Infinity;
    jumping.obstacles.push({ kind: "meeting", x: 5, w: 200 });
    jump(jumping);
    for (let i = 0; i < 10 && !jumping.over; i += 1) update(jumping, 16);
    expect(jumping.over).toBe(true);
    expect(MEETING_CLEARANCE).toBeGreaterThan(22);
  });

  test("falling through a room change ends the run", () => {
    const state = createRunner({ rng });
    state.nextDay = Infinity;
    state.obstacles.push({ kind: "gap", x: -500, w: 5000 });
    for (let i = 0; i < 80 && !state.over; i += 1) update(state, 16);
    expect(state.over).toBe(true);
  });

  test("crossing Sunday night survives the week", () => {
    const state = createRunner({ rng });
    state.nextDay = Infinity;
    state.distance = 7 * DAY_W - PLAYER_X - 1; // just before Monday of week 2
    update(state, 16);
    expect(state.week).toBe(1);
    expect(state.banner.text).toBe("1re semaine survécue !");
  });
});
