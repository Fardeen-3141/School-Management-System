// src\stores\useFeeStore.ts

import { create } from "zustand";
import { Recurrence, PaymentType } from "@prisma/client";
import { FETCH_INTERVAL } from "@/data/constants";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  user: { email: string };
  fees: Fee[];
}

interface Payment {
  id: string;
  amount: number;
  type: PaymentType;
  date: string;
}

export interface Fee {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
  };
  payments: Payment[];
}

export interface FeeStructure {
  id: string;
  type: string;
  amount: number;
  recurrence: Recurrence;
}

export interface StudentFeeSetup {
  id: string;
  feeStructure: FeeStructure;
  customAmount: number | null;
  isActive: boolean;
  lastGeneratedFor: string | null;
}

// --- ZUSTAND STORE DEFINITION ---
interface FeeState {
  fees: Fee[];
  students: Student[];
  studentFeeSetups: StudentFeeSetup[];
  allFeeStructures: FeeStructure[];
  viewingStudent: Student | null;
  loading: boolean;
  error: string | null;

  // Separate cache tracking for global data vs. student data
  globalLastFetched: Date | null;
  studentCache: {
    studentId: string | null;
    lastFetched: Date | null;
  };

  // Actions
  fetchGlobalFeeData: (options?: { force?: boolean }) => Promise<void>;
  fetchStudentFeeData: (
    studentId: string,
    options?: { force?: boolean }
  ) => Promise<void>;
  addFee: (data: unknown) => Promise<void>;
  updateFee: (id: string, data: unknown) => Promise<void>;
  deleteFee: (id: string) => Promise<void>;
  addStudentFeeSetup: (studentId: string, data: unknown) => Promise<void>;
  updateStudentFeeSetup: (
    studentId: string,
    setupId: string,
    data: unknown
  ) => Promise<void>;
  deleteStudentFeeSetup: (studentId: string, setupId: string) => Promise<void>;
  clearStudentView: () => void;
}

