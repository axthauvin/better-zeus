import React from "react";
import CalendarContainer from "./components/CalendarContainer";
import { AttendanceProvider } from "./context/AttendanceContext";

// Current interface. Loaded lazily from src/index.jsx so its global CSS
// is only injected when it is the selected interface.
export function renderCalendar(root) {
  root.render(
    <AttendanceProvider>
      <CalendarContainer />
    </AttendanceProvider>,
  );
}
