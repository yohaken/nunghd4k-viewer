"use client";

import { memo, useState, useCallback } from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}

export const Pagination = memo(function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: PaginationProps) {
  const [jump, setJump] = useState("");

  const goJump = useCallback(() => {
    const n = parseInt(jump, 10);
    if (n >= 1 && n <= totalPages) {
      onPage(n);
      setJump("");
    }
  }, [jump, totalPages, onPage]);

  const handleJumpKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") goJump();
    },
    [goJump]
  );

  if (totalPages <= 1) return null;

  // Build visible page buttons with ellipsis
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-6 py-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="px-3 py-2 border border-border bg-surface text-text rounded-btn text-sm transition-colors hover:enabled:bg-primary hover:enabled:text-black hover:enabled:border-primary disabled:opacity-35 cursor-pointer"
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-dim text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`px-3 py-2 min-w-[36px] text-sm border rounded-btn transition-colors cursor-pointer ${
              p === page
                ? "bg-primary text-black border-primary font-bold"
                : "border-border bg-surface text-text hover:bg-primary hover:text-black hover:border-primary"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-2 border border-border bg-surface text-text rounded-btn text-sm transition-colors hover:enabled:bg-primary hover:enabled:text-black hover:enabled:border-primary disabled:opacity-35 cursor-pointer"
      >
        ›
      </button>

      {/* Page jump */}
      <span className="ml-3 flex items-center gap-1 text-sm text-dim">
        ไปหน้า
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jump}
          onChange={(e) => setJump(e.target.value)}
          onKeyDown={handleJumpKey}
          placeholder={String(page)}
          className="w-12 px-2 py-1.5 bg-bg border border-border rounded-btn text-center text-text text-sm focus:border-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={goJump}
          disabled={!jump}
          className="px-2 py-1.5 bg-primary text-black text-sm font-semibold rounded-btn hover:bg-primary-dim disabled:opacity-35 transition-colors cursor-pointer"
        >
          ไป
        </button>
        <span className="ml-1 text-xs">
          / {totalPages} ({total.toLocaleString()} เรื่อง)
        </span>
      </span>
    </div>
  );
});
