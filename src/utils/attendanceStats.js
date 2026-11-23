import { startOfWeek, addWeeks, format } from "date-fns";

const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const minutesBetween = (start, end) =>
  Math.max(0, (new Date(end) - new Date(start)) / 60000);

const weekKey = (date) =>
  format(startOfWeek(new Date(date), { weekStartsOn: 1 }), "yyyy-MM-dd");

const normalizeTitle = (title) =>
  String(title || "")
    .trim()
    .toLowerCase();

/**
 * Attendance statistics for a list of past events.
 *
 * @param {Array} events - calendar events ({ id, title, type, start, end })
 * @param {Object} options
 * @param {(event) => boolean} options.isMissed - the student missed this session
 * @param {(event) => boolean} options.isExcluded - session doesn't count (ignored / non-countable)
 * @param {Date} [options.rangeStart] - first day of the period (fills empty weeks)
 * @param {Date} [options.rangeEnd] - last day of the period (fills empty weeks)
 */
export function computePresenceStats(
  events = [],
  { isMissed = () => false, isExcluded = () => false, rangeStart, rangeEnd } = {},
) {
  const eligible = events.filter((event) => !isExcluded(event));

  let totalMinutes = 0;
  let absentMinutes = 0;
  let missedSessions = 0;
  const courses = new Map();
  const weeks = new Map();

  // Pre-fill every week of the period so quiet weeks still show on the chart
  if (rangeStart && rangeEnd) {
    let cursor = startOfWeek(new Date(rangeStart), { weekStartsOn: 1 });
    const last = new Date(rangeEnd);
    while (cursor <= last) {
      weeks.set(format(cursor, "yyyy-MM-dd"), { totalMinutes: 0, absentMinutes: 0 });
      cursor = addWeeks(cursor, 1);
    }
  }

  eligible.forEach((event) => {
    const minutes = minutesBetween(event.start, event.end);
    const missed = !!isMissed(event);

    totalMinutes += minutes;
    if (missed) {
      absentMinutes += minutes;
      missedSessions += 1;
    }

    const key = normalizeTitle(event.title);
    const course = courses.get(key) || {
      title: String(event.title || "Sans titre").trim(),
      type: event.type || "",
      totalMinutes: 0,
      absentMinutes: 0,
      sessions: 0,
      missedSessions: 0,
    };
    course.totalMinutes += minutes;
    course.sessions += 1;
    if (missed) {
      course.absentMinutes += minutes;
      course.missedSessions += 1;
    }
    courses.set(key, course);

    const week = weekKey(event.start);
    const bucket = weeks.get(week) || { totalMinutes: 0, absentMinutes: 0 };
    bucket.totalMinutes += minutes;
    if (missed) bucket.absentMinutes += minutes;
    weeks.set(week, bucket);
  });

  const totalHours = totalMinutes / 60;
  const absentHours = absentMinutes / 60;
  const attendedHours = totalHours - absentHours;

  return {
    totalHours: round(totalHours, 2),
    absentHours: round(absentHours, 2),
    attendedHours: round(attendedHours, 2),
    percentage: totalHours > 0 ? round((attendedHours / totalHours) * 100) : 100,
    sessions: eligible.length,
    missedSessions,
    courses: [...courses.values()]
      .map((course) => ({
        title: course.title,
        type: course.type,
        sessions: course.sessions,
        missedSessions: course.missedSessions,
        totalHours: round(course.totalMinutes / 60, 2),
        absentHours: round(course.absentMinutes / 60, 2),
        absenceRate:
          course.totalMinutes > 0
            ? round((course.absentMinutes / course.totalMinutes) * 100)
            : 0,
      }))
      .sort(
        (a, b) =>
          b.absenceRate - a.absenceRate ||
          b.absentHours - a.absentHours ||
          a.title.localeCompare(b.title, "fr"),
      ),
    weeks: [...weeks.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([start, bucket]) => ({
        start,
        totalHours: round(bucket.totalMinutes / 60, 2),
        absentHours: round(bucket.absentMinutes / 60, 2),
      })),
  };
}
