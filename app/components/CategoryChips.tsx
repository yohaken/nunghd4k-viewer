"use client";

import { memo, useRef, useCallback } from "react";

interface CategoryChipsProps {
  categories: { name: string }[];
  active: string;
  onSelect: (name: string) => void;
}

export const CategoryChips = memo(function CategoryChips({
  categories,
  active,
  onSelect,
}: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.6 * dir, behavior: "smooth" });
  }, []);

  return (
    <div className="relative flex items-center gap-1 px-3 py-2 bg-surface border-b border-border lg:hidden">
      <button
        onClick={() => scroll(-1)}
        className="shrink-0 w-7 h-7 rounded-full bg-raised border border-border flex items-center justify-center text-dim hover:text-text text-sm cursor-pointer"
        aria-label="เลื่อนซ้าย"
      >
        ‹
      </button>

      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 pb-0.5"
      >
        <button
          onClick={() => onSelect("")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
            active === ""
              ? "bg-primary text-black border-primary"
              : "bg-raised text-dim border-border hover:text-text hover:border-text/30"
          }`}
        >
          ทั้งหมด
        </button>
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onSelect(active === cat.name ? "" : cat.name)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              active === cat.name
                ? "bg-primary text-black border-primary"
                : "bg-raised text-dim border-border hover:text-text hover:border-text/30"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <button
        onClick={() => scroll(1)}
        className="shrink-0 w-7 h-7 rounded-full bg-raised border border-border flex items-center justify-center text-dim hover:text-text text-sm cursor-pointer"
        aria-label="เลื่อนขวา"
      >
        ›
      </button>
    </div>
  );
});
