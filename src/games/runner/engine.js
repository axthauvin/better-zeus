/**
 * Survie au lundi — game rules (no rendering).
 *
 * You are the red "current time" line travelling through the week grid.
 * World units: one day column is DAY_W wide; y is the height above the
 * line (0 = on the line, positive = up). Each weekday is built from the real
 * timetable — its courses are the obstacles — plus extra traps that get more
 * frequent as the weeks go by:
 *   course  — sits on the line, jump over it
 *   exam    — tall, needs a double jump
 *   meeting — hangs from above: stay on the line, don't jump into it
 *   moving  — a course that grows and shrinks, time your jump
 *   gap     — a room change: the line is missing, jump across
 */

export const DAY_W = 240;
export const VIEW_DAYS = 7;
export const PLAYER_X = 300;
export const PLAYER_SIZE = 30;
export const MEETING_CLEARANCE = 44;
export const DAY_START_MIN = 8 * 60;
export const DAY_LENGTH_MIN = 12 * 60;

const GRAVITY = 3000;
const JUMP_VELOCITY = 900; // apex ≈ 135: an exam (150) needs the double jump
const DOUBLE_JUMP_VELOCITY = 780;
const BASE_SPEED = 210;
const MAX_SPEED = 470;
const EXAM = { w: 30, h: 150 };

const MEETINGS = ["Réunion", "Point projet", "Soutenance", "Rattrapage", "Visio"];

export function createRunner({ schedule = [], pool = [], rng = Math.random }) {
  return {
    schedule,
    pool,
    rng,
    // The view starts so that the player stands on Monday 8:00
    distance: -PLAYER_X,
    speed: BASE_SPEED,
    elapsed: 0,
    week: 0,
    nextDay: 0,
    player: { y: 0, vy: 0, jumps: 0, onGround: true },
    obstacles: [],
    coffees: [],
    collected: 0,
    banner: null,
    score: 0,
    over: false,
  };
}

export const difficulty = (state) => Math.min(1, state.week * 0.3 + state.elapsed / 150000);

/** Height of an obstacle right now (moving courses breathe). */
export function obstacleHeight(obstacle, elapsed) {
  if (obstacle.kind !== "moving") return obstacle.h;
  return 20 + (obstacle.h - 20) * (0.5 + 0.5 * Math.sin(elapsed / 360 + obstacle.phase));
}

function randomCourse(state) {
  if (state.pool.length === 0) return { title: "Cours", style: null };
  return state.pool[Math.floor(state.rng() * state.pool.length)];
}

function generateDay(state, dayIndex) {
  const { rng } = state;
  const weekday = ((dayIndex % 7) + 7) % 7;
  const weekend = weekday >= 5;
  const dayStart = dayIndex * DAY_W;
  const d = difficulty(state);
  const specs = [];

  const course = (source, kind = "course") => ({
    kind,
    w: 48 + rng() * 16,
    h: Math.max(40, Math.min(80, (source.minutes || 90) / 2.4)),
    title: source.title,
    style: source.style,
    phase: rng() * Math.PI * 2,
  });

  // Real courses of that weekday, in order
  const courses = weekend ? [] : state.schedule[weekday] || [];
  courses.forEach((source) => {
    if (source.exam) {
      specs.push({ kind: "exam", ...EXAM, title: source.title });
    } else {
      specs.push(course(source, rng() < 0.2 + d * 0.35 ? "moving" : "course"));
    }
  });
  if (!weekend && courses.length === 0) {
    specs.push(course(randomCourse(state)), course(randomCourse(state)));
  }

  // Extra traps, dropped at random places in the day
  const insert = (spec) => specs.splice(Math.floor(rng() * (specs.length + 1)), 0, spec);
  if (rng() < 0.45 + d * 0.4 + (weekend ? 0.3 : 0)) {
    insert({ kind: "meeting", w: 60 + rng() * 30, title: MEETINGS[Math.floor(rng() * MEETINGS.length)] });
  }
  if (rng() < 0.4 + d * 0.35 + (weekend ? 0.3 : 0)) {
    insert({ kind: "gap", w: 60 + rng() * (24 + d * 30), title: "Changement de salle" });
  }
  if (rng() < 0.15 + d * 0.3) insert({ kind: "exam", ...EXAM, title: "Partiel" });
  if (weekend && rng() < 0.5) insert(course(randomCourse(state), "moving"));

  // Pack them along the day, keeping room to land between two obstacles
  const minGap = 78 - d * 20;
  let cursor = dayStart + 16;
  specs.forEach((spec) => {
    const x = cursor + rng() * 24;
    if (x + spec.w > dayStart + DAY_W - 8) return;
    cursor = x + spec.w + minGap;
    if (x < 200) return; // a short warm-up on Monday morning
    state.obstacles.push({ ...spec, x });
  });

  state.coffees.push({ x: dayStart + 30 + rng() * (DAY_W - 60), y: 60 + rng() * 70 });
}

