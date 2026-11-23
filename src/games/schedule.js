import { getEventStyle } from "../utils/calendarHelpers.js";

/** Courses used when the calendar is empty (no group selected yet). */
const FALLBACK_COURSES = [
  { title: "Algorithmique", color: "#AF52DE", minutes: 120 },
  { title: "Anglais", color: "#FF2D55", minutes: 90 },
  { title: "Réseaux — TP", color: "#007AFF", minutes: 90 },
  { title: "Probabilités", color: "#AF52DE", minutes: 180 },
  { title: "Projet", color: "#34C759", minutes: 120 },
  { title: "Conférence", color: "#30B0C7", minutes: 60 },
  { title: "Permanence", color: "#FF9500", minutes: 60 },
  { title: "Droit du numérique", color: "#AF52DE", minutes: 90 },
];

// An exam is a course of type Exam, or one whose title starts with Partiel/Examen
// ("Révisions partiel" is a personal event, not an exam)
const isExam = (event) =>
  /exam/i.test(event.type || "") || /^\s*(partiel|examen)\b/i.test(event.title || "");

/**
 * Unique courses of the visible schedule, each with its card style and
 * typical duration — the raw material the games are built from.
 */
export function buildCoursePool(events = [], theme = "light") {
  const byTitle = new Map();
  events.forEach((event) => {
    const title = String(event.title || "").trim();
    if (!title || byTitle.has(title.toLowerCase())) return;
    const minutes = Math.max(30, (new Date(event.end) - new Date(event.start)) / 60000);
    byTitle.set(title.toLowerCase(), {
      title,
      minutes,
      exam: isExam(event),
      style: getEventStyle(event, theme),
    });
  });

  const pool = [...byTitle.values()];
  if (pool.length >= 3) return pool;

  return [
    ...pool,
    ...FALLBACK_COURSES.map((course) => ({
      title: course.title,
      minutes: course.minutes,
      exam: false,
      style: getEventStyle({ color: course.color }, theme),
    })),
  ];
}

/**
 * Courses per weekday (0 = Monday … 6 = Sunday), sorted by start time —
 * used to build each day of the runner from the real timetable.
 */
export function buildWeekdaySchedule(events = [], theme = "light") {
  const days = Array.from({ length: 7 }, () => new Map());
  events.forEach((event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const weekday = (start.getDay() + 6) % 7;
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const key = `${String(event.title).toLowerCase()}-${startMinutes}`;
    if (days[weekday].has(key)) return;
    days[weekday].set(key, {
      title: String(event.title || "Cours").trim(),
      startMinutes,
      minutes: Math.max(30, (end - start) / 60000),
      exam: isExam(event),
      style: getEventStyle(event, theme),
    });
  });
  return days.map((day) => [...day.values()].sort((a, b) => a.startMinutes - b.startMinutes));
}

export const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];
