import React, { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "./DayPicker.css";
import { Calendar } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  format,
  subDays,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";

export const enTranslations = {
  Today: "Today",
  Tomorrow: "Tomorrow",
  "This week": "This week",
  "Next week": "Next week",
  Next: "Next",
  Previous: "Previous",
};

export const frTranslations = {
  Today: "Aujourd'hui",
  Tomorrow: "Demain",
  "This week": "Cette semaine",
  "Next week": "La semaine prochaine",
  Next: "Suivant",
  Previous: "Précédent",
};

function translate(label, localeCode) {
  if (localeCode === "fr") {
    return frTranslations[label] || label;
  }
  return enTranslations[label] || label;
}

export function MyDayPicker({
  value,
  onChange,
  locale,
  mode = "single",
  children,
  triggerClassName = "btn-select-event",
  triggerLabel,
}) {
  const [opened, setOpened] = useState(false);
  const [hoveredWeek, setHoveredWeek] = useState(null);
  const [displayMonth, setDisplayMonth] = useState(value || new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    if (!opened) return undefined;
    setDisplayMonth(value || new Date());

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpened(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpened(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [opened]);

  const DayModePresets = [
    {
      label: translate("Today", locale.code),
      getValue: () => new Date(),
    },
    {
      label: translate("Tomorrow", locale.code),
      getValue: () => subDays(new Date(), -1),
    },
  ];

  const MonthModePresets = [
    {
      label: "Ce mois-ci",
      getValue: () => new Date(),
    },
    {
      label: "Le mois prochain",
      getValue: () => subMonths(new Date(), -1),
    },
  ];

  const WeekModePresets = [
    {
      label: translate("This week", locale.code),
      getValue: () => startOfWeek(new Date(), { locale, weekStartsOn: 1 }),
    },
    {
      label: translate("Next week", locale.code),
      getValue: () =>
        startOfWeek(subWeeks(new Date(), -1), { locale, weekStartsOn: 1 }),
    },
  ];

  const presets =
    mode === "week"
      ? WeekModePresets
      : mode === "month"
        ? MonthModePresets
        : DayModePresets;

  const handlePresetClick = (preset) => {
    const date = preset.getValue();
    onChange(date);
    setOpened(false);
  };

  const handleSelect = (date) => {
    if (date) {
      onChange(date);
      setOpened(false);
    }
  };

  const handleDayMouseEnter = (date) => {
    if (mode === "week") {
      const weekStart = startOfWeek(date, { locale, weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { locale, weekStartsOn: 1 });
      setHoveredWeek({ from: weekStart, to: weekEnd });
    }
  };

  const handleDayMouseLeave = () => {
    if (mode === "week") {
      setHoveredWeek(null);
    }
  };

  const isInWeekRange = (date, week) => {
    if (!week) return false;
    return date >= week.from && date <= week.to;
  };

  const getWeekRange = (date) => {
    if (!date) return null;
    const weekStart = startOfWeek(date, { locale, weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { locale, weekStartsOn: 1 });
    return { from: weekStart, to: weekEnd };
  };

  const formatDisplayDate = () => {
    // check if its the actual date / week and display "Today" / "This week" instead of the date

    if (mode === "day" && value) {
      const today = new Date();
      if (format(value, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
        return translate("Today", locale.code);
      }
    }

    if (mode === "week" && value) {
      const today = new Date();
      const currentWeek = getWeekRange(today);
      const selectedWeek = getWeekRange(value);
      if (
        format(currentWeek.from, "yyyy-MM-dd") ===
          format(selectedWeek.from, "yyyy-MM-dd") &&
        format(currentWeek.to, "yyyy-MM-dd") ===
          format(selectedWeek.to, "yyyy-MM-dd")
      ) {
        return translate("This week", locale.code);
      }
    }

    if (mode === "week" && value) {
      const weekRange = getWeekRange(value);
      return `${format(weekRange.from, "d MMM", { locale })} - ${format(weekRange.to, "d MMM yyyy", { locale })}`;
    }
    return value ? format(value, "d MMMM yyyy", { locale }) : "Select date";
  };

  const selectedWeek = mode === "week" && value ? getWeekRange(value) : null;

  const modifiers =
    mode === "week" && selectedWeek
      ? {
          selected: (date) => isInWeekRange(date, selectedWeek),
          hovered: (date) => isInWeekRange(date, hoveredWeek),
        }
      : {};

  const modifiersClassNames =
    mode === "week"
      ? {
          selected: "rdp-day_selected-week",
          hovered: "rdp-day_hovered-week",
        }
      : {};

  return (
    <div className="day-picker-container" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpened(!opened)}
        className={triggerClassName}
        aria-haspopup="dialog"
        aria-expanded={opened}
        aria-label={triggerLabel}
        title={triggerLabel}
      >
        {children || (
          <>
            <Calendar className="calendar-icon" />
            <span className="day-picker-button-label">
              {formatDisplayDate()}
            </span>
          </>
        )}
      </button>

      {opened && (
        <div
          className="bz-popover day-picker-popover"
          role="dialog"
          aria-label="Choisir une date"
        >
          <DayPicker
            mode={"single"}
            selected={mode === "week" ? undefined : value}
            onSelect={handleSelect}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            locale={locale}
            weekStartsOn={1}
            showOutsideDays
            fixedWeeks
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            onDayMouseEnter={handleDayMouseEnter}
            onDayMouseLeave={handleDayMouseLeave}
            numberOfMonths={1}
          />
          <div className="day-picker-presets">
            {presets.map((preset) => (
              <button
                type="button"
                key={preset.label}
                className="bz-button bz-button-secondary preset-button"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
