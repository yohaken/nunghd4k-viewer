"use client";

import { memo } from "react";
import type { Movie } from "@/lib/data";

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
}

export const MovieCard = memo(function MovieCard({ movie, onClick }: MovieCardProps) {
  return (
    <div
      onClick={() => onClick(movie)}
      className="group bg-surface rounded-card overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(102,204,0,0.15)]"
      title={movie.title}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-border">
        <img
          src={movie.image}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='350' height='465'%3E%3Crect fill='%23222' width='350' height='465'/%3E%3Ctext x='175' y='232' text-anchor='middle' fill='%23666' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
          }}
        />
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black text-lg shadow-lg">
            ▶
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between pointer-events-none">
          {movie.quality ? (
            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-primary text-black">
              {movie.quality}
            </span>
          ) : (
            <span />
          )}
          {movie.rating ? (
            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-black/75 text-yellow-400 flex items-center gap-0.5">
              ⭐{movie.rating}
            </span>
          ) : (
            <span />
          )}
        </div>
      </div>
      <div className="p-2.5">
        {movie.language && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary mb-1.5">
            {movie.language}
          </span>
        )}
        <h3 className="text-[13px] font-semibold leading-tight line-clamp-2">
          {movie.title}
        </h3>
      </div>
    </div>
  );
});
