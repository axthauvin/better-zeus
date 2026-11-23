import React, { useState, useEffect, useMemo } from "react";
import { X, RefreshCw, ChevronDown, Search, Check } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useAttendance } from "../context/AttendanceContext";
import { getUserGroups } from "../api";
import "./EventModal.css";
import "./PresenceSheet.css";

const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const formatHours = (hours = 0) => {
  const value = Math.round(hours * 10) / 10;
  return `${value.toLocaleString("fr-FR")} h`;
};

const formatPercent = (value = 0) =>
  `${(Math.round(value * 10) / 10).toLocaleString("fr-FR")} %`;

// Clean y-axis maximum: 1, 2, 4, 5, 10, 20… so ticks stay round
const niceAxis = (max) => {
  if (max <= 0) return { top: 4, step: 2 };
  const steps = [1, 2, 4, 5, 10, 20, 25, 50];
  const step = steps.find((s) => max / s <= 3) || 50;
  return { top: Math.ceil(max / step) * step, step };
};

/* ------------------------------------------------------------------ */
/* Weekly absences — column chart                                       */
/* ------------------------------------------------------------------ */

const WeeklyAbsenceChart = ({ weeks }) => {
  const [hovered, setHovered] = useState(null);
  const maxAbsent = Math.max(0, ...weeks.map((w) => w.absentHours));
  const { top, step } = niceAxis(maxAbsent);
  const ticks = [];
  for (let t = 0; t <= top; t += step) ticks.push(t);

  const active = hovered !== null ? weeks[hovered] : null;

  return (
    <figure className="presence-chart" aria-label="Heures d'absence par semaine">
      <div className="presence-chart-body">
        <div className="presence-chart-yaxis" aria-hidden="true">
          {[...ticks].reverse().map((t) => (
            <span key={t}>{t} h</span>
          ))}
        </div>

        <div className="presence-chart-plot">
          {ticks.map((t) => (
            <span
              key={t}
              className="presence-chart-grid"
              style={{ bottom: `${(t / top) * 100}%` }}
              aria-hidden="true"
            />
          ))}

          <div className="presence-chart-columns">
            {weeks.map((week, index) => {
              const height = (week.absentHours / top) * 100;
              const label = `Semaine du ${format(parseISO(week.start), "d MMMM", { locale: fr })} : ${formatHours(week.absentHours)} d'absence sur ${formatHours(week.totalHours)} de cours`;
              return (
                <div
                  key={week.start}
                  className={`presence-chart-slot ${hovered === index ? "hovered" : ""}`}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                  tabIndex={0}
                  role="img"
                  aria-label={label}
                >
                  {week.absentHours > 0 && (
                    <span
                      className="presence-chart-bar"
                      style={{ height: `${height}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {active && (
            <div
              className="presence-chart-tooltip"
              style={{
                // keep the tooltip inside the plot near both edges
                left: `${Math.min(86, Math.max(14, ((hovered + 0.5) / weeks.length) * 100))}%`,
              }}
              role="presentation"
            >
              <strong>
                {format(parseISO(active.start), "d", { locale: fr })} –{" "}
                {format(addDays(parseISO(active.start), 6), "d MMM", {
                  locale: fr,
                })}
              </strong>
              <span>
                {active.absentHours > 0
                  ? `${formatHours(active.absentHours)} d'absence`
                  : "Aucune absence"}
              </span>
              <span className="muted">
                {formatHours(active.totalHours)} de cours
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="presence-chart-xaxis" aria-hidden="true">
        {weeks.map((week, index) => {
          // A week belongs to the month of its Thursday (ISO convention)
          const date = addDays(parseISO(week.start), 3);
          const previous =
            index > 0 ? addDays(parseISO(weeks[index - 1].start), 3) : null;
          const showMonth = !previous || previous.getMonth() !== date.getMonth();
          return (
            <span key={week.start}>
              {showMonth ? format(date, "MMM", { locale: fr }) : ""}
            </span>
          );
        })}
      </div>

      {maxAbsent === 0 && (
        <p className="presence-chart-empty">Aucune absence sur la période</p>
      )}
    </figure>
  );
};

/* ------------------------------------------------------------------ */
/* Per-course absences — ranked meters                                  */
/* ------------------------------------------------------------------ */

const CourseAbsenceList = ({ courses }) => {
  const [sortBy, setSortBy] = useState("rate");

  const sorted = useMemo(() => {
    const list = [...courses];
    if (sortBy === "hours") {
      list.sort(
        (a, b) =>
          b.absentHours - a.absentHours ||
          b.absenceRate - a.absenceRate ||
          a.title.localeCompare(b.title, "fr"),
      );
    }
    return list;
  }, [courses, sortBy]);

  return (
    <section className="presence-section">
      <div className="presence-section-header">
        <h3>Absences par cours</h3>
        <div className="bz-segmented presence-sort" role="tablist">
          {[
            { id: "rate", label: "%" },
            { id: "hours", label: "Heures" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={sortBy === id}
              className={`bz-segmented-item ${sortBy === id ? "active" : ""}`}
              onClick={() => setSortBy(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ol className="presence-course-list">
        {sorted.map((course) => {
          const hasAbsence = course.missedSessions > 0;
          return (
            <li
              key={course.title}
              className={`presence-course ${hasAbsence ? "" : "clean"}`}
            >
              <div className="presence-course-head">
                <span className="presence-course-title">{course.title}</span>
                <span className="presence-course-rate">
                  {formatPercent(course.absenceRate)}
                </span>
              </div>
              <div
                className="presence-course-meter"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={course.absenceRate}
                aria-label={`${course.title} : ${formatPercent(course.absenceRate)} d'absence`}
              >
                {hasAbsence && (
                  <span
                    className="presence-course-fill"
                    style={{ width: `${Math.max(course.absenceRate, 2)}%` }}
                  />
                )}
              </div>
              <div className="presence-course-meta">
                {hasAbsence
                  ? `${course.missedSessions} séance${course.missedSessions > 1 ? "s" : ""} manquée${course.missedSessions > 1 ? "s" : ""} sur ${course.sessions} · ${formatHours(course.absentHours)}`
                  : `${course.sessions} séance${course.sessions > 1 ? "s" : ""}, aucune absence`}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Sheet                                                                */
/* ------------------------------------------------------------------ */

/**
 * PresenceSheet — attendance dashboard, opened from the "…" menu.
 */
const PresenceSheet = ({ onClose }) => {
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGroups, setShowGroups] = useState(false);

  const {
    presenceGroupId,
    setPresenceGroupId,
    semesterStartDate,
    setSemesterStartDate,
    lastPresenceRefresh,
    presenceStats,
    isRefreshingPresence,
    refreshPresenceStats,
    attendanceThreshold,
    setAttendanceThreshold,
  } = useAttendance();

  const canSync = !!presenceGroupId && !!semesterStartDate;

  useEffect(() => {
    const formattedGroups = getUserGroups()
      .map((group) => ({
        id: group.id || group.value?.id,
        name: String(group.name || group.value?.name || "Groupe sans nom"),
        path: String(group.path || ""),
      }))
      .filter((g) => g.name !== "0" && g.id);

    formattedGroups.sort((a, b) =>
      (a.path + a.name).localeCompare(b.path + b.name, "fr"),
    );
    setGroups(formattedGroups);
  }, []);

  // Recompute on open so freshly marked absences show up immediately
  useEffect(() => {
    if (canSync) refreshPresenceStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenceGroupId, semesterStartDate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (showGroups) {
        setShowGroups(false);
      } else {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showGroups]);

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.path.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedGroupName = presenceGroupId
    ? groups.find((g) => String(g.id) === String(presenceGroupId))?.name ||
      "Classe sélectionnée"
    : null;

  const percentage = presenceStats ? Number(presenceStats.percentage) || 0 : 0;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const isPassing = percentage >= attendanceThreshold;
  const courses = presenceStats?.courses || [];
  const weeks = presenceStats?.weeks || [];
  const mostMissed = courses.find((c) => c.missedSessions > 0);

  const formatDate = (dateStr) =>
    format(new Date(dateStr), "d MMMM 'à' HH:mm", { locale: fr });

  return (
    <div
      className="bz-overlay presence-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bz-sheet event-modal presence-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="presence-sheet-title"
      >
        <div className="event-modal-header">
          <div className="event-modal-title-section">
            <h2 className="event-modal-title" id="presence-sheet-title">
              Suivi de présence
            </h2>
            <p className="presence-sheet-subtitle">
              {selectedGroupName && semesterStartDate
                ? `${selectedGroupName} · depuis le ${format(parseISO(semesterStartDate), "d MMMM yyyy", { locale: fr })}`
                : "Calculé à partir des cours passés de votre classe."}
            </p>
          </div>
          <button
            type="button"
            className="bz-close-button"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="event-modal-body bz-scroll">
          {presenceStats ? (
            <>
              <div className="presence-overview">
                <div
                  className={`presence-ring ${isPassing ? "passing" : "failing"}`}
                  aria-label={`Taux de présence : ${formatPercent(percentage)}`}
                  role="img"
                >
                  <svg viewBox="0 0 80 80" aria-hidden="true">
                    <circle
                      className="presence-ring-track"
                      cx="40"
                      cy="40"
                      r={RING_RADIUS}
                    />
                    <circle
                      className="presence-ring-value"
                      cx="40"
                      cy="40"
                      r={RING_RADIUS}
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={
                        RING_CIRCUMFERENCE * (1 - clampedPercentage / 100)
                      }
                    />
                  </svg>
                  <span className="presence-ring-label">
                    {(Math.round(percentage * 10) / 10).toLocaleString(
                      "fr-FR",
                    )}
                    <small>%</small>
                  </span>
                </div>

                <div className="presence-tiles">
                  <div className="presence-tile">
                    <span className="presence-tile-label">Présence</span>
                    <span className="presence-tile-value">
                      {formatHours(presenceStats.attendedHours)}
                    </span>
                    <span className="presence-tile-detail">
                      sur {formatHours(presenceStats.totalHours)} de cours
                    </span>
                  </div>
                  <div className="presence-tile">
                    <span className="presence-tile-label">Absences</span>
                    <span className="presence-tile-value">
                      {formatHours(presenceStats.absentHours)}
                    </span>
                    <span className="presence-tile-detail">
                      {presenceStats.missedSessions ?? 0} séance
                      {(presenceStats.missedSessions ?? 0) > 1 ? "s" : ""}{" "}
                      manquée
                      {(presenceStats.missedSessions ?? 0) > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="presence-tile">
                    <span className="presence-tile-label">Le plus manqué</span>
                    <span
                      className="presence-tile-value presence-tile-text"
                      title={mostMissed?.title}
                    >
                      {mostMissed ? mostMissed.title : "Aucun"}
                    </span>
                    <span className="presence-tile-detail">
                      {mostMissed
                        ? `${formatPercent(mostMissed.absenceRate)} d'absence`
                        : "Rien à signaler"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`presence-threshold ${isPassing ? "" : "below"}`}>
                <span className="presence-threshold-dot" aria-hidden="true" />
                {isPassing
                  ? `Au-dessus du seuil de validation (${attendanceThreshold} %)`
                  : `Sous le seuil de validation (${attendanceThreshold} %)`}
              </div>

              {weeks.length > 0 && (
                <section className="presence-section">
                  <div className="presence-section-header">
                    <h3>Absences par semaine</h3>
                  </div>
                  <WeeklyAbsenceChart weeks={weeks} />
                </section>
              )}

              {courses.length > 0 && <CourseAbsenceList courses={courses} />}
            </>
          ) : (
            <div className="presence-empty">
              Choisissez votre classe et la date de début du semestre :
              Better Zeus calcule ensuite votre taux de présence, vos absences
              par semaine et par cours.
            </div>
          )}

          <section className="presence-section">
            <div className="presence-section-header">
              <h3>Réglages</h3>
            </div>
            <div className="bz-group presence-settings">
              <div className="bz-group-row presence-field">
                <span className="presence-field-label">Classe</span>
                <button
                  type="button"
                  className={`presence-search-trigger ${showGroups ? "active" : ""}`}
                  onClick={() => setShowGroups((open) => !open)}
                  aria-expanded={showGroups}
                >
                  <span className={selectedGroupName ? "" : "placeholder"}>
                    {selectedGroupName || "Choisir"}
                  </span>
                  <ChevronDown size={14} className="chevron-icon" />
                </button>
              </div>

              {showGroups && (
                <div className="presence-groups-dropdown">
                  <label className="bz-search presence-search">
                    <Search size={13} strokeWidth={2} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Rechercher une classe"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </label>
                  <div className="presence-groups-list bz-scroll">
                    {filteredGroups.map((group) => {
                      const isSelected =
                        String(presenceGroupId) === String(group.id);
                      return (
                        <button
                          type="button"
                          key={group.id}
                          className={`presence-group-item ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setPresenceGroupId(group.id);
                            setShowGroups(false);
                            setSearchQuery("");
                          }}
                        >
                          <span className="group-item-content">
                            <span className="group-item-name">
                              {group.name}
                            </span>
                            {group.path && (
                              <span className="group-item-path">
                                {group.path.split("/").join(" › ")}
                              </span>
                            )}
                          </span>
                          {isSelected && <Check size={14} strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                    {filteredGroups.length === 0 && (
                      <div className="presence-no-results">Aucun résultat</div>
                    )}
                  </div>
                </div>
              )}

              <div className="bz-group-row presence-field">
                <label
                  className="presence-field-label"
                  htmlFor="presence-semester-start"
                >
                  Début du semestre
                </label>
                <input
                  id="presence-semester-start"
                  type="date"
                  className="presence-date-input"
                  value={semesterStartDate}
                  onChange={(e) => setSemesterStartDate(e.target.value)}
                  max={format(new Date(), "yyyy-MM-dd")}
                />
              </div>

              <div className="bz-group-row presence-field">
                <label
                  className="presence-field-label"
                  htmlFor="presence-threshold"
                >
                  Seuil de validation
                </label>
                <span className="presence-threshold-input">
                  <input
                    id="presence-threshold"
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    value={attendanceThreshold}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!Number.isNaN(value)) {
                        setAttendanceThreshold(
                          Math.max(0, Math.min(100, value)),
                        );
                      }
                    }}
                  />
                  %
                </span>
              </div>
            </div>
            <p className="presence-footnote">
              Marquez vos absences en ouvrant un cours dans le calendrier.
            </p>
          </section>
        </div>

        <div className="event-modal-footer presence-footer">
          <span className="refresh-time">
            {isRefreshingPresence
              ? "Synchronisation…"
              : lastPresenceRefresh
                ? `Mis à jour le ${formatDate(lastPresenceRefresh)}`
                : "Jamais synchronisé"}
          </span>
          <button
            type="button"
            className="bz-button bz-button-primary"
            onClick={refreshPresenceStats}
            disabled={isRefreshingPresence || !canSync}
          >
            <RefreshCw
              size={14}
              strokeWidth={2}
              className={isRefreshingPresence ? "spinning" : ""}
            />
            Synchroniser
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresenceSheet;