export function jump(state) {
  if (state.over) return;
  const { player } = state;
  if (player.onGround) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
    player.jumps = 1;
  } else if (player.jumps < 2) {
    player.vy = DOUBLE_JUMP_VELOCITY;
    player.jumps = 2;
  }
}

const inGap = (state, x) =>
  state.obstacles.some((o) => o.kind === "gap" && x > o.x && x < o.x + o.w);

function collides(state) {
  const { player } = state;
  const left = state.distance + PLAYER_X + 3;
  const right = left + PLAYER_SIZE - 6;
  const bottom = player.y + 2;
  const top = player.y + PLAYER_SIZE - 3;

  return state.obstacles.some((o) => {
    if (o.kind === "gap") return false;
    if (right <= o.x || left >= o.x + o.w) return false;
    if (o.kind === "meeting") return top > MEETING_CLEARANCE;
    return bottom < obstacleHeight(o, state.elapsed);
  });
}

/** Where the player is in the week: day index and minutes since midnight. */
export function clock(state) {
  const x = state.distance + PLAYER_X;
  const day = Math.floor(x / DAY_W);
  const fraction = (x - day * DAY_W) / DAY_W;
  return { day, minutes: DAY_START_MIN + fraction * DAY_LENGTH_MIN };
}

export function update(state, dt) {
  if (state.over) return;
  const seconds = dt / 1000;
  state.elapsed += dt;
  state.speed = Math.min(MAX_SPEED, BASE_SPEED + state.week * 24 + state.elapsed * 0.0009);
  state.distance += state.speed * seconds;

  // Build the days about to scroll into view
  while (state.nextDay * DAY_W < state.distance + (VIEW_DAYS + 1) * DAY_W) {
    generateDay(state, state.nextDay);
    state.nextDay += 1;
  }

  // Physics
  const { player } = state;
  const previousY = player.y;
  player.vy -= GRAVITY * seconds;
  player.y += player.vy * seconds;

  const footLeft = state.distance + PLAYER_X + 5;
  const footRight = footLeft + PLAYER_SIZE - 10;
  const supported = !(inGap(state, footLeft) && inGap(state, footRight));

  if (supported && player.y <= 0 && player.vy <= 0 && previousY >= -1) {
    player.y = 0;
    player.vy = 0;
    player.onGround = true;
    player.jumps = 0;
  } else if (player.y > 0 || !supported) {
    player.onGround = false;
  }

  if (player.y < -70 || collides(state)) {
    state.over = true;
    return;
  }

  // Coffees
  const cx = state.distance + PLAYER_X + PLAYER_SIZE / 2;
  const cy = player.y + PLAYER_SIZE / 2;
  state.coffees = state.coffees.filter((coffee) => {
    if (Math.abs(coffee.x - cx) < 20 && Math.abs(coffee.y - cy) < 22) {
      state.collected += 1;
      return false;
    }
    return coffee.x > state.distance - 40;
  });
  state.obstacles = state.obstacles.filter((o) => o.x + o.w > state.distance - 60);

  // A new week
  const week = Math.floor(clock(state).day / 7);
  if (week > state.week) {
    state.week = week;
    state.banner = {
      text: week === 1 ? "1re semaine survécue !" : `${week}e semaine survécue !`,
      time: 2200,
    };
  }
  if (state.banner) {
    state.banner.time -= dt;
    if (state.banner.time <= 0) state.banner = null;
  }

  state.score = Math.max(0, Math.floor((state.distance + PLAYER_X) / 8)) + state.collected * 25 + state.week * 300;
}
