import React, { useState, useEffect } from "react";
import { getUserGroups } from "../api";
import "./GroupSelector.css";
import { Search, Plus, Check, X } from "lucide-react";
import BrandMark from "./BrandMark";

const MODES = [
  { id: "groups", label: "Groupes" },
  { id: "rooms", label: "Salles" },
  { id: "teachers", label: "Enseignants" },
];

const SEARCH_PLACEHOLDERS = {
  groups: "Rechercher un groupe",
  rooms: "Rechercher une salle",
  teachers: "Rechercher un enseignant",
};

const GroupSelector = ({
  selectionMode,
  selectedGroups,
  enabledGroups = [],
  onGroupsChange,
  onToggleGroupEnabled = () => {},
  availableRooms = [],
  selectedRooms = [],
  onRoomsChange = () => {},
  availableTeachers = [],
  selectedTeachers = [],
  onTeachersChange = () => {},
  onSelectionModeChange = () => {},
}) => {
  const [allGroups, setAllGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const getHierarchyDepth = (groupPath) => {
    if (!groupPath || typeof groupPath !== "string") return 0;
    return groupPath.split("/").filter(Boolean).length;
  };

  const getHighestHierarchyGroup = () => {
    const candidates = allGroups.filter(
      (group) => group.id && group.name !== "0",
    );

    if (candidates.length === 0) {
      return null;
    }

    return [...candidates].sort((a, b) => {
      const depthDiff = getHierarchyDepth(a.path) - getHierarchyDepth(b.path);
      if (depthDiff !== 0) {
        return depthDiff;
      }
      return String(a.name).localeCompare(String(b.name), "fr");
    })[0];
  };

  useEffect(() => {
    const loadGroups = () => {
      try {
        setLoading(true);
        const groups = getUserGroups();
        const formattedGroups = groups.map((group) => ({
          id: group.id || group.value?.id,
          name: group.name || group.value?.name || "Groupe sans nom",
          path: group.path ? String(group.path) : "",
        }));
        setAllGroups(formattedGroups);
      } catch (error) {
        console.error("Erreur lors du chargement des groupes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  const filteredGroups = allGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredRooms = availableRooms.filter((room) =>
    room.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTeachers = availableTeachers.filter((teacher) =>
    teacher.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedGroupsData = allGroups.filter((group) =>
    selectedGroups.includes(group.id),
  );

  const unselectedFilteredGroups = filteredGroups.filter(
    (group) => !selectedGroups.includes(group.id),
  );

  const selectedRoomsData = availableRooms.filter((room) =>
    selectedRooms.includes(room),
  );

  const unselectedFilteredRooms = filteredRooms.filter(
    (room) => !selectedRooms.includes(room),
  );

  const selectedTeachersData = availableTeachers.filter((teacher) =>
    selectedTeachers.includes(teacher),
  );

  const unselectedFilteredTeachers = filteredTeachers.filter(
    (teacher) => !selectedTeachers.includes(teacher),
  );

  const handleGroupToggle = (groupId) => {
    const isSelected = selectedGroups.includes(groupId);
    const newSelectedGroups = isSelected
      ? selectedGroups.filter((id) => id !== groupId)
      : [...selectedGroups, groupId];

    onGroupsChange(newSelectedGroups);
  };

  const handleRoomToggle = (roomName) => {
    const isSelected = selectedRooms.includes(roomName);
    const newSelectedRooms = isSelected ? [] : [roomName];
    onRoomsChange(newSelectedRooms);
  };

  const handleTeacherToggle = (teacherName) => {
    const isSelected = selectedTeachers.includes(teacherName);
    const newSelectedTeachers = isSelected ? [] : [teacherName];
    onTeachersChange(newSelectedTeachers);
  };

  const handleSelectionMode = (nextMode) => {
    if (nextMode === selectionMode) {
      return;
    }
    onSelectionModeChange(nextMode);
  };

  const highestHierarchyGroup = getHighestHierarchyGroup();

  const header = (
    <div className="sidebar-header">
      <div className="sidebar-brand">
        <BrandMark className="sidebar-brand-mark" />
        <span className="sidebar-brand-name">Better Zeus</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="group-selector">
        {header}
        <div className="sidebar-empty">
          <span className="bz-spinner" />
        </div>
      </div>
    );
  }

  // Selected items (top section) for the current mode
  const selectedSection =
    selectionMode === "groups"
      ? {
          title: "Mes groupes",
          items: selectedGroupsData.map((group) => ({
            key: group.id,
            label: group.name,
            enabled: enabledGroups.includes(group.id),
            onToggle: () => onToggleGroupEnabled(group.id),
            onRemove: () => handleGroupToggle(group.id),
          })),
          onClear: () => onGroupsChange([]),
        }
      : selectionMode === "rooms"
        ? {
            title: "Salle affichée",
            items: selectedRoomsData.map((room) => ({
              key: room,
              label: room,
              enabled: true,
              onRemove: () => handleRoomToggle(room),
            })),
            onClear: () => onRoomsChange([]),
          }
        : {
            title: "Enseignant affiché",
            items: selectedTeachersData.map((teacher) => ({
              key: teacher,
              label: teacher,
              enabled: true,
              onRemove: () => handleTeacherToggle(teacher),
            })),
            onClear: () => onTeachersChange([]),
          };

  // Available items (bottom section) for the current mode
  const availableSection =
    selectionMode === "groups"
      ? {
          title: "Tous les groupes",
          items: unselectedFilteredGroups.map((group) => ({
            key: group.id,
            label: group.name,
            detail: group.path,
            onAdd: () => handleGroupToggle(group.id),
          })),
          empty:
            searchQuery === "" && selectedGroups.length === allGroups.length
              ? "Tous les groupes sont sélectionnés"
              : "Aucun groupe trouvé",
        }
      : selectionMode === "rooms"
        ? {
            title: "Salles",
            items: unselectedFilteredRooms.map((room) => ({
              key: room,
              label: room,
              onAdd: () => handleRoomToggle(room),
            })),
            empty:
              availableRooms.length === 0
                ? "Aucune salle sur cette période"
                : "Aucune salle trouvée",
          }
        : {
            title: "Enseignants",
            items: unselectedFilteredTeachers.map((teacher) => ({
              key: teacher,
              label: teacher,
              onAdd: () => handleTeacherToggle(teacher),
            })),
            empty:
              availableTeachers.length === 0
                ? "Aucun enseignant sur cette période"
                : "Aucun enseignant trouvé",
          };

  const addLabel = selectionMode === "groups" ? "Ajouter" : "Afficher";

  return (
    <div className="group-selector">
      {header}

      <div className="sidebar-controls">
        <div className="bz-segmented sidebar-modes" role="tablist">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selectionMode === id}
              className={`bz-segmented-item ${selectionMode === id ? "active" : ""}`}
              onClick={() => handleSelectionMode(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="bz-search sidebar-search">
          <Search size={14} strokeWidth={2} />
          <input
            type="text"
            placeholder={SEARCH_PLACEHOLDERS[selectionMode]}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchQuery("");
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="bz-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Effacer la recherche"
            >
              <X size={10} strokeWidth={3} />
            </button>
          )}
        </label>
      </div>

      <div className="sidebar-scroll bz-scroll">
        {selectedSection.items.length > 0 && (
          <section className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">
                {selectedSection.title}
              </span>
              <button
                type="button"
                className="sidebar-section-action"
                onClick={selectedSection.onClear}
              >
                Tout retirer
              </button>
            </div>
            <ul className="sidebar-list">
              {selectedSection.items.map((item) => (
                <li
                  key={item.key}
                  className={`sidebar-row selected ${item.enabled ? "" : "disabled"}`}
                >
                  <button
                    type="button"
                    className="sidebar-row-main"
                    onClick={item.onToggle}
                    disabled={!item.onToggle}
                    aria-pressed={item.onToggle ? item.enabled : undefined}
                    title={
                      item.onToggle
                        ? item.enabled
                          ? "Masquer du calendrier"
                          : "Afficher dans le calendrier"
                        : undefined
                    }
                  >
                    <span
                      className={`sidebar-check ${item.enabled ? "checked" : ""}`}
                      aria-hidden="true"
                    >
                      {item.enabled && <Check size={12} strokeWidth={3.5} />}
                    </span>
                    <span className="sidebar-row-label">{item.label}</span>
                  </button>
                  <button
                    type="button"
                    className="sidebar-row-accessory"
                    onClick={item.onRemove}
                    aria-label={`Retirer ${item.label}`}
                    title="Retirer"
                  >
                    <X size={13} strokeWidth={2.25} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="sidebar-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">
              {availableSection.title}
            </span>
          </div>
          {availableSection.items.length === 0 ? (
            <p className="sidebar-empty-text">{availableSection.empty}</p>
          ) : (
            <ul className="sidebar-list">
              {availableSection.items.map((item) => (
                <li key={item.key} className="sidebar-row">
                  <button
                    type="button"
                    className="sidebar-row-main"
                    onClick={item.onAdd}
                    title={`${addLabel} ${item.label}`}
                  >
                    <span className="sidebar-row-text">
                      <span className="sidebar-row-label">{item.label}</span>
                      {item.detail && (
                        <span className="sidebar-row-detail">
                          {String(item.detail).split("/").join(" › ")}
                        </span>
                      )}
                    </span>
                    <span className="sidebar-row-add" aria-hidden="true">
                      <Plus size={13} strokeWidth={2.5} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {(selectionMode === "rooms" || selectionMode === "teachers") &&
        highestHierarchyGroup && (
          <p className="sidebar-footnote">
            Recherche sur l'ensemble de « {highestHierarchyGroup.name} » pour
            la période affichée.
          </p>
        )}
    </div>
  );
};

export default GroupSelector;
