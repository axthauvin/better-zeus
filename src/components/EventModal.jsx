import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  X,
  Clock,
  MapPin,
  User,
  Users,
  Video,
  ArrowUpRight,
  MessageSquare,
  AlignLeft,
} from "lucide-react";
import { useAttendance } from "../context/AttendanceContext";
import "./EventModal.css";
import { eventTypeDisplay } from "../utils/calendarHelpers";
import { fetchReservationDetails } from "../api";

const EventModal = ({ event, onClose, onDelete }) => {
  const {
    isEventMissed,
    isEventIgnored,
    isNonCountableEvent,
    toggleMissedEvent,
    toggleIgnoredEvent,
    toggleNonCountableEvent,
  } = useAttendance();

  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const getDetails = async () => {
      if (event && event.id && !event.isCustom) {
        setLoadingDetails(true);
        try {
          const data = await fetchReservationDetails(event.id);
          setDetails(data);
        } catch (error) {
          console.error("Failed to fetch event details:", error);
        } finally {
          setLoadingDetails(false);
        }
      }
    };

    getDetails();
  }, [event?.id, event?.isCustom]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const missed = isEventMissed(event.id);
  const ignored = isEventIgnored(event);
  const nonCountable = isNonCountableEvent(event);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const duration = () => {
    const diff = event.end - event.start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };

  const renderTextWithLinks = (text) => {
    if (!text) return null;
    // Regex to find URLs starting with http or https
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="online-link"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const typeLabel = event.isCustom
    ? "Événement personnel"
    : event.type
      ? eventTypeDisplay(event.type)
      : null;

  const attendanceRows = [
    {
      key: "missed",
      label: "Absent à ce cours",
      hint: "Cette séance uniquement.",
      active: missed,
      tone: "red",
      onToggle: () => toggleMissedEvent(event),
    },
    {
      key: "ignored",
      label: "Ignorer ce cours",
      hint: "Cours compensé : toutes ses séances sont ignorées.",
      active: ignored,
      tone: "orange",
      onToggle: () => toggleIgnoredEvent(event),
    },
    {
      key: "non-countable",
      label: "Exclure du calcul de présence",
      hint: "Toutes les séances de ce cours, de ce type.",
      active: nonCountable,
      tone: "neutral",
      onToggle: () => toggleNonCountableEvent(event),
    },
  ];

  return (
    <div
      className="bz-overlay event-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="bz-sheet event-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
      >
        <div className="event-modal-header">
          <div className="event-modal-title-section">
            {typeLabel && (
              <div className="event-modal-kind">
                <span
                  className="event-color-indicator"
                  style={{ backgroundColor: event.color }}
                />
                {typeLabel}
              </div>
            )}
            <h2 className="event-modal-title" id="event-modal-title">
              {event.title}
            </h2>
            {details?.code && (
              <div className="event-modal-code">{details.code}</div>
            )}
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
          <div className="event-info-list">
            <div className="event-info-item">
              <Clock size={16} className="event-info-icon" />
              <div className="event-info-content">
                <div className="event-info-value event-info-date">
                  {format(event.start, "EEEE d MMMM yyyy", { locale: fr })}
                </div>
                <div className="event-info-time">
                  {format(event.start, "HH:mm")} – {format(event.end, "HH:mm")}
                  <span className="event-info-duration">{duration()}</span>
                </div>
              </div>
            </div>

            {event.location && (
              <div className="event-info-item">
                <MapPin size={16} className="event-info-icon" />
                <div className="event-info-content">
                  <div className="event-info-value">{event.location}</div>
                </div>
              </div>
            )}

            {event.teacher && (
              <div className="event-info-item">
                <User size={16} className="event-info-icon" />
                <div className="event-info-content">
                  <div className="event-info-value">{event.teacher}</div>
                </div>
              </div>
            )}

            {event.groups && event.groups.length > 0 && (
              <div className="event-info-item">
                <Users size={16} className="event-info-icon" />
                <div className="event-info-content">
                  <div className="event-info-value">
                    {event.groups.join(", ")}
                  </div>
                </div>
              </div>
            )}

            {(event.onlineUrl || details?.url) && (
              <div className="event-info-item online-url">
                <Video size={16} className="event-info-icon" />
                <div className="event-info-content">
                  <a
                    href={event.onlineUrl || details.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="online-link"
                  >
                    Rejoindre la réunion
                    <ArrowUpRight size={14} strokeWidth={2} />
                  </a>
                </div>
              </div>
            )}

            {details?.comment && (
              <div className="event-info-item event-comment">
                <MessageSquare size={16} className="event-info-icon" />
                <div className="event-info-content">
                  <div className="event-info-value event-info-note">
                    {renderTextWithLinks(details.comment)}
                  </div>
                </div>
              </div>
            )}

            {event.description && (
              <div className="event-info-item event-description">
                <AlignLeft size={16} className="event-info-icon" />
                <div className="event-info-content">
                  <p className="event-description-text">
                    {renderTextWithLinks(event.description)}
                  </p>
                </div>
              </div>
            )}

            {loadingDetails && (
              <div className="event-info-loading">
                <span className="bz-spinner" />
              </div>
            )}
          </div>

          {!event.isCustom && (
            <div className="attendance-actions">
              <div className="bz-group-title">Présence</div>
              <div className="bz-group">
                {attendanceRows.map((row) => (
                  <button
                    type="button"
                    key={row.key}
                    role="switch"
                    aria-checked={row.active}
                    className={`bz-group-row attendance-action tone-${row.tone} ${row.active ? "active" : ""}`}
                    onClick={row.onToggle}
                  >
                    <span className="attendance-action-main">
                      <span className="attendance-action-label">
                        {row.label}
                      </span>
                      <span className="attendance-action-hint">
                        {row.hint}
                      </span>
                    </span>
                    <span
                      className={`bz-switch ${row.active ? "on" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {event.isCustom && onDelete && (
          <div className="event-modal-footer">
            <button
              type="button"
              className="bz-button bz-button-destructive"
              onClick={() => {
                if (
                  window.confirm(
                    "Supprimer cet événement personnel ? Cette action est irréversible.",
                  )
                ) {
                  onDelete(event.id);
                  onClose();
                }
              }}
            >
              Supprimer l'événement
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventModal;
