"use client";

import { memo } from "react";

const NAV_ITEMS = [
  { key: "home", label: "หน้าแรก" },
  { key: "online", label: "ดูหนังออนไลน์" },
  { key: "netflix", label: "ดูหนังNETFLIX" },
  { key: "thai", label: "ดูหนังไทย" },
  { key: "new", label: "ดูหนังใหม่ชนโรง" },
  { key: "imdb", label: "TOP IMDb" },
  { key: "request", label: "ขอหนัง" },
] as const;

interface TopNavProps {
  active: string;
  onSelect: (key: string) => void;
}

export const TopNav = memo(function TopNav({ active, onSelect }: TopNavProps) {
  return (
    <nav className="hidden md:flex items-center bg-primary px-6 overflow-x-auto scrollbar-none">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          onClick={() => onSelect(item.key)}
          className={`px-4 py-2.5 text-sm font-semibold text-black whitespace-nowrap border-b-[3px] transition-colors cursor-pointer ${
            active === item.key
              ? "border-black bg-black/6"
              : "border-transparent hover:bg-black/8"
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
});
