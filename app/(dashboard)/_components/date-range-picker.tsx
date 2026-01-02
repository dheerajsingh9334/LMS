"use client";
import * as React from "react";
import {  parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

interface CalendarDateRangePickerProps{
  checkInDates: string[]
}
const CalendarDateRangePicker = ({
  checkInDates
}:CalendarDateRangePickerProps ) => {
  
  const parsedDates = checkInDates.map((dateString) => parseISO(dateString));
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <h3 className="text-sm font-semibold mb-2 text-gray-700">Activity Calendar</h3>
      <Calendar
        mode="single"
        className="rounded-md"
        modifiers={{selected: parsedDates}}
        modifiersClassNames={{ selected: "calendar-dates" }}
      />
    </div>
  );
};

export default CalendarDateRangePicker;
