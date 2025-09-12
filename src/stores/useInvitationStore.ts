// src\stores\useInvitationStore.ts

import { create } from "zustand";
import { Role } from "@prisma/client";

// --- TYPE DEFINITIONS ---
export interface Invitation {
  id: string;
  email: string;
  role: Role;
  code: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
  invitedUser: {
    name: string;
    email: string;
  };
}

export interface InvitationData {
  email: string;
  role: Role;
  studentData?: {
    class: string;
    section: string;
    guardian: string;
    guardianEmail?: string;
  };
}

// --- ZUSTAND STORE ---
interface InvitationState {
  invitations: Invitation[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  fetchInvitations: (options?: { force?: boolean }) => Promise<void>;
  addInvitation: (data: InvitationData) => Promise<Invitation>;
}

const FIVE_MINUTES = 5 * 60 * 1000;

export const useInvitationStore = create<InvitationState>((set, get) => ({
  invitations: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchInvitations: async (options) => {
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
      const response = await fetch("/api/invitations");
      if (!response.ok) throw new Error("Failed to fetch invitations");
      const data: Invitation[] = await response.json();
      set({ invitations: data, loading: false, lastFetched: new Date() });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addInvitation: async (data) => {
    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create invitation");
    }
    // The API returns a partial object, so we will just refetch the whole list
    // to get the complete new invitation object.
    await get().fetchInvitations({ force: true });
    // This is a placeholder return, as the actual new invitation is in the refetched list.
    return {} as Invitation;
  },
}));
