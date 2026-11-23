import React, { useEffect, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { buildCalendarExportLink, fetchCalendarExportToken } from "../api";
import "./EventModal.css";
import "./CalendarExportModal.css";

const CalendarExportModal = ({ selectedGroups = [], onClose }) => {
  const [exportToken, setExportToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedGroupId, setCopiedGroupId] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadToken = async () => {
      setLoading(true);
      setError("");

      if (selectedGroups.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const token = await fetchCalendarExportToken();
        if (isActive) {
          setExportToken(token);
        }
      } catch (err) {
        if (isActive) {
          setError(
            err?.message ||
              "Impossible de générer les liens de calendrier pour le moment.",
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadToken();

    return () => {
      isActive = false;
    };
  }, [selectedGroups]);

  useEffect(() => {
    if (!copiedGroupId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedGroupId(null);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copiedGroupId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleCopy = async (text, groupId) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = text;
        temporaryInput.setAttribute("readonly", "true");
        temporaryInput.style.position = "absolute";
        temporaryInput.style.left = "-9999px";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        document.execCommand("copy");
        document.body.removeChild(temporaryInput);
      }

      setCopiedGroupId(groupId);
    } catch (copyError) {
      setError(
        copyError?.message ||
          "Impossible de copier automatiquement le lien, sélectionne-le manuellement.",
      );
    }
  };

  const renderContent = () => {
    if (selectedGroups.length === 0) {
      return (
        <div className="calendar-export-empty">
          <p>Ajoutez au moins un groupe dans la barre latérale.</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="calendar-export-state">
          <span className="bz-spinner" />
          <p>Préparation des liens…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="calendar-export-state calendar-export-error">
          <p>{error}</p>
        </div>
      );
    }

    return (
      <div className="calendar-export-list">
        {selectedGroups.map((group) => {
          const link = buildCalendarExportLink(group.id, exportToken);
          const isCopied = copiedGroupId === group.id;

          return (
            <div className="calendar-export-card" key={group.id}>
              <div className="calendar-export-card-header">
                <div>
                  <p className="calendar-export-group-name">{group.name}</p>
                  <p className="calendar-export-group-id">Groupe {group.id}</p>
                </div>
                <button
                  className={`bz-button bz-button-primary calendar-export-copy ${isCopied ? "copied" : ""}`}
                  onClick={() => handleCopy(link, group.id)}
                  type="button"
                >
                  {isCopied ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <Copy size={14} strokeWidth={2} />
                  )}
                  <span>{isCopied ? "Copié" : "Copier"}</span>
                </button>
              </div>
              <input
                className="calendar-export-link"
                readOnly
                value={link}
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="bz-overlay event-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="bz-sheet event-modal calendar-export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-export-title"
      >
        <div className="event-modal-header">
          <div className="event-modal-title-section">
            <h2 className="event-modal-title" id="calendar-export-title">
              S'abonner au calendrier
            </h2>
          </div>
          <button
            className="bz-close-button"
            onClick={onClose}
            aria-label="Fermer"
            type="button"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="event-modal-body bz-scroll">
          <p className="calendar-export-description">
            Copiez le lien d'un groupe et ajoutez-le comme abonnement dans
            Calendrier, Google Agenda ou Outlook. Il se mettra à jour
            automatiquement.
          </p>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CalendarExportModal;
