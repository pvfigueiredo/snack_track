
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

/**
 * Checks if a given timestamp falls within today.
 * @param timestamp - The Unix timestamp (in milliseconds).
 * @returns True if the timestamp is today, false otherwise.
 */
export function isToday(timestamp: number): boolean {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);
  return isWithinInterval(new Date(timestamp), { start, end });
}

/**
 * Checks if a given timestamp falls within the current week (Sunday to Saturday).
 * @param timestamp - The Unix timestamp (in milliseconds).
 * @returns True if the timestamp is this week, false otherwise.
 */
export function isThisWeek(timestamp: number): boolean {
  const now = new Date();
  // Use { weekStartsOn: 0 } if your week starts on Sunday
  const start = startOfWeek(now, { weekStartsOn: 0 });
  const end = endOfWeek(now, { weekStartsOn: 0 });
  return isWithinInterval(new Date(timestamp), { start, end });
}

/**
 * Checks if a given timestamp falls within the current month.
 * @param timestamp - The Unix timestamp (in milliseconds).
 * @returns True if the timestamp is this month, false otherwise.
 */
export function isThisMonth(timestamp: number): boolean {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return isWithinInterval(new Date(timestamp), { start, end });
}

/**
 * Formats a date timestamp into a readable string.
 * @param timestamp - The Unix timestamp (in milliseconds).
 * @param options - Intl.DateTimeFormat options.
 * @returns Formatted date string.
 */
export function formatDate(timestamp: number, options?: Intl.DateTimeFormatOptions): string {
    if (typeof window === 'undefined') return ''; // Avoid server-side errors
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    };
    return new Intl.DateTimeFormat('pt-BR', { ...defaultOptions, ...options }).format(new Date(timestamp));
}

/**
 * Formats a number as BRL currency.
 * @param value - The number to format.
 * @returns Formatted currency string.
 */
export function formatCurrency(value: number): string {
    if (typeof window === 'undefined') return ''; // Avoid server-side errors
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
