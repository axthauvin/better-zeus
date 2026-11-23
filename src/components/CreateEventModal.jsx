import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { X, ChevronDown } from "lucide-react";
import { DEFAULT_CUSTOM_EVENT_COLOR } from "../utils/customEvents";
import "./CreateEventModal.css";

const CreateEventModal = ({
  isOpen,
  onClose,
  onSubmit,
  // No default here: a fresh `new Date()` each render would re-run the
  // initialisation effect and wipe what the user is typing.
  initialDate,
  initialStartTime,
  initialEndTime,
  editingEvent = null,
  onDelete,
}) => {
  const isEditing = !!editingEvent;
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);

  const getInitialDateStr = () => {
    try {
      const d = initialDate instanceof Date ? initialDate : new Date();
      return format(d, "yyyy-MM-dd");
    } catch {
      return format(new Date(), "yyyy-MM-dd");
    }
  };

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(getInitialDateStr());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [location, setLocation] = useState("");
  const [teacher, setTeacher] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUrl, setOnlineUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && editingEvent) {
      const start = new Date(editingEvent.start);
      const end = new Date(editingEvent.end);
      setTitle(editingEvent.title || "");
      setDate(format(start, "yyyy-MM-dd"));
      setStartTime(format(start, "HH:mm"));
      setEndTime(format(end, "HH:mm"));
      setLocation(editingEvent.location || "");
      setTeacher(editingEvent.teacher || "");
      setIsOnline(!!editingEvent.isOnline);
      setOnlineUrl(editingEvent.onlineUrl || "");
      setDescription(editingEvent.description || "");
      setError("");
      setShowMoreOptions(
        !!(
          editingEvent.teacher ||
          editingEvent.isOnline ||
          editingEvent.description
        ),
      );
      return;
    }

    if (isOpen) {
      setDate(getInitialDateStr());
      setTitle("");
      setLocation("");
      setTeacher("");
      setIsOnline(false);
      setOnlineUrl("");
      setDescription("");
      setError("");
      setShowMoreOptions(false);

      if (initialStartTime && initialEndTime) {
        setStartTime(initialStartTime);
        setEndTime(initialEndTime);
      } else {
        const now = new Date();
        const currentHour = now.getHours();
        const nextHour = (currentHour + 1) % 24;
        const startHStr = String(nextHour).padStart(2, "0") + ":00";
        const endHStr = String((nextHour + 1) % 24).padStart(2, "0") + ":00";
        setStartTime(startHStr);
        setEndTime(endHStr);
      }

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialDate, initialStartTime, initialEndTime, editingEvent]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Veuillez saisir un titre pour l'événement.");
      titleInputRef.current?.focus();
      return;
    }

    if (!date) {
      setError("Veuillez sélectionner une date.");
      return;
    }

    // Build Date objects
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const [year, month, day] = date.split("-").map(Number);
    const startDate = new Date(year, month - 1, day, startH, startM);
    const endDate = new Date(year, month - 1, day, endH, endM);

    if (endDate <= startDate) {
      setError("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }

    const eventPayload = {
      ...(isEditing ? { id: editingEvent.id } : {}),
      title: title.trim(),
      start: startDate,
      end: endDate,
      color: (isEditing && editingEvent.color) || DEFAULT_CUSTOM_EVENT_COLOR,
      location: location.trim(),
      teacher: teacher.trim(),
      type: "Personnel",
      description: description.trim(),
      isOnline,
      onlineUrl: isOnline ? onlineUrl.trim() : "",
      isCustom: true,
    };

    onSubmit(eventPayload);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="bz-overlay create-event-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="bz-sheet create-event-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-event-title"
      >
        <form onSubmit={handleSubmit} className="create-event-form">
          <div className="create-event-header">
            <button
              type="button"
              className="bz-button bz-button-plain create-event-header-button"
              onClick={onClose}
            >
              Annuler
            </button>
            <h2 className="create-event-title" id="create-event-title">
              {isEditing ? "Modifier l'événement" : "Nouvel événement"}
            </h2>
            <button
              type="submit"
              className="bz-button bz-button-plain create-event-header-button create-event-header-submit"
              disabled={!title.trim()}
            >
              {isEditing ? "OK" : "Ajouter"}
            </button>
          </div>

          <div className="create-event-body bz-scroll">
            {error && <div className="create-event-error">{error}</div>}

            <div className="bz-group create-event-group">
              <input
                id="custom-event-title"
                ref={titleInputRef}
                type="text"
                className="create-event-field create-event-field-title"
                placeholder="Titre"
                aria-label="Titre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <input
                id="custom-event-location"
                type="text"
                className="create-event-field"
                placeholder="Lieu"
                aria-label="Lieu"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="bz-group create-event-group">
              <div className="bz-group-row create-event-row">
                <label htmlFor="custom-event-date">Date</label>
                <input
                  id="custom-event-date"
                  type="date"
                  className="create-event-chip"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="bz-group-row create-event-row">
                <label htmlFor="custom-event-start">Début</label>
                <input
                  id="custom-event-start"
                  type="time"
                  className="create-event-chip"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="bz-group-row create-event-row">
                <label htmlFor="custom-event-end">Fin</label>
                <input
                  id="custom-event-end"
                  type="time"
                  className="create-event-chip"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="button"
              className="more-options-toggle-btn"
              onClick={() => setShowMoreOptions((prev) => !prev)}
              aria-expanded={showMoreOptions}
            >
              <span>{showMoreOptions ? "Moins d'options" : "Plus d'options"}</span>
              <ChevronDown
                size={14}
                strokeWidth={2.25}
                className={`toggle-chevron ${showMoreOptions ? "open" : ""}`}
              />
            </button>

            {showMoreOptions && (
              <div className="more-options-section">
                <div className="bz-group create-event-group">
                  <input
                    id="custom-event-teacher"
                    type="text"
                    className="create-event-field"
                    placeholder="Intervenant"
                    aria-label="Intervenant"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                  />
                </div>

                <div className="bz-group create-event-group">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOnline}
                    className="bz-group-row create-event-row create-event-switch-row"
                    onClick={() => setIsOnline((prev) => !prev)}
                  >
                    <span>En ligne</span>
                    <span
                      className={`bz-switch ${isOnline ? "on" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOnline && (
                    <input
                      id="custom-event-url"
                      type="url"
                      className="create-event-field"
                      placeholder="Lien de la réunion"
                      aria-label="Lien de la réunion"
                      value={onlineUrl}
                      onChange={(e) => setOnlineUrl(e.target.value)}
                    />
                  )}
                </div>

                <div className="bz-group create-event-group">
                  <textarea
                    id="custom-event-description"
                    className="create-event-field create-event-notes"
                    rows={3}
                    placeholder="Notes"
                    aria-label="Notes"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}

            {isEditing && onDelete && (
              <button
                type="button"
                className="bz-button bz-button-destructive create-event-delete"
                onClick={() => {
                  if (
                    window.confirm(
                      "Supprimer cet événement ? Cette action est irréversible.",
                    )
                  ) {
                    onDelete(editingEvent.id);
                    onClose();
                  }
                }}
              >
                Supprimer l'événement
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
