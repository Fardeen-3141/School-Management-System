// src\stores\useAttendanceStore.ts

import { FETCH_INTERVAL } from "@/data/constants";
import { create } from "zustand";

// --- TYPE DEFINITIONS ---
export interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
  };
}

export interface BulkAttendanceData {
  studentId: string;
  status: string;
}

// --- ZUSTAND STORE ---
interface AttendanceState {
  attendance: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  fetchAttendance: (options?: { force?: boolean }) => Promise<void>;
  markBulkAttendance: (
    date: string,
    attendanceData: BulkAttendanceData[]
  ) => Promise<void>;
  updateSingleAttendance: (
    studentId: string,
    date: string,
    status: string
  ) => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendance: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchAttendance: async (options) => {
    const { lastFetched } = get();
    if (
      !options?.force &&
      lastFetched &&
      new Date().getTime() - lastFetched.getTime() < FETCH_INTERVAL
    ) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/attendance");
      if (!response.ok) throw new Error("Failed to fetch attendance");
      const data: AttendanceRecord[] = await response.json();
      set({ attendance: data, loading: false, lastFetched: new Date() });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  markBulkAttendance: async (date, attendanceData) => {
    const response = await fetch("/api/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, attendanceData }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to record bulk attendance");
    }
    // Refetch all records to ensure consistency after a bulk operation
    await get().fetchAttendance({ force: true });
  },

  updateSingleAttendance: async (studentId, date, status) => {
    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, date, status }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update attendance");
    }
    const updatedRecord: AttendanceRecord = await response.json();

    // Optimistically update or add the record
    set((state) => {
      const recordExists = state.attendance.some(
        (rec) => rec.id === updatedRecord.id
      );
      let newAttendance: AttendanceRecord[];
      if (recordExists) {
        newAttendance = state.attendance.map((rec) =>
          rec.id === updatedRecord.id ? updatedRecord : rec
        );
      } else {
        newAttendance = [updatedRecord, ...state.attendance];
      }
      return { attendance: newAttendance, lastFetched: new Date() };
    });
  },
}));
