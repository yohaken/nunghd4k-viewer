"use client";

import { memo, useState, useCallback } from "react";
import { FILTER_GROUPS, type FilterItem, type FilterSelection } from "@/lib/filters";

interface FilterPanelProps {
  active: FilterSelection | null;
  onSelect: (item: FilterItem | null) => void;
  /** Show as mobile overlay (default false = desktop sidebar) */
  mobile?: boolean;
  onClose?: () => void;
}

export const FilterPanel = memo(function FilterPanel({
  active,
  onSelect,
  mobile = false,
  onClose,
}: FilterPanelProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(FILTER_GROUPS.map((g) => g.id))
  );

  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const isActive = (group: string, key: string) =>
    active?.groupId === group && active?.itemKey === key;

  const handleSelect = (item: FilterItem) => {
    if (isActive(item.key === "series-korean" ? "series" : item.key, item.key)) {
      onSelect(null); // toggle off
    } else {
      onSelect(item);
    }
  };

  const panel = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <h3 className="font-heading text-sm font-semibold text-primary">
          ตัวกรอง
        </h3>
        {mobile && (
          <button
            onClick={onClose}
            className="text-dim hover:text-text text-xl leading-none cursor-pointer"
            aria-label="ปิด"
          >
            ×
          </button>
        )}
      </div>

      {/* Clear all */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-3 py-2 rounded-btn text-[13px] font-medium transition-colors cursor-pointer mb-3 ${
          active === null
            ? "bg-primary text-black"
            : "bg-raised text-dim border border-border hover:text-text"
        }`}
      >
        🔍 ทั้งหมด
      </button>

      {/* Accordion groups */}
      <div className="space-y-2">
        {FILTER_GROUPS.map((group) => {
          const open = openGroups.has(group.id);
          return (
            <div
              key={group.id}
              className="bg-raised border border-border rounded-btn overflow-hidden"
            >
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface/50 transition-colors cursor-pointer"
              >
                <span className="text-[13px] font-heading font-semibold text-text">
                  {group.label}
                </span>
                <span className="text-dim text-xs transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
                  ▼
                </span>
              </button>

              {open && (
                <div className="px-2 pb-2 grid grid-cols-2 gap-1.5">
                  {group.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleSelect(item)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-btn text-[12px] transition-colors cursor-pointer text-left ${
                        isActive(group.id, item.key)
                          ? "bg-primary text-black font-semibold"
                          : "text-dim hover:text-text hover:bg-surface"
                      }`}
                    >
                      <span className="text-sm leading-none">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  // Desktop: sticky sidebar
  if (!mobile) {
    return (
      <aside className="w-[220px] flex-shrink-0 hidden lg:block sticky top-[120px] self-start max-h-[calc(100vh-140px)] overflow-y-auto bg-surface rounded-card p-4">
        {panel}
      </aside>
    );
  }

  // Mobile: overlay panel
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[200] lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[300px] max-w-[85vw] bg-surface border-l border-border z-[210] overflow-y-auto p-4 lg:hidden shadow-2xl animate-slideIn">
        {panel}
      </div>
    </>
  );
});
