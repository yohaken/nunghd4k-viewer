"use client";

import { memo, useRef, useState, useEffect, useCallback } from "react";

const BOTTOM_ITEMS = [
  { key: "home", icon: "🏠", label: "หน้าแรก" },
  { key: "online", icon: "🎬", label: "ดูหนัง" },
  { key: "netflix", icon: "🎥", label: "NETFLIX" },
  { key: "thai", icon: "🇹🇭", label: "หนังไทย" },
  { key: "new", icon: "🆕", label: "ใหม่ชนโรง" },
  { key: "imdb", icon: "⭐", label: "TOP IMDb" },
  { key: "request", icon: "✉️", label: "ขอหนัง" },
  { key: "saved", icon: "💾", label: "บันทึกไว้" },
] as const;

interface BottomNavProps {
  active: string;
  onSelect: (key: string) => void;
}

export const BottomNav = memo(function BottomNav({ active, onSelect }: BottomNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScroll(el.scrollWidth > el.clientWidth + 2);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  // Force a recheck when item active changes (might affect layout)
  useEffect(() => { checkScroll(); }, [active, checkScroll]);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border z-50 safe-area-bottom">
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex items-center overflow-x-auto scrollbar-none px-1"
        >
          {BOTTOM_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2.5 min-w-[48px] text-[11px] transition-colors cursor-pointer shrink-0 ${
                active === item.key ? "text-primary" : "text-dim hover:text-text"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="font-medium truncate max-w-[56px]">{item.label}</span>
            </button>
          ))}
        </div>

        {/* overflow indicator — dim gradient + arrow on right edge */}
        {canScroll && (
          <>
            <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-surface to-transparent" />
            <div className="absolute top-0 right-0 bottom-0 w-5 flex items-center justify-end pr-0.5">
              <span className="text-[10px] text-dim/60 pointer-events-none">›</span>
            </div>
          </>
        )}
      </div>
    </nav>
  );
});
