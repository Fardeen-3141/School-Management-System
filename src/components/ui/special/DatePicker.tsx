// src\components\ui\special\DatePicker.tsx

import React, { useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value: string;
  onChange: (dateString: string | null) => void;
  placeholder: string;
  label: string;
  required?: boolean;
  minDate?: string | null;
  maxDate?: string | null;
  className?: string;
}

// Date Picker Component
export const DatePicker = ({
  value,
  onChange,
  placeholder = "Select date",
  label,
  required = false,
  minDate = null,
  maxDate = null,
  className = "",
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value).getMonth() : new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    value ? new Date(value).getFullYear() : new Date().getFullYear()
  );

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

  const currentDate = new Date();
  const years = Array.from(
    { length: 100 },
    (_, i) => currentDate.getFullYear() - 50 + i
  );

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: string) => {
    if (!date) return placeholder;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    return false;
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    const dateString = selectedDate.toISOString().split("T")[0];
    onChange(dateString);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        value &&
        new Date(value).getDate() === day &&
        new Date(value).getMonth() === currentMonth &&
        new Date(value).getFullYear() === currentYear;
      const isDisabled = isDateDisabled(day);
      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === currentMonth &&
        new Date().getFullYear() === currentYear;

      days.push(
        <button
          key={day}
          onClick={() => !isDisabled && handleDateSelect(day)}
          disabled={isDisabled}
          className={`
            w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200
            ${
              isSelected
                ? "bg-primary text-primary-foreground shadow-md"
                : isToday
                ? "bg-accent text-accent-foreground border border-primary"
                : "hover:bg-accent hover:text-accent-foreground"
            }
            ${
              isDisabled
                ? "text-muted-foreground cursor-not-allowed opacity-50 hover:bg-transparent"
                : "cursor-pointer"
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full h-11 px-3 py-2 bg-background border border-input rounded-md shadow-sm text-left flex items-center justify-between hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
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
        </PopoverTrigger>

        <PopoverContent className="w-80 p-4" align="center">
          {/* Month and Year Selectors */}
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

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(currentYear - 1);
                  } else {
                    setCurrentMonth(currentMonth - 1);
                  }
                }}
                className="p-1.5 hover:bg-accent rounded-md transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(currentYear + 1);
                  } else {
                    setCurrentMonth(currentMonth + 1);
                  }
                }}
                className="p-1.5 hover:bg-accent rounded-md transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="w-10 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

          {/* Quick actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const todayString = today.toISOString().split("T")[0];
                onChange(todayString);
                setCurrentMonth(today.getMonth());
                setCurrentYear(today.getFullYear());
                setIsOpen(false);
              }}
              className="px-3 py-1.5 text-sm text-primary hover:bg-accent rounded-md transition-colors"
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
        </PopoverContent>
      </Popover>
    </div>
  );
};
