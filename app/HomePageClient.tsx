"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Movie, Category } from "@/lib/data";
import type { FilterItem, FilterSelection } from "@/lib/filters";
import { FILTER_GROUPS } from "@/lib/filters";
import { TopNav } from "./components/TopNav";
import { BottomNav } from "./components/BottomNav";
import { SearchBar } from "./components/SearchBar";
import { MovieGrid } from "./components/MovieGrid";
import { FilterPanel } from "./components/FilterPanel";
import { CategoryChips } from "./components/CategoryChips";
import { VideoModal } from "./components/VideoModal";
import { Pagination } from "./components/Pagination";

const LIMIT = 32;

/** Map top-level nav modes to filter panel highlights */
const MODE_TO_FILTER: Record<string, FilterSelection> = {
  netflix: { groupId: "platform", itemKey: "netflix" },
  thai: { groupId: "country", itemKey: "thai" },
};

export default function HomePage() {
  const router = useRouter();
  const [nav, setNav] = useState("home");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState("");
  const [activeCatUrl, setActiveCatUrl] = useState("");
  const [filter, setFilter] = useState<FilterSelection | null>(null);
  const [showFilterMobile, setShowFilterMobile] = useState(false);
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);
  const [totalMovies, setTotalMovies] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  const [version, setVersion] = useState("");
  const [buildTime, setBuildTime] = useState("");
  const [source, setSource] = useState("");

  const requestId = useRef(0);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        setTotalMovies(d.totalMovies);
        setLastUpdate(d.scrapedAt);
        setVersion(d.version || "");
        setBuildTime(d.buildTime || "");
      })
      .catch(() => {});
  }, []);

  const loadMovies = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);

    if (nav === "request") {
      setMovies([]);
      setTotal(0);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    if (nav === "saved") {
      try {
        const saved: Movie[] = JSON.parse(localStorage.getItem("nunghd_saved") || "[]");
        if (id !== requestId.current) return;
        setMovies(saved);
        setTotal(saved.length);
        setTotalPages(1);
        setSource("saved");
      } catch {
        if (id === requestId.current) setMovies([]);
      }
      if (id === requestId.current) setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    params.set("limit", String(LIMIT));
    params.set("page", String(page));

    if (activeCatUrl) {
      params.set("cat", activeCatUrl);
    } else if (search) {
      params.set("search", search);
    } else {
      params.set("mode", nav);
    }

    try {
      const res = await fetch(`/api/movies?${params}`);
      const data = await res.json();

      if (id !== requestId.current) return;

      setMovies(data.movies);
      setTotal(data.total);
      setTotalPages(data.totalPages || Math.ceil(data.total / LIMIT));
      setSource(data.source || "");
      if (data.source === "live") setTotalMovies(data.total);
    } catch {
      if (id === requestId.current) {
        setMovies([]);
      }
    }
    if (id === requestId.current) setLoading(false);
  }, [nav, search, activeCatUrl, page]);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  // Compute which filter is active from current state (for highlight)
  const activeFilter: FilterSelection | null = filter;

  const handleFilter = useCallback((item: FilterItem | null) => {
    if (item === null) {
      // Clear all filters
      setFilter(null);
      setActiveCat("");
      setActiveCatUrl("");
      setSearch("");
      setNav("home");
      setPage(1);
      setShowFilterMobile(false);
      return;
    }

    // Check if toggling off the same filter
    if (filter?.groupId === findGroupForItem(item.key) && filter?.itemKey === item.key) {
      setFilter(null);
      setActiveCat("");
      setActiveCatUrl("");
      setSearch("");
      setNav("home");
      setPage(1);
      setShowFilterMobile(false);
      return;
    }

    const groupId = findGroupForItem(item.key);
    const newFilter: FilterSelection = { groupId, itemKey: item.key };
    setFilter(newFilter);

    switch (item.type) {
      case "cat":
        setActiveCat(item.label);
        setActiveCatUrl(item.value);
        setSearch("");
        break;
      case "search":
        setActiveCat("");
        setActiveCatUrl("");
        setSearch(item.value);
        break;
      case "mode":
        setActiveCat("");
        setActiveCatUrl("");
        setSearch("");
        setNav(item.value);
        break;
    }
    setPage(1);
    setShowFilterMobile(false);
  }, [filter]);

  const handleNav = useCallback((key: string) => {
    setNav(key);
    setSearch("");
    setActiveCat("");
    setActiveCatUrl("");
    setPage(1);
    // Sync filter highlight for modes that have a matching filter
    const fs = MODE_TO_FILTER[key] || null;
    setFilter(fs);
  }, []);

  const handleSearch = useCallback(() => {
    setActiveCat("");
    setActiveCatUrl("");
    setFilter(null);
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setSearch("");
    setActiveCat("");
    setActiveCatUrl("");
    setFilter(null);
    setPage(1);
  }, []);

  const handleCategory = useCallback((name: string, url?: string) => {
    if (name === "" || name === activeCat) {
      setActiveCat("");
      setActiveCatUrl("");
      setSearch("");
      setFilter(null);
      setPage(1);
      return;
    }
    setActiveCat(name);
    setActiveCatUrl(url || "");
    setSearch("");
    setFilter(null);
    setPage(1);
  }, [activeCat]);

  const handlePage = useCallback((p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const sectionTitle =
    nav === "request"
      ? "ขอหนัง"
      : nav === "imdb"
        ? "TOP IMDb"
        : nav === "saved"
          ? "บันทึกไว้"
          : activeCat
            ? `หมวด: ${activeCat}${source.includes("live") ? " (สด)" : ""}`
            : search
              ? `ผลค้นหา: "${search}"${source.includes("live") ? " (สด)" : ""}`
              : {
                  home: "หนังทั้งหมด",
                  online: "ดูหนังออนไลน์",
                  netflix: "ดูหนังNETFLIX",
                  thai: "ดูหนังไทย",
                  new: "ดูหนังใหม่ชนโรง",
                }[nav] || "หนังทั้งหมด";

  const sourceLabel =
    source === "live-cat" || source === "live-cat-cache" ? "สด" :
    source === "live-search" || source === "live-search-cache" ? "สด" :
    source === "live" ? "สด" :
    source === "cache" ? "แคช" : "";

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-surface border-b-2 border-primary sticky top-0 z-[100] px-4 md:px-6 py-3">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <h1
              className="font-heading text-[22px] font-extrabold text-primary cursor-pointer"
              onClick={() => {
                setNav("home");
                setSearch("");
                setActiveCat("");
                setActiveCatUrl("");
                setFilter(null);
                setPage(1);
              }}
            >
              NUNGHD4K
            </h1>
            <span className="text-dim text-[13px] hidden sm:inline">Viewer</span>
            {version && (
              <span
                className="text-[10px] text-dim bg-bg px-1.5 py-0.5 rounded font-mono hidden sm:inline"
                title={`Build: ${buildTime ? new Date(buildTime).toLocaleString("th-TH") : "unknown"}`}
              >
                v{version}
              </span>
            )}
            {lastUpdate && (
              <span className="text-[10px] text-dim/60 hidden md:inline" title="อัปเดตข้อมูลล่าสุด">
                {formatRelative(lastUpdate)}
              </span>
            )}
          </div>
          <div className="flex-1 max-w-[420px]">
            <SearchBar
              value={search}
              onChange={setSearch}
              onSearch={handleSearch}
              onClear={handleClear}
            />
          </div>
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            {/* Mobile filter button */}
            <button
              onClick={() => setShowFilterMobile(true)}
              className="lg:hidden relative text-dim hover:text-primary transition-colors cursor-pointer shrink-0"
              aria-label="ตัวกรอง"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="8" y1="10" x2="17" y2="10" />
                <line x1="12" y1="15" x2="17" y2="15" />
                <circle cx="6" cy="5" r="1.5" />
                <circle cx="6" cy="10" r="1.5" />
                <circle cx="10" cy="15" r="1.5" />
              </svg>
              {filter && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-black w-4 h-4 rounded-full font-bold flex items-center justify-center">
                  1
                </span>
              )}
            </button>

            <div className="text-xs text-dim whitespace-nowrap text-right hidden sm:block">
              <span className="text-primary font-bold">{totalMovies.toLocaleString()}</span> เรื่อง
              {sourceLabel && (
                <span className="ml-1 px-1 py-0.5 rounded text-[10px] bg-primary/15 text-primary">
                  {sourceLabel}
                </span>
              )}
            </div>

            {/* Settings gear */}
            <button
              onClick={() => router.push("/settings")}
              title="ตั้งค่า"
              className="text-dim hover:text-text transition-colors cursor-pointer"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="10" cy="10" r="2.5" />
                <path d="M10 1.5a1.5 1.5 0 0 1 1.5 1.5c0 .7.5 1.1 1.2.8l1.3-.5a1.5 1.5 0 0 1 1.9.7l.5.8a1.5 1.5 0 0 1-.4 2l-.9.7c-.5.4-.5 1 0 1.4l.9.7a1.5 1.5 0 0 1 .4 2l-.5.9a1.5 1.5 0 0 1-1.9.7l-1.3-.5c-.7-.3-1.2 0-1.2.7A1.5 1.5 0 0 1 10 17.5a1.5 1.5 0 0 1-1.5-1.5c0-.7-.5-1.1-1.2-.8l-1.3.5a1.5 1.5 0 0 1-1.9-.7l-.5-.8a1.5 1.5 0 0 1 .4-2l.9-.7c.5-.4.5-1 0-1.4l-.9-.7a1.5 1.5 0 0 1-.4-2l.5-.9a1.5 1.5 0 0 1 1.9-.7l1.3.5c.7.3 1.2 0 1.2-.8A1.5 1.5 0 0 1 10 1.5z" />
              </svg>
            </button>

            {/* Logout */}
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
                router.refresh();
              }}
              title="ออกจากระบบ"
              className="text-dim hover:text-danger transition-colors cursor-pointer"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <TopNav active={nav} onSelect={handleNav} />

      {nav !== "saved" && (
        <CategoryChips
          categories={categories}
          active={activeCat}
          onSelect={handleCategory}
        />
      )}

      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
        <div className="max-w-[1500px] mx-auto flex gap-5 p-4 md:p-6 overflow-x-hidden">
          {/* Desktop: FilterPanel as sidebar — hidden in saved mode */}
          {nav !== "saved" && (
            <FilterPanel
              active={activeFilter}
              onSelect={handleFilter}
            />
          )}

          {/* Mobile: overlay FilterPanel */}
          {showFilterMobile && nav !== "saved" && (
            <FilterPanel
              active={activeFilter}
              onSelect={handleFilter}
              mobile
              onClose={() => setShowFilterMobile(false)}
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                <span className="inline-block w-1 h-5 bg-primary rounded-sm" />
                {sectionTitle}
              </h2>
              <span className="text-dim text-[13px]">{total.toLocaleString()} เรื่อง</span>
            </div>

            {nav === "saved" && movies.length === 0 && !loading ? (
              <div className="text-center py-16 text-dim">
                <div className="text-5xl mb-3">💾</div>
                <p className="font-body">ยังไม่มีหนังที่บันทึกไว้</p>
                <p className="text-xs mt-1 font-body">กด 💾 ในหน้าดูหนังเพื่อบันทึกไว้ดูภายหลัง</p>
              </div>
            ) : nav === "request" ? (
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
                {nav !== "saved" && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPage={handlePage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <BottomNav active={nav} onSelect={handleNav} />

      <VideoModal movie={modalMovie} onClose={() => setModalMovie(null)} />
    </div>
  );
}

/** Find which group a filter item key belongs to */
function findGroupForItem(key: string): string {
  for (const g of FILTER_GROUPS) {
    for (const item of g.items) {
      if (item.key === key) return g.id;
    }
  }
  return "genre";
}

function formatRelative(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso);
  if (isNaN(then.getTime())) return "";
  const now = new Date();
  const diff = now.getTime() - then.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins}นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ชม.ที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}วันที่แล้ว`;
  return then.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}
