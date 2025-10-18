import React from "react";
import DayGrid from "./DayGrid";
import MonthGrid from "./MonthGrid";

export default function SchedulerGrid({ range, goalsByDay }) {
  return range === "month" ? (
    <MonthGrid dayDuties={goalsByDay} range={range} />
  ) : (
    <DayGrid range={range} dayDuties={goalsByDay} />
  );
}
