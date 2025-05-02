
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Sale } from '@/types/sale';
import type { CartItem } from '@/types/table';
import { loadSalesHistoryFromStorage, saveSalesHistoryToStorage } from '@/lib/storage';
import { isToday, isThisWeek, isThisMonth } from '@/lib/dateUtils';

// Function to generate a simple unique ID for sales
const generateSaleId = (): string => `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export type SalesPeriod = 'day' | 'week' | 'month' | 'all';

export const useSalesHistory = () => {
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load sales history from storage on initial mount
  useEffect(() => {
    const loadedSales = loadSalesHistoryFromStorage();
    setSalesHistory(loadedSales);
    setIsLoading(false);
  }, []);

  // Save sales history to storage whenever the state changes
  useEffect(() => {
    if (!isLoading) {
      saveSalesHistoryToStorage(salesHistory);
    }
  }, [salesHistory, isLoading]);

  /**
   * Adds a completed sale to the history.
   * @param saleData - The details of the sale (excluding id and timestamp, which are added automatically).
   */
  const addSale = useCallback((saleData: { tableNumber: number; items: CartItem[]; totalAmount: number }) => {
    setSalesHistory((prevHistory) => {
      const newSale: Sale = {
        ...saleData,
        id: generateSaleId(),
        timestamp: Date.now(), // Record the time of sale completion
      };
      // Add the new sale and sort by timestamp descending (most recent first)
      return [...prevHistory, newSale].sort((a, b) => b.timestamp - a.timestamp);
    });
  }, []);

  /**
   * Filters the sales history based on a specified period.
   * @param period - The period to filter by ('day', 'week', 'month', 'all').
   * @returns An array of Sale objects filtered by the specified period.
   */
  const getSalesByPeriod = useCallback((period: SalesPeriod): Sale[] => {
    if (isLoading) return []; // Return empty if still loading

    switch (period) {
      case 'day':
        return salesHistory.filter(sale => isToday(sale.timestamp));
      case 'week':
        return salesHistory.filter(sale => isThisWeek(sale.timestamp));
      case 'month':
        return salesHistory.filter(sale => isThisMonth(sale.timestamp));
      case 'all':
      default:
        return salesHistory;
    }
  }, [salesHistory, isLoading]);

   /**
   * Calculates the total sales amount for a given period.
   * @param period - The period to calculate for ('day', 'week', 'month', 'all').
   * @returns The total sales amount for the period.
   */
  const calculateTotalSales = useCallback((period: SalesPeriod): number => {
    const filteredSales = getSalesByPeriod(period);
    return filteredSales.reduce((total, sale) => total + sale.totalAmount, 0);
  }, [getSalesByPeriod]);

   /**
    * Gets the most sold products for a given period.
    * @param period - The period to analyze.
    * @param limit - The maximum number of top products to return.
    * @returns An array of objects containing product name and quantity sold, sorted descending.
    */
    const getTopSellingProducts = useCallback((period: SalesPeriod, limit: number = 5): { name: string; quantity: number }[] => {
        const filteredSales = getSalesByPeriod(period);
        const productCounts: { [key: string]: number } = {};

        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
            });
        });

        return Object.entries(productCounts)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity) // Sort descending by quantity
            .slice(0, limit); // Take the top 'limit' products
    }, [getSalesByPeriod]);


  return {
    salesHistory,
    isLoading,
    addSale,
    getSalesByPeriod,
    calculateTotalSales,
    getTopSellingProducts,
  };
};
