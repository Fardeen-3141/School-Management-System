// src\stores\usePaymentStore.ts

import { create } from "zustand";
import { PaymentType } from "@prisma/client";
import { FETCH_INTERVAL } from "@/data/constants";

// --- TYPE DEFINITIONS ---
export interface Payment {
  id: string;
  amount: number;
  type: PaymentType;
  date: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
  };
  fee: {
    id: string;
    type: string;
    amount: number;
    dueDate: string;
  };
}

export interface AddPaymentData {
  studentId: string;
  feeId?: string;
  amount: number;
  discount?: number;
  date: string;
}

// --- ZUSTAND STORE ---
interface PaymentState {
  payments: Payment[];
  loading: boolean;
  error: string | null;

  // Separate cache tracking for global vs student data
  globalLastFetched: Date | null;
  studentCache: {
    studentId: string | null;
    lastFetched: Date | null;
  };
  viewingStudent: { id: string; name: string } | null;

  // Actions
  fetchGlobalPayments: (options?: { force?: boolean }) => Promise<void>;
  fetchStudentPayments: (
    studentId: string,
    options?: { force?: boolean }
  ) => Promise<void>;
  addPayment: (data: AddPaymentData) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  clearStudentView: () => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  loading: false,
  error: null,
  globalLastFetched: null,
  studentCache: { studentId: null, lastFetched: null },
  viewingStudent: null,

  fetchGlobalPayments: async (options) => {
    const { globalLastFetched } = get();
    if (
      !options?.force &&
      globalLastFetched &&
      new Date().getTime() - globalLastFetched.getTime() < FETCH_INTERVAL
    ) {
      console.log("Using cached GLOBAL payment data.");
      return;
    }

    set({ loading: true, error: null, viewingStudent: null });

    try {
      const response = await fetch("/api/payments");
      if (!response.ok) throw new Error("Failed to fetch payments");
      const data: Payment[] = await response.json();

      set({
        payments: data,
        loading: false,
        globalLastFetched: new Date(),
        studentCache: { studentId: null, lastFetched: null },
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchStudentPayments: async (studentId: string, options) => {
    const { studentCache, payments, globalLastFetched } = get();

    // ✅ FIRST: Try to use existing global data
    if (
      !options?.force &&
      globalLastFetched &&
      new Date().getTime() - globalLastFetched.getTime() < FETCH_INTERVAL &&
      payments.length > 0
    ) {
      console.log(`Using cached global data for student ${studentId}.`);
      const studentInfo = payments.find(
        (p) => p.student.id === studentId
      )?.student;
      set({
        viewingStudent: studentInfo
          ? { id: studentInfo.id, name: studentInfo.name }
          : { id: studentId, name: "Unknown Student" },
        studentCache: { studentId, lastFetched: new Date() },
      });
      return;
    }

    // ✅ SECOND: Check student-specific cache (your suggested optimization)
    if (
      !options?.force &&
      studentCache.studentId === studentId &&
      studentCache.lastFetched &&
      new Date().getTime() - studentCache.lastFetched.getTime() < FETCH_INTERVAL
    ) {
      console.log(`Using cached payment data for student ${studentId}.`);
      return;
    }

    // ✅ THIRD: If no cache available, fetch from API
    set({ loading: true, error: null });

    try {
      const response = await fetch("/api/payments");
      if (!response.ok) throw new Error("Failed to fetch payments");
      const data: Payment[] = await response.json();

      const studentInfo = data.find((p) => p.student.id === studentId)?.student;

      set({
        payments: data,
        loading: false,
        studentCache: { studentId, lastFetched: new Date() },
        viewingStudent: studentInfo
          ? { id: studentInfo.id, name: studentInfo.name }
          : { id: studentId, name: "Unknown Student" },
        globalLastFetched: new Date(),
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addPayment: async (data) => {
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to record payment");
    }

    // Refetch based on current context
    const { viewingStudent } = get();
    if (viewingStudent) {
      await get().fetchStudentPayments(viewingStudent.id, { force: true });
    } else {
      await get().fetchGlobalPayments({ force: true });
    }
  },

  deletePayment: async (id) => {
    const response = await fetch(`/api/payments/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete payment");
    }

    set((state) => ({
      payments: state.payments.filter((p) => p.id !== id),
      globalLastFetched: state.viewingStudent ? null : new Date(),
      studentCache: state.viewingStudent
        ? { ...state.studentCache, lastFetched: new Date() }
        : { studentId: null, lastFetched: null },
    }));
  },

  clearStudentView: () => {
    set({
      viewingStudent: null,
      studentCache: { studentId: null, lastFetched: null },
    });
  },
}));
