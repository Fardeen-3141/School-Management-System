// stores/useStudentStore.ts

import { create } from "zustand";
import { PaymentType, UserStatus } from "@prisma/client";
import { FETCH_INTERVAL } from "@/data/constants";

// Define the shape of a single student object, matching the frontend model
interface StudentUser {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  studentId: string;
}

interface StudentFee {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  payments: StudentPayment[];
}

interface StudentPayment {
  id: string;
  amount: number;
  type: PaymentType; // "PAYMENT" | "DISCOUNT"
  date: string;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNumber: string;
  guardian: string;
  guardianPhone: string;
  guardianEmail: string | null;
  address: string | null;
  dateOfBirth: string | null;
  admissionDate: string;
  user: StudentUser;
  fees: StudentFee[];
  payments: StudentPayment[];
}

// Data Transfer Objects (DTOs) for our actions
export type AddStudentData = Omit<
  Student,
  "id" | "user" | "fees" | "payments" | "admissionDate"
> & {
  email: string;
  password?: string;
};

export type UpdateStudentData = Partial<AddStudentData>;

// --- ZUSTAND STORE DEFINITION ---

interface StudentState {
  students: Student[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  fetchStudents: (options?: { force?: boolean }) => Promise<void>;
  getStudentById: (id: string) => Student | undefined;
  addStudent: (newStudentData: AddStudentData) => Promise<Student>;
  updateStudent: (
    studentId: string,
    updatedData: UpdateStudentData
  ) => Promise<Student>;
  deleteStudent: (studentId: string) => Promise<void>;
  updateStudentStatus: (studentId: string, status: UserStatus) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  loading: false,
  error: null,
  lastFetched: null,

  // Action to fetch students from the API
  fetchStudents: async (options) => {
    const { lastFetched, students } = get();
    const now = new Date();

    if (
      !options?.force &&
      lastFetched &&
      now.getTime() - lastFetched.getTime() < FETCH_INTERVAL &&
      students.length > 0
    ) {
      console.log("Using cached students data.");
      return;
    }

    console.log("Fetching students from API...");
    set({ loading: true, error: null });

    try {
      const response = await fetch("/api/students");
      if (!response.ok) throw new Error("Failed to fetch students");

      const data: Student[] = await response.json();
      set({ students: data, loading: false, lastFetched: new Date() });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      set({ error: errorMessage, loading: false });
    }
  },

  getStudentById: (id: string) => {
    return get().students.find((student) => student.id === id);
  },

  addStudent: async (newStudentData) => {
    set({ loading: true });

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add student");
      }

      const createdStudent: Student = await response.json();

      set((state) => ({
        students: [createdStudent, ...state.students],
        loading: false,
        lastFetched: new Date(),
      }));

      return createdStudent;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add student";
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  updateStudent: async (studentId, updatedData) => {
    set({ loading: true });

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update student");
      }

      const updatedStudent: Student = await response.json();

      set((state) => ({
        students: state.students.map((s) =>
          s.id === studentId ? updatedStudent : s
        ),
        loading: false,
        lastFetched: new Date(),
      }));

      return updatedStudent;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update student";
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  deleteStudent: async (studentId: string) => {
    set({ loading: true });

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete student");
      }

      set((state) => ({
        students: state.students.filter((s) => s.id !== studentId),
        loading: false,
        lastFetched: new Date(),
      }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete student";
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  updateStudentStatus: async (studentId: string, status: UserStatus) => {
    try {
      const response = await fetch(`/api/students/${studentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      set((state) => ({
        students: state.students.map((s) =>
          s.id === studentId ? { ...s, user: { ...s.user, status } } : s
        ),
        lastFetched: new Date(),
      }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update status";
      set({ error: errorMessage });
      throw error;
    }
  },
}));
