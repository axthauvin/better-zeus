// ANCIENNE INTERFACE — NON MAINTENUE. Conservée uniquement pour la compatibilité
// (voir src/classic/README.md). Ne pas y ajouter de fonctionnalités : développer dans src/components/.

// The new interface switched event colours to the Apple system palette
// (src/api/index.js). The classic interface keeps its original colours.
const APPLE_TO_LEGACY = {
  "#AF52DE": "#7C3AED", // Lecture
  "#007AFF": "#3B82F6", // Practice
  "#30B0C7": "#14B8A6", // Conference
  "#34C759": "#10B981", // Workshop
  "#FF2D55": "#EC4899", // TD
  "#FF9500": "#F59E0B", // Permanence
  "#FF3B30": "#EF4444", // Exam
  "#5856D6": "#5cf1f6", // FollowUp
  "#FFCC00": "#EAB308", // default personal event
};

export function withLegacyColors(events = []) {
  return events.map((event) => {
    const legacy = APPLE_TO_LEGACY[event.color];
    return legacy ? { ...event, color: legacy } : event;
  });
}
