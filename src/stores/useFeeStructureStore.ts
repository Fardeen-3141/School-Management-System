// src\stores\useFeeStructureStore.ts

import { create } from "zustand";
import { Recurrence } from "@prisma/client";

export interface FeeStructure {
  id: string;
  type: string;
  amount: number;
  recurrence: Recurrence;
  isDefault: boolean;
}

export type FeeStructureData = Omit<FeeStructure, "id">;

// --- ZUSTAND STORE ---
interface FeeStructureState {
  feeStructures: FeeStructure[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  fetchFeeStructures: (options?: { force?: boolean }) => Promise<void>;
  addFeeStructure: (data: FeeStructureData) => Promise<FeeStructure>;
  updateFeeStructure: (
    id: string,
    data: Partial<FeeStructureData>
  ) => Promise<FeeStructure>;
  deleteFeeStructure: (id: string) => Promise<void>;
}

const FIVE_MINUTES = 5 * 60 * 1000;

export const useFeeStructureStore = create<FeeStructureState>((set, get) => ({
  feeStructures: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchFeeStructures: async (options) => {
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
      const response = await fetch("/api/fee-structures");
      if (!response.ok) throw new Error("Failed to fetch fee structures");
      const data: FeeStructure[] = await response.json();

      set({ feeStructures: data, loading: false, lastFetched: new Date() });
    } catch (error: unknown) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addFeeStructure: async (data) => {
    const response = await fetch("/api/fee-structures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create fee structure");
    }

    const newStructure: FeeStructure = await response.json();

    set((state) => ({
      feeStructures: [...state.feeStructures, newStructure].sort((a, b) =>
        a.type.localeCompare(b.type)
      ),
      lastFetched: new Date(),
    }));

    return newStructure;
  },

  updateFeeStructure: async (id, data) => {
    const response = await fetch(`/api/fee-structures/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update fee structure");
    }

    const updatedStructure: FeeStructure = await response.json();

    set((state) => ({
      feeStructures: state.feeStructures.map((fs) =>
        fs.id === id ? updatedStructure : fs
      ),
      lastFetched: new Date(),
    }));

    return updatedStructure;
  },

  deleteFeeStructure: async (id) => {
    const response = await fetch(`/api/fee-structures/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete fee structure");
    }

    set((state) => ({
      feeStructures: state.feeStructures.filter((fs) => fs.id !== id),
      lastFetched: new Date(),
    }));
  },
}));
