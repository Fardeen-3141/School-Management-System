import { create } from "zustand";
import { PaymentType } from "@prisma/client";

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
  lastFetched: Date | null;
  fetchPayments: (options?: { force?: boolean }) => Promise<void>;
  addPayment: (data: AddPaymentData) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
}

const FIVE_MINUTES = 5 * 60 * 1000;

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchPayments: async (options) => {
    const { lastFetched } = get();
    if (
      !options?.force &&
      lastFetched &&
      new Date().getTime() - lastFetched.getTime() < FIVE_MINUTES
    ) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/payments");
      if (!response.ok) throw new Error("Failed to fetch payments");
      const data: Payment[] = await response.json();
      set({ payments: data, loading: false, lastFetched: new Date() });
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
    // Because adding a payment can have complex side-effects (like auto-allocating
    // to multiple fees), the safest strategy is to refetch all payments.
    await get().fetchPayments({ force: true });
  },

  deletePayment: async (id) => {
    const response = await fetch(`/api/payments/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete payment");
    }
    set((state) => ({
      payments: state.payments.filter((p) => p.id !== id),
      lastFetched: new Date(),
    }));
  },
}));
