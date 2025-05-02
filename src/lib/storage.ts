import type { Product } from '@/types/product';
import type { Table } from '@/types/table'; // Import Table type

const PRODUCTS_STORAGE_KEY = 'snacktrack_products';
const TABLES_STORAGE_KEY = 'snacktrack_tables'; // Key for tables

// Helper function to safely access localStorage
const getLocalStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
};

// --- Product Storage ---
export const saveProductsToStorage = (products: Product[]): void => {
  const storage = getLocalStorage();
  if (storage) {
    try {
      storage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error("Erro ao salvar produtos no localStorage:", error);
      // Optionally: Show a user-facing error message
    }
  }
};

export const loadProductsFromStorage = (): Product[] => {
  const storage = getLocalStorage();
  if (storage) {
    try {
      const storedProducts = storage.getItem(PRODUCTS_STORAGE_KEY);
      if (storedProducts) {
        // Basic validation: Check if it's an array
        const parsedData = JSON.parse(storedProducts);
        if (Array.isArray(parsedData)) {
          // Further validation could be added here to check object structure
          return parsedData as Product[];
        }
      }
    } catch (error) {
      console.error("Erro ao carregar produtos do localStorage:", error);
      // Optionally: Handle corrupted data, e.g., clear it
      // storage.removeItem(PRODUCTS_STORAGE_KEY);
    }
  }
  return []; // Return empty array if localStorage is unavailable or data is invalid/missing
};


// --- Table Storage ---
export const saveTablesToStorage = (tables: Table[]): void => {
  const storage = getLocalStorage();
  if (storage) {
    try {
      storage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables));
    } catch (error) {
      console.error("Erro ao salvar mesas no localStorage:", error);
    }
  }
};

export const loadTablesFromStorage = (): Table[] => {
  const storage = getLocalStorage();
  if (storage) {
    try {
      const storedTables = storage.getItem(TABLES_STORAGE_KEY);
      if (storedTables) {
        const parsedData = JSON.parse(storedTables);
        if (Array.isArray(parsedData)) {
          // Basic validation, could add more checks for table structure
          return parsedData as Table[];
        }
      }
    } catch (error) {
      console.error("Erro ao carregar mesas do localStorage:", error);
      // storage.removeItem(TABLES_STORAGE_KEY); // Handle potential corruption
    }
  }
  // Default to 10 tables if none are found in storage
  return Array.from({ length: 10 }, (_, i) => ({
      id: `table_${i + 1}`,
      number: i + 1,
      status: 'available',
      order: []
  }));
};
