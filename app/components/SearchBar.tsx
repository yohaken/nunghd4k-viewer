"use client";

import { memo, useRef, useCallback } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export const SearchBar = memo(function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
}: SearchBarProps) {
  const ref = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      onChange(v);
      clearTimeout(timer.current);
      timer.current = setTimeout(onSearch, 350);
    },
    [onChange, onSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        clearTimeout(timer.current);
        onSearch();
      }
    },
    [onSearch]
  );

  return (
    <div className="flex items-center bg-bg border border-border rounded-btn overflow-hidden focus-within:border-primary transition-colors">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="ค้นหาหนัง..."
        className="flex-1 px-3.5 py-2.5 bg-transparent border-none outline-none text-sm text-text placeholder:text-dim min-w-0"
        autoComplete="off"
      />
      {value && (
        <button
          onClick={onClear}
          className="px-2 text-dim hover:text-text transition-colors cursor-pointer"
          aria-label="ล้าง"
        >
          &times;
        </button>
      )}
      <button
        onClick={onSearch}
        className="px-4 py-2.5 bg-primary text-black text-sm font-semibold hover:bg-primary-dim transition-colors cursor-pointer"
      >
        ค้นหา
      </button>
    </div>
  );
});
