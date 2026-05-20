// src\components\ui\special\DatePicker.tsx
// Completely tested!!!
"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface DatePickerProps {
  value: string; // The currently selected date as "YYYY-MM-DD"
  onChange: (dateString: string | null) => void; // Called when user picks or clears
  placeholder: string; // Text shown when nothing is selected
  minDate?: string | null; // Earliest selectable date "YYYY-MM-DD"
  maxDate?: string | null; // Latest selectable date "YYYY-MM-DD" ... It has to be passed as maxDate={new Date().toISOString().split("T")[0]} from the parent
  className?: string; // Lets the parent add extra Tailwind classes
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const DatePicker = ({
  value,
  onChange,
  placeholder = "Select date",
  minDate = null,
  maxDate = null,
  className = "",
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const [selectedYear, selectedMonth, selectedDay] = value
    ? value.split("-").map(Number)
    : [0, 0, 0];

  // These control which month/year the CALENDAR is showing ... (not necessarily the selected date)
  const [currentMonth, setCurrentMonth] = React.useState<number>(
    selectedMonth ? selectedMonth - 1 : new Date().getMonth(), // -1 for zero-based
  );
  const [currentYear, setCurrentYear] = React.useState<number>(
    selectedYear || new Date().getFullYear(),
  );

  const currentDate = new Date();

  // Generates: [currentYear-50, ..., currentYear, ..., currentYear+50] ... So if today is 2025, the dropdown shows 1975 to 2075
  const years = Array.from(
    { length: 100 },
    (_, i) => currentDate.getFullYear() - 50 + i,
  );

  // new Date(year, month+1, 0) = last day of the given month ... The "day 0" trick means "day before the 1st of next month"
  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };
  // Returns 0 (Sun) through 6 (Sat) — used to offset the grid
  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: string): string => {
    if (!date) return placeholder;
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return placeholder; // guard against Invalid Date
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(parsed);
    // "2010-03-15" → "March 15, 2010"
  };

  const isDateDisabled = (day: number): boolean => {
    // Build a local YYYY-MM-DD string to avoid UTC midnight shift
    // new Date(year, month, day) = local midnight — safe for string formatting
    const localDateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (minDate && localDateString < minDate) return true;
    if (maxDate && localDateString > maxDate) return true;
    return false;
  };

  // Uses manual string formatting instead of .toISOString() ... to prevent timezone shifts from changing the selected day.
  const handleDateSelect = (day: number): void => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateString);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Push empty placeholder divs for the offset
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }

    // Push the actual day buttons
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        value &&
        selectedDay === day &&
        selectedMonth - 1 === currentMonth && // -1 to convert back to zero-based
        selectedYear === currentYear;

      const isDisabled = isDateDisabled(day);

      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === currentMonth &&
        new Date().getFullYear() === currentYear;

      days.push(
        <button
          type="button"
          key={day}
          onClick={() => !isDisabled && handleDateSelect(day)}
          disabled={isDisabled}
          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
            isSelected
              ? "bg-primary text-primary-foreground shadow-md"
              : isToday
                ? "bg-accent text-accent-foreground border border-primary"
                : "hover:bg-accent hover:text-accent-foreground"
          } ${
            isDisabled
              ? "text-muted-foreground cursor-not-allowed opacity-50 hover:bg-transparent"
              : "cursor-pointer"
          }`}
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="w-full h-11 px-3 py-2 border border-input rounded-md shadow-sm text-left flex items-center justify-between hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
          >
            <div className="flex items-center gap-2 text-sm">
              <span
                className={value ? "text-foreground" : "text-muted-foreground"}
              >
                {formatDate(value)}
              </span>
            </div>
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transform transition-transform duration-200 ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          </button>
        </DialogTrigger>
        <DialogContent className="z-50 w-80 p-4 bg-popover text-popover-foreground [&>button]:hidden border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="px-3 py-1.5 border border-input rounded-md text-sm font-medium bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="px-3 py-1.5 border border-input rounded-md text-sm font-medium bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Prev/Next arrow buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear((prev) => prev - 1);
                  } else {
                    setCurrentMonth((prev) => prev - 1);
                  }
                }}
                className="p-1.5 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear((prev) => prev + 1);
                  } else {
                    setCurrentMonth((prev) => prev + 1);
                  }
                }}
                className="p-1.5 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="w-10 h-8 flex items-center justify-center text-xs font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* The actual calendar — renderCalendar() returns our flat array */}
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                onChange(todayString);
                setCurrentMonth(today.getMonth());
                setCurrentYear(today.getFullYear());
                setIsOpen(false);
              }}
              className="px-3 py-1.5 text-sm text-primary hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors"
            >
              Clear
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
