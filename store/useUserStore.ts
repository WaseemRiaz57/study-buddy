import { create } from "zustand";

export type Role = "STUDENT" | "MENTOR" | "ADMIN";
export type Plan = "COMMUNITY" | "PRO" | "ELITE";

interface UserState {
  role: Role;
  plan: Plan;
  setRole: (role: Role) => void;
  setPlan: (plan: Plan) => void;
}

export const useUserStore = create<UserState>((set) => ({
  role: "STUDENT",
  plan: "COMMUNITY",
  setRole: (role) => set({ role }),
  setPlan: (plan) => set({ plan }),
}));
