"use client";

import { memo } from "react";

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
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-6 py-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="px-4 py-2 border border-border bg-surface text-text rounded-btn text-sm transition-colors hover:enabled:bg-primary hover:enabled:text-black hover:enabled:border-primary disabled:opacity-35 cursor-pointer"
      >
        ‹ ก่อนหน้า
      </button>
      <span className="text-dim text-sm">
        หน้า {page} / {totalPages} — {total} เรื่อง
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="px-4 py-2 border border-border bg-surface text-text rounded-btn text-sm transition-colors hover:enabled:bg-primary hover:enabled:text-black hover:enabled:border-primary disabled:opacity-35 cursor-pointer"
      >
        ถัดไป ›
      </button>
    </div>
  );
});
