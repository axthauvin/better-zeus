import React, { useState, useEffect, useRef } from "react";
import {
  Ellipsis,
  ChartPie,
  Gamepad2,
  CalendarPlus,
  Download,
  FileDown,
  FileUp,
  Github,
  LogOut,
  Trash2,
} from "lucide-react";
import { createIcsFromEvents, downloadIcsFile } from "../utils/icsExport";
import { useAttendance } from "../context/AttendanceContext";
import { logout } from "../api";
import "./AppMenu.css";

/**
 * AppMenu — the toolbar "…" menu.
 * Groups attendance, calendar export, data management and account actions.
 */
const AppMenu = ({
  exportEvents = [],
  onOpenCalendarExport = () => {},
  onOpenPresence = () => {},
  onOpenGames = () => {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const { isEventIgnored, isNonCountableEvent } = useAttendance();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const run = (action) => () => {
    setIsOpen(false);
    action();
  };

  const handleExport = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("better-zeus-")) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `better-zeus-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCalendarDownload = () => {
    const exportableEvents = (exportEvents || []).filter(
      (event) => !isEventIgnored(event) && !isNonCountableEvent(event),
    );

    if (exportableEvents.length === 0) {
      alert("Aucun événement à exporter pour la vue actuelle.");
      return;
    }

    const ics = createIcsFromEvents(exportableEvents);
    const dateLabel = new Date().toISOString().split("T")[0];
    downloadIcsFile(ics, `better-zeus-planning-${dateLabel}.ics`);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith("better-zeus-")) {
            localStorage.setItem(key, value);
          }
        }
        alert("Données importées. Better Zeus va se recharger.");
        window.location.reload();
      } catch (error) {
        alert("Impossible d'importer ce fichier.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleClear = () => {
    if (
      window.confirm(
        "Effacer toutes les données de Better Zeus ?\n\nVos groupes, événements personnels et réglages de présence seront supprimés. Cette action est irréversible.",
      )
    ) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("better-zeus-")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      window.location.reload();
    }
  };

  return (
    <div className="app-menu" ref={menuRef}>
      <button
        type="button"
        className={`bz-icon-button ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Plus d'options"
        title="Plus d'options"
      >
        <Ellipsis size={19} strokeWidth={1.75} />
      </button>

      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImport}
      />

      {isOpen && (
        <div className="bz-popover bz-menu app-menu-popover" role="menu">
          <button
            type="button"
            role="menuitem"
            className="bz-menu-item"
            onClick={run(onOpenPresence)}
          >
            <ChartPie size={16} strokeWidth={1.75} />
            <span className="bz-menu-label">Suivi de présence…</span>
            <span className="bz-menu-shortcut">P</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="bz-menu-item"
            onClick={run(onOpenGames)}
          >
            <Gamepad2 size={16} strokeWidth={1.75} />
            <span className="bz-menu-label">Jeux…</span>
            <span className="bz-menu-shortcut">J</span>
          </button>

          <div className="bz-menu-separator" />
          <div className="bz-menu-heading">Calendrier</div>
          <button
            type="button"
            role="menuitem"
            className="bz-menu-item"
            onClick={run(onOpenCalendarExport)}
          >
            <CalendarPlus size={16} strokeWidth={1.75} />
            <span className="bz-menu-label">S'abonner dans mon calendrier…</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="bz-menu-item"
            onClick={run(handleCalendarDownload)}
          >
            <Download size={16} strokeWidth={1.75} />
            <span className="bz-menu-label">Télécharger la vue (.ics)</span>
          </button>

          <div className="bz-menu-separator" />
          <div className="bz-menu-heading">Données</div>
          <button
            type="button"
            role="menuitem"
            className="bz-menu-item"
            onClick={run(handleExport)}
          >
            <FileDown size={16} strokeWidth={1.75} />
            <span className="bz-menu-label">Exporter les réglages</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="bz-menu-item"
            onClick={run(() => fileInputRef.current?.click())}
          >
            <FileUp size={16} strokeWidth={1.75} />
            <span className="bz-menu-label">Importer des réglages…</span>
          </button>

          <div className="bz-menu-separator" />
          <a
            role="menuitem"
            className="bz-menu-item"
            href="https://github.com/Axthauvin/better-zeus"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
          >
            <Github size={16} strokeWidth={1.75} />
            <span className="bz-menu-label">Better Zeus sur GitHub</span>
          </a>

          <div className="bz-menu-separator" />
          <button
            type="button"
            role="menuitem"
            className="bz-menu-item"
            onClick={run(logout)}
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span className="bz-menu-label">Se déconnecter</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="bz-menu-item destructive"
            onClick={run(handleClear)}
          >
            <Trash2 size={16} strokeWidth={1.75} />
            <span className="bz-menu-label">Effacer toutes les données…</span>
          </button>

          <div className="app-menu-shortcuts">
            <span><kbd>←</kbd><kbd>→</kbd> Naviguer</span>
            <span><kbd>T</kbd> Aujourd'hui</span>
            <span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> Vues</span>
            <span><kbd>N</kbd> Événement</span>
            <span><kbd>D</kbd> Apparence</span>
            <span><kbd>P</kbd> Présence</span>
            <span><kbd>J</kbd> Jeux</span>
            <span><kbd>/</kbd> Rechercher</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppMenu;
