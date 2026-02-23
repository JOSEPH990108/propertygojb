// src\components\custom\ui\SearchableDropdown.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
export interface DropdownOption {
  id: string;
  label: string;
  imageUrl?: string;
}

interface QuickSelectAction {
  label: string;
  actionText: string;
  optionId: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  selected: DropdownOption | null;
  onSelect: (option: DropdownOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  quickAction?: QuickSelectAction;
  /** * Controls the "Window Size". 
   * Example: If set to 5, the dropdown height will match 5 items. 
   * You can still scroll to see the rest.
   * @default 5 
   */
  maxVisibleItems?: number;
}

// Fixed height per item (48px) ensures smooth math for the window size
const ITEM_HEIGHT = 48;

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  selected,
  onSelect,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  quickAction,
  maxVisibleItems = 5,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query]);

  const handleSelect = (option: DropdownOption) => {
    onSelect(option);
    setIsOpen(false);
    setQuery('');
  };

  const handleQuickAction = () => {
    if (!quickAction) return;
    const found = options.find((o) => o.id === quickAction.optionId);
    if (found) handleSelect(found);
  };

  // 1. Calculate the maximum height the list is allowed to take.
  // This sets the "Window Size".
  const listMaxHeight = maxVisibleItems * ITEM_HEIGHT;

  return (
    <div className="relative w-80 font-sans text-foreground z-50" ref={containerRef}>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground));
        }
      `}</style>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-popover p-3 border rounded-lg transition-all duration-200
          ${isOpen 
            ? 'border-ring ring-2 ring-ring/20 rounded-b-none border-b-0'
            : 'border-input hover:border-ring/50'}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {selected ? (
            <>
              {selected.imageUrl && (
                <img 
                  src={selected.imageUrl} 
                  alt="" 
                  className="w-6 h-6 rounded-full object-cover border border-border shrink-0"
                />
              )}
              <span className="font-medium text-lg text-foreground truncate">{selected.label}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            // Removed overflow-hidden here to fix the "clipping" bug you saw before
            className="absolute left-0 right-0 top-full bg-popover border border-t-0 border-ring rounded-b-lg shadow-xl"
          >
            
            {/* Search (Fixed at top) */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:border-ring text-foreground"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Action (Fixed at top) */}
            {quickAction && (
              <div className="px-4 py-2 border-b border-border bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  {quickAction.label}{' '}
                  <button
                    type="button"
                    onClick={handleQuickAction}
                    className="font-semibold text-primary hover:underline cursor-pointer bg-transparent border-none p-0 ml-1"
                  >
                    {quickAction.actionText}
                  </button>
                </p>
              </div>
            )}

            {/* Scrollable List Area */}
            <ul data-lenis-prevent
              className="overflow-y-auto custom-scrollbar"
              // 2. Apply max height here. If list is longer, scrollbar appears.
              style={{ maxHeight: `${listMaxHeight}px` }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = selected?.id === option.id;
                  return (
                    <li
                      key={option.id}
                      onClick={() => handleSelect(option)}
                      // 3. Fixed height (h-12 / 48px) ensures the calculation matches exactly.
                      className={`
                        h-12 
                        flex items-center justify-between px-4 cursor-pointer transition-colors
                        ${isSelected ? 'bg-accent/20' : 'hover:bg-muted'}
                      `}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {option.imageUrl && (
                          <img 
                            src={option.imageUrl} 
                            alt="" 
                            className="w-6 h-6 rounded-full object-cover border border-border shadow-sm shrink-0"
                          />
                        )}
                        <span className={`text-base truncate ${isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                          {option.label}
                        </span>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
                    </li>
                  );
                })
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">No results found</div>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableDropdown;