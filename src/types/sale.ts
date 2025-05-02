
import type { CartItem } from './table';

/**
 * Represents a completed sale transaction.
 */
export type Sale = {
  id: string; // Unique ID for the sale
  tableNumber: number; // Table where the sale occurred
  items: CartItem[]; // Items included in the sale
  totalAmount: number; // Total value of the sale
  timestamp: number; // Date and time of sale completion (Unix timestamp for easy comparison)
};
