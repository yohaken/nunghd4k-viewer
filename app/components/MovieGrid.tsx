"use client";

import { memo } from "react";
import type { Movie } from "@/lib/data";
import { MovieCard } from "./MovieCard";

interface MovieGridProps {
  movies: Movie[];
  loading: boolean;
  onMovieClick: (movie: Movie) => void;
}

export const MovieGrid = memo(function MovieGrid({
  movies,
  loading,
  onMovieClick,
}: MovieGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 flex-col gap-3 col-span-full">
        <div className="w-9 h-9 border-[3px] border-border border-t-primary rounded-full animate-spin" />
        <span className="text-dim text-sm">กำลังโหลด...</span>
      </div>
    );
  }

  if (!movies.length) {
    return (
      <div className="text-center py-16 text-dim col-span-full">
        <div className="text-4xl mb-3">🔍</div>
        <p>ไม่พบหนังที่ค้นหา</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {movies.map((movie) => (
        <MovieCard key={movie.slug} movie={movie} onClick={onMovieClick} />
      ))}
    </div>
  );
});
