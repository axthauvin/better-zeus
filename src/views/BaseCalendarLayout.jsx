import React from "react";
import { fr } from "date-fns/locale";
import {
  Search,
  PanelLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { MyDayPicker } from "../components/DayPicker";
import EventModal from "../components/EventModal";
import CreateEventModal from "../components/CreateEventModal";
import AppMenu from "../components/AppMenu";
import PresenceSheet from "../components/PresenceSheet";
import "../components/WeekCalendar.css";
import "./BaseCalendarLayout.css";

const VIEWS = [
  { id: "day", label: "Jour", shortcut: "J" },
  { id: "week", label: "Semaine", shortcut: "S" },
  { id: "month", label: "Mois", shortcut: "M" },
];

const PERIOD_LABELS = {
  day: { previous: "Jour précédent", next: "Jour suivant" },
  week: { previous: "Semaine précédente", next: "Semaine suivante" },
  month: { previous: "Mois précédent", next: "Mois suivant" },
};

const isTypingTarget = (element) =>
  !!element &&
  (["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) ||
    element.isContentEditable);

/**
 * BaseCalendarLayout - Shared layout component for calendar views
 * Provides the toolbar (title, navigation, view switcher, search, actions)
 * and keyboard shortcuts.
 */
const BaseCalendarLayout = ({
  view = "week",
  onViewChange,
  currentDate,
  onPrevious,
  onNext,
  onToday,
  onDateChange,
  titleStrong,
  titleLight,
  subtitle,
  loading = false,
  eventSearchQuery = "",
  onEventSearchQueryChange = () => {},
  theme = "light",
  onToggleTheme = () => {},
  onToggleSidebar = () => {},
  onOpenCalendarExport = () => {},
  exportEvents = [],
  selectedEvent,
  onCloseModal,
  onCreateEvent,
  onDeleteEvent,
  onOpenRoomSchedule,
  onOpenCreateModal,
  createModalState,
  onCloseCreateModal,
  children,
  className = "",
}) => {
  const [internalCreateModalOpen, setInternalCreateModalOpen] =
    React.useState(false);
  const [isPresenceOpen, setIsPresenceOpen] = React.useState(false);
  const searchInputRef = React.useRef(null);

  const openCreateModal = () => {
    if (onOpenCreateModal) {
      onOpenCreateModal({ date: currentDate });
    } else {
      setInternalCreateModalOpen(true);
    }
  };

  // Keep the latest handlers in a ref so the keydown listener stays stable
  const handlersRef = React.useRef({});
  handlersRef.current = {
    onPrevious,
    onNext,
    onToday,
    onViewChange,
    openCreateModal,
    onToggleTheme,
    openPresence: () => setIsPresenceOpen(true),
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      // Ignore shortcuts while a sheet or popover is open
      if (document.querySelector(".bz-overlay, .bz-popover")) return;

      const handlers = handlersRef.current;
      const key = e.key.toLowerCase();

      if (e.key === "ArrowLeft") handlers.onPrevious?.();
      else if (e.key === "ArrowRight") handlers.onNext?.();
      else if (key === "t") handlers.onToday?.();
      else if (key === "j") handlers.onViewChange?.("day");
      else if (key === "s") handlers.onViewChange?.("week");
      else if (key === "m") handlers.onViewChange?.("month");
      else if (key === "n") handlers.openCreateModal?.();
      else if (key === "d") handlers.onToggleTheme?.();
      else if (key === "p") handlers.openPresence?.();
      else if (e.key === "/") searchInputRef.current?.focus();
      else return;

      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const periodLabels = PERIOD_LABELS[view] || PERIOD_LABELS.week;

  return (
    <div className={`calendar-view ${className}`}>
      <header className="calendar-toolbar">
        <div className="toolbar-leading">
          <button
            type="button"
            className="bz-icon-button"
            onClick={onToggleSidebar}
            aria-label="Afficher ou masquer la barre latérale"
            title="Barre latérale"
          >
            <PanelLeft size={18} strokeWidth={1.75} />
          </button>

          <div className="toolbar-title">
            <MyDayPicker
              value={currentDate}
              onChange={onDateChange}
              locale={fr}
              mode={view}
              triggerClassName="toolbar-title-button"
              triggerLabel="Choisir une date"
            >
              <h1 className="toolbar-heading">
                <strong>{titleStrong}</strong>
                {titleLight && <span> {titleLight}</span>}
              </h1>
              <ChevronDown
                size={16}
                strokeWidth={2.25}
                className="toolbar-title-chevron"
              />
            </MyDayPicker>
            {(subtitle || loading) && (
              <div className="toolbar-subtitle">
                {subtitle && <span>{subtitle}</span>}
                {loading && (
                  <span
                    className="bz-spinner toolbar-spinner"
                    role="status"
                    aria-label="Chargement"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-views">
          <div
            className="bz-segmented"
            role="tablist"
            aria-label="Affichage du calendrier"
          >
            {VIEWS.map(({ id, label, shortcut }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                className={`bz-segmented-item ${view === id ? "active" : ""}`}
                onClick={() => view !== id && onViewChange(id)}
                title={`${label} (${shortcut})`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-search">
          <label className="bz-search">
            <Search size={14} strokeWidth={2} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher"
              value={eventSearchQuery}
              onChange={(e) => onEventSearchQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onEventSearchQueryChange("");
                  e.currentTarget.blur();
                }
              }}
              aria-label="Rechercher un cours, un enseignant ou une salle"
            />
            {eventSearchQuery && (
              <button
                type="button"
                className="bz-search-clear"
                onClick={() => {
                  onEventSearchQueryChange("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Effacer la recherche"
              >
                <X size={10} strokeWidth={3} />
              </button>
            )}
          </label>
        </div>

        <div className="toolbar-nav">
          <div className="toolbar-nav-group">
            <button
              type="button"
              className="toolbar-nav-button"
              onClick={onPrevious}
              aria-label={periodLabels.previous}
              title={`${periodLabels.previous} (←)`}
            >
              <ChevronLeft size={17} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="toolbar-nav-button toolbar-today"
              onClick={onToday}
              title="Aujourd'hui (T)"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              className="toolbar-nav-button"
              onClick={onNext}
              aria-label={periodLabels.next}
              title={`${periodLabels.next} (→)`}
            >
              <ChevronRight size={17} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className="bz-icon-button"
            onClick={openCreateModal}
            aria-label="Nouvel événement"
            title="Nouvel événement (N)"
          >
            <Plus size={19} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="bz-icon-button theme-toggle"
            onClick={onToggleTheme}
            aria-label={
              theme === "dark"
                ? "Passer en apparence claire"
                : "Passer en apparence sombre"
            }
            title={
              theme === "dark" ? "Apparence claire (D)" : "Apparence sombre (D)"
            }
          >
            {theme === "dark" ? (
              <Sun size={18} strokeWidth={1.75} />
            ) : (
              <Moon size={17} strokeWidth={1.75} />
            )}
          </button>
          <AppMenu
            exportEvents={exportEvents}
            onOpenCalendarExport={onOpenCalendarExport}
            onOpenPresence={() => setIsPresenceOpen(true)}
          />
        </div>
      </header>

      {children}

      {isPresenceOpen && (
        <PresenceSheet onClose={() => setIsPresenceOpen(false)} />
      )}

      {selectedEvent && !selectedEvent.isCustom && (
        <EventModal
          event={selectedEvent}
          onClose={onCloseModal}
          onDelete={onDeleteEvent}
          onOpenRoomSchedule={
            onOpenRoomSchedule
              ? (roomName) => {
                  onOpenRoomSchedule(roomName);
                  onCloseModal();
                }
              : undefined
          }
        />
      )}

      {/* Personal events open straight into the edit sheet */}
      {selectedEvent?.isCustom && (
        <CreateEventModal
          isOpen
          editingEvent={selectedEvent}
          onClose={onCloseModal}
          onSubmit={onCreateEvent}
          onDelete={onDeleteEvent}
        />
      )}

      {createModalState ? (
        <CreateEventModal
          isOpen={createModalState.isOpen}
          onClose={onCloseCreateModal}
          onSubmit={onCreateEvent}
          initialDate={createModalState.date || currentDate}
          initialStartTime={createModalState.startTime}
          initialEndTime={createModalState.endTime}
        />
      ) : (
        <CreateEventModal
          isOpen={internalCreateModalOpen}
          onClose={() => setInternalCreateModalOpen(false)}
          onSubmit={onCreateEvent}
          initialDate={currentDate}
        />
      )}
    </div>
  );
};

export default BaseCalendarLayout;
