"use client";

import { memo } from "react";

const BOTTOM_ITEMS = [
  { key: "home", icon: "🏠", label: "หน้าแรก" },
  { key: "online", icon: "🎬", label: "หนัง" },
  { key: "thai", icon: "🇹🇭", label: "หนังไทย" },
  { key: "imdb", icon: "⭐", label: "TOP IMDb" },
  { key: "request", icon: "✉️", label: "ขอหนัง" },
] as const;

interface BottomNavProps {
  active: string;
  onSelect: (key: string) => void;
}

export const BottomNav = memo(function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border z-50 flex items-center justify-around safe-area-bottom">
      {BOTTOM_ITEMS.map((item) => (
        <button
          key={item.key}
          onClick={() => onSelect(item.key)}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-0 text-[11px] transition-colors cursor-pointer ${
            active === item.key ? "text-primary" : "text-dim hover:text-text"
          }`}
        >
          <span className="text-lg leading-none">{item.icon}</span>
          <span className="font-medium truncate">{item.label}</span>
        </button>
      ))}
    </nav>
  );
});
