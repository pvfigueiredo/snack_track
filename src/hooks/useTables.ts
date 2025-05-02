
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Table, TableStatus, CartItem } from '@/types/table';
import { loadTablesFromStorage, saveTablesToStorage } from '@/lib/storage';
import type { Product } from '@/types/product';

// Function to generate a simple unique ID for new tables if needed
const generateTableId = (): string => `table_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export const useTables = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load tables from storage on initial mount
  useEffect(() => {
    const loadedTables = loadTablesFromStorage();
    setTables(loadedTables);
    setIsLoading(false);
  }, []);

  // Save tables to storage whenever the state changes
  useEffect(() => {
    if (!isLoading) {
      saveTablesToStorage(tables);
    }
  }, [tables, isLoading]);

  const getTableById = useCallback((tableId: string): Table | undefined => {
    return tables.find((table) => table.id === tableId);
  }, [tables]);

  const updateTableStatus = useCallback((tableId: string, status: TableStatus) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === tableId ? { ...table, status } : table
      )
    );
  }, []);

  // --- Order Management ---

  const addItemToTableOrder = useCallback((tableId: string, product: Product) => {
    setTables((prevTables) => {
      return prevTables.map((table) => {
        if (table.id === tableId) {
          const existingItem = table.order.find((item) => item.id === product.id);
          let newOrder: CartItem[];

          if (existingItem) {
            // Increase quantity if item already exists
            newOrder = table.order.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
          } else {
            // Add new item to order
            newOrder = [...table.order, { ...product, quantity: 1 }];
          }
          // Update status to occupied if adding the first item
          const newStatus = newOrder.length > 0 ? 'occupied' : 'available';
          return { ...table, order: newOrder, status: newStatus };
        }
        return table;
      });
    });
  }, []);

  const removeItemFromTableOrder = useCallback((tableId: string, productId: string) => {
    setTables((prevTables) => {
      return prevTables.map((table) => {
        if (table.id === tableId) {
          const existingItem = table.order.find((item) => item.id === productId);
          let newOrder: CartItem[];

          if (existingItem && existingItem.quantity > 1) {
            // Decrease quantity
            newOrder = table.order.map((item) =>
              item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
            );
          } else {
            // Remove item completely
            newOrder = table.order.filter((item) => item.id !== productId);
          }
           // Update status if order becomes empty
          const newStatus = newOrder.length === 0 ? 'available' : table.status;
          return { ...table, order: newOrder, status: newStatus };
        }
        return table;
      });
    });
  }, []);

  const clearTableOrder = useCallback((tableId: string) => {
    setTables((prevTables) => {
      return prevTables.map((table) =>
        table.id === tableId ? { ...table, order: [], status: 'available' } : table
      );
    });
  }, []);

    const addTable = useCallback((tableNumber: number) => {
      setTables((prevTables) => {
          if (prevTables.some(t => t.number === tableNumber)) {
              console.warn(`Table number ${tableNumber} already exists.`);
              throw new Error(`Mesa número ${tableNumber} já existe.`);
          }
          const newTable: Table = {
              id: generateTableId(),
              number: tableNumber,
              status: 'available',
              order: [],
          };
          return [...prevTables, newTable].sort((a, b) => a.number - b.number); // Keep sorted
      });
  }, []);

  const deleteTable = useCallback((tableId: string) => {
     setTables((prevTables) => {
         const tableToDelete = prevTables.find(t => t.id === tableId);
         if(tableToDelete && tableToDelete.order.length > 0) {
             console.warn(`Cannot delete table ${tableToDelete.number} with an active order.`);
             throw new Error(`Não é possível excluir a mesa ${tableToDelete.number} com uma comanda ativa.`);
         }
         return prevTables.filter((table) => table.id !== tableId);
     });
  }, []);


  return {
    tables,
    isLoading,
    getTableById,
    updateTableStatus,
    addItemToTableOrder,
    removeItemFromTableOrder,
    clearTableOrder,
    addTable,
    deleteTable,
  };
};
