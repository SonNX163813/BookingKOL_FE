import React from "react";
import DayGrid from "./DayGrid";
import MonthGrid from "./MonthGrid";

export default function SchedulerGrid({ range, dayDuties, fromDate, toDate }) {
  return range === "month" ? (
    <MonthGrid dayDuties={dayDuties} range={range} fromDate={fromDate} />
  ) : (
    <DayGrid range={range} dayDuties={dayDuties} fromDate={fromDate} />
  );
}
