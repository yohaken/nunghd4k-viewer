"use client";

import { memo } from "react";

interface CategorySidebarProps {
  categories: { name: string }[];
  active: string;
  onSelect: (name: string) => void;
}

export const CategorySidebar = memo(function CategorySidebar({
  categories,
  active,
  onSelect,
}: CategorySidebarProps) {
  return (
    <aside className="w-[200px] flex-shrink-0 hidden lg:block sticky top-[120px] self-start max-h-[calc(100vh-140px)] overflow-y-auto bg-surface rounded-card p-4">
      <h3 className="font-heading text-sm font-semibold text-primary mb-3 pb-2 border-b border-border">
        หมวดหมู่
      </h3>
      <ul className="space-y-0.5">
        <li>
          <button
            onClick={() => onSelect("")}
            className={`w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-colors cursor-pointer ${
              active === "" ? "bg-primary text-black font-semibold" : "text-dim hover:text-text hover:bg-raised"
            }`}
          >
            ทั้งหมด
          </button>
        </li>
        {categories.map((cat) => (
          <li key={cat.name}>
            <button
              onClick={() => onSelect(active === cat.name ? "" : cat.name)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-colors cursor-pointer ${
                active === cat.name ? "bg-primary text-black font-semibold" : "text-dim hover:text-text hover:bg-raised"
              }`}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
});
