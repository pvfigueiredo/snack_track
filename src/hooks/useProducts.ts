'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';
import { saveProductsToStorage, loadProductsFromStorage } from '@/lib/storage';
import { Burger, Pizza, Beer, GlassWater, Sandwich } from 'lucide-react'; // Example icons

// Function to generate a simple unique ID (replace with a robust solution if needed)
const generateId = (): string => `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

// Example: Assign icons based on product name keywords
const getIconForProduct = (name: string): React.ElementType | undefined => {
  const lowerCaseName = name.toLowerCase();
  if (lowerCaseName.includes('burger') || lowerCaseName.includes('hambúrguer')) return Burger;
  if (lowerCaseName.includes('pizza')) return Pizza;
  if (lowerCaseName.includes('cerveja') || lowerCaseName.includes('beer')) return Beer;
  if (lowerCaseName.includes('água') || lowerCaseName.includes('refrigerante') || lowerCaseName.includes('suco')) return GlassWater;
  if (lowerCaseName.includes('sanduíche') || lowerCaseName.includes('sandwich')) return Sandwich;
  // Add more keywords and icons as needed
  return undefined; // Default if no match
};


export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Load products from storage on initial mount (client-side only)
  useEffect(() => {
    const loadedProducts = loadProductsFromStorage();
    // Assign icons to loaded products
    const productsWithIcons = loadedProducts.map(product => ({
      ...product,
      icon: getIconForProduct(product.name),
    }));
    setProducts(productsWithIcons);
    setIsLoading(false); // Set loading to false after loading
  }, []);

  // Save products to storage whenever the products state changes
  useEffect(() => {
    // Don't save during initial load
    if (!isLoading) {
       // Filter out the icon before saving as it's not serializable
       const productsToSave = products.map(({ icon, ...rest }) => rest);
       saveProductsToStorage(productsToSave);
    }
  }, [products, isLoading]);

  const addProduct = useCallback((newProductData: Omit<Product, 'id' | 'icon'>) => {
    setProducts((prevProducts) => {
      const newProduct: Product = {
        ...newProductData,
        id: generateId(),
        icon: getIconForProduct(newProductData.name), // Assign icon when adding
      };
      return [...prevProducts, newProduct];
    });
  }, []);

  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === updatedProduct.id ? { ...updatedProduct, icon: getIconForProduct(updatedProduct.name) } : product
      )
    );
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== productId)
    );
  }, []);

  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find((product) => product.id === productId);
  }, [products]);


  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    isLoading, // Expose loading state
  };
};
