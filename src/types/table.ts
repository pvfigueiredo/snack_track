import type { Product } from './product';

// Define allowed table statuses
export const tableStatuses = ["available", "occupied", "reserved"] as const;
export type TableStatus = typeof tableStatuses[number];

export type CartItem = Product & { quantity: number };

export type Table = {
  id: string; // Unique identifier for the table
  number: number; // Display number of the table
  status: TableStatus; // Current status (e.g., available, occupied)
  order: CartItem[]; // Array of items currently ordered at the table
};
