import { create, StoreApi, UseBoundStore } from "zustand";
import { User } from "@supabase/supabase-js";

export const useUser: UseBoundStore<StoreApi<any>> = create((set) => ({
  userID: null,
  user: null,

  setUserID: (id: string) => set({ userID: id }),
  setUser: (userObject: User) => set({ user: userObject }),
}));
