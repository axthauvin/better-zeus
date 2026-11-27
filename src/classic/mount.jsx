import React from "react";
import CalendarContainer from "./components/CalendarContainer";
import { AttendanceProvider } from "../context/AttendanceContext";

// ANCIENNE INTERFACE — NON MAINTENUE (voir src/classic/README.md).
// Interface d'avant la v3.0, gardée uniquement pour la compatibilité avec les
// utilisateurs qui la préfèrent. Aucune nouvelle fonctionnalité ne doit y être
// ajoutée. Chargée paresseusement depuis src/index.jsx pour que son CSS global
// ne soit injecté que si l'utilisateur l'a choisie.
export function renderCalendar(root) {
  root.render(
    <AttendanceProvider>
      <CalendarContainer />
    </AttendanceProvider>,
  );
}
