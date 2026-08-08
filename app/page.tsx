"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Movie, Category } from "@/lib/data";
import { TopNav } from "./components/TopNav";
import { BottomNav } from "./components/BottomNav";
import { SearchBar } from "./components/SearchBar";
import { MovieGrid } from "./components/MovieGrid";
import { CategorySidebar } from "./components/CategorySidebar";
import { CategoryChips } from "./components/CategoryChips";
import { VideoModal } from "./components/VideoModal";
import { Pagination } from "./components/Pagination";

export const dynamic = "force-dynamic";

const LIMIT = 32;

export default function HomePage() {
  const { data: session } = useSession();
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
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);
  const [totalMovies, setTotalMovies] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  const [source, setSource] = useState("");
  const [showMenu, setShowMenu] = useState(false);

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

    const params = new URLSearchParams();
    params.set("limit", String(LIMIT));
    params.set("page", String(page));

    // Category filter: live fetch from WP category endpoint (uses category URL)
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

  const handleNav = useCallback((key: string) => {
    setNav(key);
    setSearch("");
    setActiveCat("");
    setActiveCatUrl("");
    setPage(1);
  }, []);

  const handleSearch = useCallback(() => {
    setActiveCat("");
    setActiveCatUrl("");
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setSearch("");
    setActiveCat("");
    setActiveCatUrl("");
    setPage(1);
  }, []);

  const handleCategory = useCallback((name: string, url?: string) => {
    if (name === "" || name === activeCat) {
      // Toggle off
      setActiveCat("");
      setActiveCatUrl("");
      setSearch("");
      setPage(1);
      return;
    }
    setActiveCat(name);
    setActiveCatUrl(url || "");
    setSearch("");
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
          <div className="flex items-center gap-3">
            <div className="text-xs text-dim whitespace-nowrap text-right hidden sm:block">
              <span className="text-primary font-bold">{totalMovies.toLocaleString()}</span> เรื่อง
              {sourceLabel && (
                <span className="ml-1 px-1 py-0.5 rounded text-[10px] bg-primary/15 text-primary">
                  {sourceLabel}
                </span>
              )}
            </div>

            {/* Settings gear — admin only */}
            {session?.user?.email === "yohaken@gmail.com" && (
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
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-dim hover:text-text transition-colors cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center overflow-hidden font-heading">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    session?.user?.name?.charAt(0)?.toUpperCase() ||
                    session?.user?.email?.charAt(0)?.toUpperCase() ||
                    "?"
                  )}
                </span>
                <span className="hidden md:inline max-w-[100px] truncate">
                  {session?.user?.name || session?.user?.email}
                </span>
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-surface border border-border rounded-btn shadow-lg z-20 py-1">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs text-text font-medium truncate font-body">
                        {session?.user?.name}
                      </p>
                      <p className="text-[11px] text-dim truncate font-body">
                        {session?.user?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full text-left px-3 py-2 text-sm text-dim hover:text-danger hover:bg-bg transition-colors cursor-pointer font-body"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <TopNav active={nav} onSelect={handleNav} />

      <CategoryChips
        categories={categories}
        active={activeCat}
        onSelect={handleCategory}
      />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-[1500px] mx-auto flex gap-5 p-4 md:p-6">
          <CategorySidebar
            categories={categories}
            active={activeCat}
            onSelect={handleCategory}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                <span className="inline-block w-1 h-5 bg-primary rounded-sm" />
                {sectionTitle}
              </h2>
              <span className="text-dim text-[13px]">{total.toLocaleString()} เรื่อง</span>
            </div>

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

      <BottomNav active={nav} onSelect={handleNav} />

      <VideoModal movie={modalMovie} onClose={() => setModalMovie(null)} />
    </div>
  );
}
