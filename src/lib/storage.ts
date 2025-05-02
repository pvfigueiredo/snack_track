import type { Product } from '@/types/product';

const PRODUCTS_STORAGE_KEY = 'snacktrack_products';

// Helper function to safely access localStorage
const getLocalStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
};

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
