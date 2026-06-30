import { create, StoreApi, UseBoundStore } from "zustand";
import { Category } from "../../types";

export const useCategoriesStore: UseBoundStore<StoreApi<any>> = create((set) => ({
  categories: [],

  setCategories: (category: Category) =>
    set((state: any) => ({
      categories: [...state.categories, category],
    })),
}));
