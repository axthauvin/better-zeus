import { format, isSameMonth, isSameYear } from "date-fns";
import { fr } from "date-fns/locale";

export const capitalize = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

/**
 * Title parts for a date range, Calendar.app style:
 * "Février 2026", "Févr. – Mars 2026" or "Déc. 2025 – Janv. 2026".
 */
export const getRangeTitle = (start, end) => {
  if (isSameMonth(start, end)) {
    return {
      strong: capitalize(format(start, "MMMM", { locale: fr })),
      light: format(start, "yyyy"),
    };
  }
  if (isSameYear(start, end)) {
    return {
      strong: `${capitalize(format(start, "MMM", { locale: fr }))} – ${capitalize(format(end, "MMM", { locale: fr }))}`,
      light: format(end, "yyyy"),
    };
  }
  return {
    strong: `${capitalize(format(start, "MMM yyyy", { locale: fr }))} – ${capitalize(format(end, "MMM", { locale: fr }))}`,
    light: format(end, "yyyy"),
  };
};
