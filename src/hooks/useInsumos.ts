
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Insumo } from '@/types/insumo';
import type { UnitOfMeasure } from '@/types/product'; // Import UnitOfMeasure if needed separately
import { saveInsumosToStorage, loadInsumosFromStorage } from '@/lib/storage';

// Function to generate a simple unique ID (replace with a robust solution if needed)
const generateId = (): string => `insumo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export const useInsumos = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Load insumos from storage on initial mount (client-side only)
  useEffect(() => {
    const loadedInsumos = loadInsumosFromStorage();
    setInsumos(loadedInsumos);
    setIsLoading(false); // Set loading to false after loading
  }, []);

  // Save insumos to storage whenever the insumos state changes
  useEffect(() => {
    // Don't save during initial load
    if (!isLoading) {
       saveInsumosToStorage(insumos);
    }
  }, [insumos, isLoading]);

  const addInsumo = useCallback((newInsumoData: Omit<Insumo, 'id'>) => {
    setInsumos((prevInsumos) => {
      const newInsumo: Insumo = {
        ...newInsumoData,
        id: generateId(),
      };
      // Ensure uniqueness of insumo code before adding
       if (prevInsumos.some(i => i.code === newInsumo.code)) {
         console.warn(`Insumo code ${newInsumo.code} already exists. Skipping add.`);
         // Optionally throw an error or show a toast message
         throw new Error(`Código de insumo ${newInsumo.code} já existe.`);
       }
      return [...prevInsumos, newInsumo];
    });
  }, []);

  const updateInsumo = useCallback((updatedInsumo: Insumo) => {
     setInsumos((prevInsumos) => {
       // Ensure uniqueness of insumo code if it's being changed
       const originalInsumo = prevInsumos.find(i => i.id === updatedInsumo.id);
       if (originalInsumo && originalInsumo.code !== updatedInsumo.code) {
         if (prevInsumos.some(i => i.id !== updatedInsumo.id && i.code === updatedInsumo.code)) {
           console.warn(`Insumo code ${updatedInsumo.code} already exists. Skipping update.`);
           // Optionally throw an error or show a toast message
            throw new Error(`Código de insumo ${updatedInsumo.code} já existe.`);
         }
       }
       return prevInsumos.map((insumo) =>
         insumo.id === updatedInsumo.id ? updatedInsumo : insumo
       );
     });
  }, []);


  const deleteInsumo = useCallback((insumoId: string) => {
    setInsumos((prevInsumos) =>
      prevInsumos.filter((insumo) => insumo.id !== insumoId)
    );
  }, []);

  const getInsumoById = useCallback((insumoId: string): Insumo | undefined => {
    return insumos.find((insumo) => insumo.id === insumoId);
  }, [insumos]);

  const getInsumoByCode = useCallback((insumoCode: string): Insumo | undefined => {
    return insumos.find((insumo) => insumo.code === insumoCode);
  }, [insumos]);


  return {
    insumos,
    addInsumo,
    updateInsumo,
    deleteInsumo,
    getInsumoById,
    getInsumoByCode,
    isLoading, // Expose loading state
  };
};
