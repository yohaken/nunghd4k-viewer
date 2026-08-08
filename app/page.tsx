"use client";

import { useState, useCallback, useEffect } from "react";
import type { Movie, Category } from "@/lib/data";
import { TopNav } from "./components/TopNav";
import { BottomNav } from "./components/BottomNav";
import { SearchBar } from "./components/SearchBar";
import { MovieGrid } from "./components/MovieGrid";
import { CategorySidebar } from "./components/CategorySidebar";
import { VideoModal } from "./components/VideoModal";
import { Pagination } from "./components/Pagination";

const LIMIT = 48;

const NAV_SEARCH: Record<string, string> = {
  home: "",
  online: "หนัง",
  netflix: "netflix",
  thai: "หนังไทย",
  new: "ใหม่",
};

const NAV_LABELS: Record<string, string> = {
  home: "หนังทั้งหมด",
  online: "ดูหนังออนไลน์",
  netflix: "ดูหนังNETFLIX",
  thai: "ดูหนังไทย",
  new: "ดูหนังใหม่ชนโรง",
  imdb: "TOP IMDb",
  request: "ขอหนัง",
};

export default function HomePage() {
  const [nav, setNav] = useState("home");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState("");
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);
  const [totalMovies, setTotalMovies] = useState(0);
  const [scrapedAt, setScrapedAt] = useState("");

  // Load categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        setTotalMovies(d.totalMovies);
        setScrapedAt(d.scrapedAt);
      })
      .catch(() => {});
  }, []);

  // Load movies
  const loadMovies = useCallback(async () => {
    setLoading(true);

    if (nav === "imdb") {
      // Top IMDb: fetch all and sort by rating
      const res = await fetch("/api/movies?limit=9999");
      const data = await res.json();
      const sorted = (data.movies as Movie[])
        .filter((m) => m.rating && !isNaN(parseFloat(m.rating)))
        .sort((a, b) => parseFloat(b.rating!) - parseFloat(a.rating!));
      setTotal(sorted.length);
      const start = (page - 1) * LIMIT;
      setMovies(sorted.slice(start, start + LIMIT));
      setLoading(false);
      return;
    }

    if (nav === "request") {
      setMovies([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    const q = activeCat || search;
    const params = new URLSearchParams();
    params.set("limit", String(LIMIT));
    params.set("page", String(page));
    if (q) params.set("search", q);

    try {
      const res = await fetch(`/api/movies?${params}`);
      const data = await res.json();
      setMovies(data.movies);
      setTotal(data.total);
    } catch {
      setMovies([]);
    }
    setLoading(false);
  }, [nav, search, activeCat, page]);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  // Nav handler
  const handleNav = useCallback((key: string) => {
    setNav(key);
    setSearch("");
    setActiveCat("");
    setPage(1);
    if (key in NAV_SEARCH && key !== "home") {
      setSearch(NAV_SEARCH[key]);
    }
  }, []);

  // Search handler
  const handleSearch = useCallback(() => {
    setNav("home");
    setActiveCat("");
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setSearch("");
    setNav("home");
    setActiveCat("");
    setPage(1);
  }, []);

  // Category handler
  const handleCategory = useCallback((name: string) => {
    setActiveCat(name);
    setSearch(name);
    setNav("home");
    setPage(1);
  }, []);

  // Pagination
  const handlePage = useCallback((p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const totalPages = Math.ceil(total / LIMIT);

  // Section title
  const sectionTitle = nav === "request"
    ? "ขอหนัง"
    : nav === "imdb"
      ? "TOP IMDb"
      : activeCat || search
        ? `ผลค้นหา: "${activeCat || search}"`
        : "หนังทั้งหมด";

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b-2 border-primary sticky top-0 z-[100] px-4 md:px-6 py-3">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <h1
              className="font-heading text-[22px] font-extrabold text-primary cursor-pointer"
              onClick={() => {
                setNav("home");
                setSearch("");
                setActiveCat("");
                setPage(1);
              }}
            >
              NUNGHD4K
            </h1>
            <span className="text-dim text-[13px] hidden sm:inline">Viewer</span>
          </div>
          <div className="flex-1 max-w-[420px]">
            <SearchBar
              value={search}
              onChange={setSearch}
              onSearch={handleSearch}
              onClear={handleClear}
            />
          </div>
          <div className="text-xs text-dim whitespace-nowrap text-right hidden sm:block">
            <span className="text-primary font-bold">{totalMovies.toLocaleString()}</span> เรื่อง
            {scrapedAt && (
              <> &middot; {new Date(scrapedAt).toLocaleString("th-TH")}</>
            )}
          </div>
        </div>
      </header>

      {/* Top Nav (desktop) */}
      <TopNav active={nav} onSelect={handleNav} />

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-[1500px] mx-auto flex gap-5 p-4 md:p-6">
          {/* Sidebar (desktop) */}
          <CategorySidebar
            categories={categories}
            active={activeCat}
            onSelect={handleCategory}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                <span className="inline-block w-1 h-5 bg-primary rounded-sm" />
                {sectionTitle}
              </h2>
              <span className="text-dim text-[13px]">{total.toLocaleString()} เรื่อง</span>
            </div>

            {/* Request page */}
            {nav === "request" ? (
              <div className="text-center py-16 text-dim">
                <div className="text-5xl mb-3">📩</div>
                <p>ติดต่อขอหนังผ่านเว็บหลัก</p>
                <a
                  href="https://www.nunghd4k.com/%E0%B8%95%E0%B8%B4%E0%B8%94%E0%B8%95%E0%B9%88%E0%B8%AD%E0%B9%80%E0%B8%A3%E0%B8%B2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-primary hover:underline"
                >
                  ไปหน้าติดต่อเรา →
                </a>
              </div>
            ) : (
              <>
                <MovieGrid
                  movies={movies}
                  loading={loading}
                  onMovieClick={setModalMovie}
                />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPage={handlePage}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Nav (mobile) */}
      <BottomNav
        active={nav}
        onSelect={handleNav}
      />

      {/* Video Modal */}
      <VideoModal movie={modalMovie} onClose={() => setModalMovie(null)} />
    </div>
  );
}