export const useFeeStore = create<FeeState>((set, get) => ({
  fees: [],
  students: [],
  studentFeeSetups: [],
  allFeeStructures: [],
  viewingStudent: null,
  loading: false,
  error: null,

  globalLastFetched: null,
  studentCache: { studentId: null, lastFetched: null },

  fetchGlobalFeeData: async (options) => {
    const { globalLastFetched } = get();
    // UPDATED CACHE LOGIC: Checks its own timestamp
    if (
      !options?.force &&
      globalLastFetched &&
      new Date().getTime() - globalLastFetched.getTime() < FETCH_INTERVAL
    ) {
      console.log("Using cached GLOBAL fee data.");
      return;
    }

    set({
      loading: true,
      error: null,
      viewingStudent: null,
      studentFeeSetups: [],
    });
    try {
      const [feesRes, studentsRes] = await Promise.all([
        fetch("/api/fees"),
        fetch("/api/students"),
      ]);
      if (!feesRes.ok || !studentsRes.ok)
        throw new Error("Failed to fetch global fee data");

      const feesData: Fee[] = await feesRes.json();
      const studentsData: Student[] = await studentsRes.json();

      set({
        fees: feesData,
        students: studentsData,
        loading: false,
        globalLastFetched: new Date(),
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  // In useFeeStore.ts, update the fetchStudentFeeData function:
  fetchStudentFeeData: async (studentId: string, options) => {
    const { studentCache, globalLastFetched, students, allFeeStructures } =
      get();

    // ✅ NEW: Try to use existing global data first
    if (
      !options?.force &&
      globalLastFetched &&
      new Date().getTime() - globalLastFetched.getTime() < FETCH_INTERVAL &&
      students.length > 0 &&
      allFeeStructures.length > 0
    ) {
      const studentFromCache = students.find((s) => s.id === studentId);
      if (studentFromCache) {
        console.log(`Using cached global data for student ${studentId}.`);

        // Still need to fetch fee setups (not in global cache)
        try {
          const setupsRes = await fetch(
            `/api/students/${studentId}/fee-setups`
          );
          if (setupsRes.ok) {
            const setupsData = await setupsRes.json();

            set({
              viewingStudent: studentFromCache,
              fees: studentFromCache.fees || [],
              studentFeeSetups: setupsData,
              studentCache: { studentId, lastFetched: new Date() },
              loading: false,
            });
            return;
          }
        } catch {
          // Fall through to full fetch if setups fetch fails
        }
      }
    }

    // ✅ Existing student-specific cache check
    if (
      !options?.force &&
      studentCache.studentId === studentId &&
      studentCache.lastFetched &&
      new Date().getTime() - studentCache.lastFetched.getTime() < FETCH_INTERVAL
    ) {
      console.log(`Using cached data for student ${studentId}.`);
      return;
    }

    if (
      !options?.force &&
      studentCache.studentId === studentId &&
      studentCache.lastFetched &&
      new Date().getTime() - studentCache.lastFetched.getTime() < FETCH_INTERVAL
    ) {
      console.log(`Using cached data for student ${studentId}.`);
      return;
    }

    set({ loading: true, error: null });

    try {
      const [studentRes, setupsRes, structuresRes] = await Promise.all([
        fetch(`/api/students/${studentId}`),
        fetch(`/api/students/${studentId}/fee-setups`),
        fetch("/api/fee-structures"),
      ]);

      if (!studentRes.ok || !setupsRes.ok || !structuresRes.ok)
        throw new Error("Failed to fetch student fee data");

      const studentData = await studentRes.json();
      const setupsData = await setupsRes.json();
      const structuresData = await structuresRes.json();

      // Set all data atomically to prevent race conditions
      set({
        viewingStudent: studentData,
        fees: studentData.fees || [],
        studentFeeSetups: setupsData,
        allFeeStructures: structuresData,
        loading: false,
        studentCache: { studentId: studentId, lastFetched: new Date() },
        globalLastFetched: null, // Clear global cache when viewing student
      });
    } catch (error: unknown) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addFee: async (data) => {
    const response = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create fee");
    }

    // Force a refetch after the operation
    const studentId = get().viewingStudent?.id;
    if (studentId) {
      await get().fetchStudentFeeData(studentId, { force: true });
    } else {
      await get().fetchGlobalFeeData({ force: true });
    }
  },

  updateFee: async (id, data) => {
    const response = await fetch(`/api/fees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update fee");
    }
    const updatedFee: Fee = await response.json();
    set((state) => ({
      fees: state.fees.map((f) => (f.id === id ? updatedFee : f)),
    }));
  },

  deleteFee: async (id) => {
    const response = await fetch(`/api/fees/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete fee");
    }
    set((state) => ({
      fees: state.fees.filter((f) => f.id !== id),
    }));
  },

  addStudentFeeSetup: async (studentId, data) => {
    const response = await fetch(`/api/students/${studentId}/fee-setups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to apply rule");
    }
    const newSetup: StudentFeeSetup = await response.json();
    set((state) => ({
      studentFeeSetups: [...state.studentFeeSetups, newSetup],
    }));
  },

  updateStudentFeeSetup: async (studentId, setupId, data) => {
    const response = await fetch(
      `/api/students/${studentId}/fee-setups/${setupId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update rule");
    }
    const updatedSetup: StudentFeeSetup = await response.json();
    set((state) => ({
      studentFeeSetups: state.studentFeeSetups.map((s) =>
        s.id === setupId ? updatedSetup : s
      ),
    }));
  },

  deleteStudentFeeSetup: async (studentId, setupId) => {
    const response = await fetch(
      `/api/students/${studentId}/fee-setups/${setupId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to remove rule");
    }
    set((state) => ({
      studentFeeSetups: state.studentFeeSetups.filter((s) => s.id !== setupId),
    }));
  },

  clearStudentView: () => {
    set({ viewingStudent: null, studentFeeSetups: [] });
  },
}));
