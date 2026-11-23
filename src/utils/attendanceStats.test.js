import { computePresenceStats } from "./attendanceStats.js";

const session = (id, title, day, startH, endH, type = "CourseType.Lecture") => ({
  id,
  title,
  type,
  start: new Date(2026, 8, day, startH, 0),
  end: new Date(2026, 8, day, endH, 0),
});

describe("computePresenceStats", () => {
  const events = [
    session(1, "Anglais", 1, 9, 11), // week of 31 Aug
    session(2, "Anglais", 8, 9, 11), // week of 7 Sep — missed
    session(3, "Réseaux", 2, 14, 17),
    session(4, "Réseaux", 9, 14, 17), // missed
    session(5, "Réseaux", 16, 14, 17),
    session(6, "Conférence", 3, 10, 12), // excluded
  ];
  const missed = new Set([2, 4]);
  const stats = computePresenceStats(events, {
    isMissed: (e) => missed.has(e.id),
    isExcluded: (e) => e.id === 6,
    rangeStart: new Date(2026, 7, 31),
    rangeEnd: new Date(2026, 8, 27),
  });

  test("computes totals on eligible sessions only", () => {
    expect(stats.sessions).toBe(5);
    expect(stats.missedSessions).toBe(2);
    expect(stats.totalHours).toBe(13);
    expect(stats.absentHours).toBe(5);
    expect(stats.attendedHours).toBe(8);
    expect(stats.percentage).toBe(61.5);
  });

  test("breaks absences down per course, most missed first", () => {
    expect(stats.courses.map((c) => c.title)).toEqual(["Anglais", "Réseaux"]);
    expect(stats.courses[0]).toMatchObject({
      sessions: 2,
      missedSessions: 1,
      totalHours: 4,
      absentHours: 2,
      absenceRate: 50,
    });
    expect(stats.courses[1].absenceRate).toBe(33.3);
  });

  test("returns every week of the period, including empty ones", () => {
    expect(stats.weeks.map((w) => w.start)).toEqual([
      "2026-08-31",
      "2026-09-07",
      "2026-09-14",
      "2026-09-21",
    ]);
    expect(stats.weeks[1]).toEqual({
      start: "2026-09-07",
      totalHours: 5,
      absentHours: 5,
    });
    expect(stats.weeks[3].totalHours).toBe(0);
  });

  test("reports 100% when there is nothing to count", () => {
    expect(computePresenceStats([]).percentage).toBe(100);
  });
});
