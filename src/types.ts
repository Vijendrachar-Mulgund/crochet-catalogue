// Shared domain types for the Crochet Catalogue.

export interface Category {
  id?: number;
  category_name: string;
  created_at?: Date;
  user_id: string;
}

export interface Product {
  id?: number;
  name: string;
  categoryId: number | null;
  price: number | null;
  description: string;
  materials: string;
  dimensions: string;
  madeToOrder: boolean;
  productionTime: string;
  colourOptions: string;
  photoDataUrl: string | null;
  createdAt?: string;
}

export interface Settings {
  businessName: string;
  tagline: string;
  logoDataUrl: string | null;
}

export interface BackupData {
  format: string;
  version: number;
  exportedAt: string;
  settings: Settings;
  categories: Category[];
  products: Product[];
}

export type MoveDirection = "up" | "down";
