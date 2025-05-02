'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface AutocompleteInputProps<T> {
  items: T[];
  filterFn: (item: T, query: string) => boolean;
  renderSuggestion: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  placeholder?: string;
  inputClassName?: string;
  suggestionsClassName?: string;
  value?: string; // Control input value externally if needed
  onChange?: (value: string) => void; // Notify parent of input changes
  labelKey?: keyof T; // Key to display in input after selection
}

export function AutocompleteInput<T>({
  items,
  filterFn,
  renderSuggestion,
  onSelect,
  placeholder,
  inputClassName,
  suggestionsClassName,
  value: controlledValue,
  onChange: notifyChange,
  labelKey,
}: AutocompleteInputProps<T>) {
  const [inputValue, setInputValue] = useState(controlledValue ?? '');
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync internal state if controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInputValue(controlledValue);
       if(controlledValue === '') {
         setSuggestions([]); // Clear suggestions when controlled value is cleared
         setIsOpen(false);
       }
    }
  }, [controlledValue]);


  const updateSuggestions = useCallback((query: string) => {
    if (!query) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    const filtered = items.filter(item => filterFn(item, query));
    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
    setActiveIndex(-1); // Reset active index on new suggestions
  }, [items, filterFn]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    notifyChange?.(newValue); // Notify parent
    updateSuggestions(newValue);
  };

  const handleSelect = (item: T) => {
    const displayValue = labelKey && typeof item === 'object' && item !== null && labelKey in item
      ? String((item as any)[labelKey])
      : ''; // Use empty string or item itself if labelKey not applicable/found
    setInputValue(displayValue);
    notifyChange?.(displayValue); // Notify parent of selection
    onSelect(item);
    setIsOpen(false);
    setSuggestions([]); // Clear suggestions after selection
    setActiveIndex(-1);
  };

   const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex === suggestions.length - 1 ? 0 : prevIndex + 1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex <= 0 ? suggestions.length - 1 : prevIndex - 1
        );
        break;
      case 'Enter':
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          event.preventDefault();
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  // Scroll active suggestion into view
  useEffect(() => {
    if (activeIndex >= 0 && suggestionsRef.current) {
      const activeElement = suggestionsRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("w-full", inputClassName)}
        autoComplete="off"
        onFocus={() => inputValue && suggestions.length > 0 && setIsOpen(true)} // Reopen if there's input and suggestions
      />
      {isOpen && suggestions.length > 0 && (
        <Card ref={suggestionsRef} className={cn("absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-popover shadow-lg", suggestionsClassName)}>
          <CardContent className="p-0">
            {suggestions.map((item, index) => (
              <div
                key={index} // Consider using a more stable key if possible
                onClick={() => handleSelect(item)}
                className={cn(
                  "p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground",
                  index === activeIndex && "bg-accent text-accent-foreground"
                )}
              >
                {renderSuggestion(item)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
