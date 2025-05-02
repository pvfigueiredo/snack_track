'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product, UnitOfMeasure } from '@/types/product';
import { saveProductsToStorage, loadProductsFromStorage } from '@/lib/storage';

// Function to generate a simple unique ID (replace with a robust solution if needed)
const generateId = (): string => `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;


export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Load products from storage on initial mount (client-side only)
  useEffect(() => {
    const loadedProducts = loadProductsFromStorage();
    setProducts(loadedProducts);
    setIsLoading(false); // Set loading to false after loading
  }, []);

  // Save products to storage whenever the products state changes
  useEffect(() => {
    // Don't save during initial load
    if (!isLoading) {
       saveProductsToStorage(products);
    }
  }, [products, isLoading]);

  const addProduct = useCallback((newProductData: Omit<Product, 'id'>) => {
    setProducts((prevProducts) => {
      const newProduct: Product = {
        ...newProductData,
        id: generateId(),
      };
      // Ensure uniqueness of product code before adding
       if (prevProducts.some(p => p.code === newProduct.code)) {
         console.warn(`Product code ${newProduct.code} already exists. Skipping add.`);
         // Optionally throw an error or show a toast message
         throw new Error(`Código de produto ${newProduct.code} já existe.`);
       }
      return [...prevProducts, newProduct];
    });
  }, []);

  const updateProduct = useCallback((updatedProduct: Product) => {
     setProducts((prevProducts) => {
       // Ensure uniqueness of product code if it's being changed
       const originalProduct = prevProducts.find(p => p.id === updatedProduct.id);
       if (originalProduct && originalProduct.code !== updatedProduct.code) {
         if (prevProducts.some(p => p.id !== updatedProduct.id && p.code === updatedProduct.code)) {
           console.warn(`Product code ${updatedProduct.code} already exists. Skipping update.`);
           // Optionally throw an error or show a toast message
            throw new Error(`Código de produto ${updatedProduct.code} já existe.`);
         }
       }
       return prevProducts.map((product) =>
         product.id === updatedProduct.id ? updatedProduct : product
       );
     });
  }, []);


  const deleteProduct = useCallback((productId: string) => {
    setProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== productId)
    );
  }, []);

  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find((product) => product.id === productId);
  }, [products]);

  const getProductByCode = useCallback((productCode: string): Product | undefined => {
    return products.find((product) => product.code === productCode);
  }, [products]);


  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductByCode,
    isLoading, // Expose loading state
  };
};
