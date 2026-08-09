"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import type { Movie } from "@/lib/data";

interface VideoModalProps {
  movie: Movie | null;
  onClose: () => void;
}

interface PlayerSource {
  label: string;
  url: string;
  type: "yt" | "hls" | "alt";
}

async function fetchMovieDetail(slug: string) {
  const res = await fetch(`/api/movie/${encodeURIComponent(slug)}`);
  return res.json();
}

/* ── Saved movies (localStorage) ────────────────────────────────── */
const SAVED_KEY = "nunghd_saved";
function getSavedMovies(): Movie[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}
function saveMovie(m: Movie) {
  const saved = getSavedMovies();
  if (!saved.find((x) => x.slug === m.slug)) {
    saved.push(m);
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }
}
function removeSaved(slug: string) {
  const saved = getSavedMovies().filter((x) => x.slug !== slug);
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}

export const VideoModal = memo(function VideoModal({ movie, onClose }: VideoModalProps) {
  const [sources, setSources] = useState<PlayerSource[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tried, setTried] = useState(new Set<number>());
  const [allFailed, setAllFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [bufferingCount, setBufferingCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const title = movie?.title || "";
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bufferTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stallCount = useRef(0);

  // Check if already saved
  useEffect(() => {
    if (!movie) return;
    const saved = getSavedMovies();
    setIsSaved(saved.some((x) => x.slug === movie.slug));
  }, [movie]);

  const handleSave = () => {
    if (!movie) return;
    if (isSaved) {
      removeSaved(movie.slug);
      setIsSaved(false);
    } else {
      saveMovie(movie);
      setIsSaved(true);
      setShowDownloadMenu(false);
    }
  };

  const handleDownload = () => {
    if (!movie) return;
    saveMovie(movie);
    setIsSaved(true);
    // Open download page
    window.open(movie.url, "_blank");
    setShowDownloadMenu(false);
  };

  const tryServer = useCallback(
    (idx: number, s: PlayerSource[]) => {
      if (idx >= s.length) {
        setAllFailed(true);
        setBuffering(false);
        return;
      }
      setCurrentIdx(idx);
      setTried((prev) => new Set([...prev, idx]));
      setAllFailed(false);
      setBuffering(true);
      setBufferingCount(0);
      stallCount.current = 0;
    },
    []
  );

  // Load sources when movie changes
  useEffect(() => {
    if (!movie) return;
    setLoading(true);
    setSources([]);
    setCurrentIdx(0);
    setTried(new Set());
    setAllFailed(false);
    setBuffering(false);
    setBufferingCount(0);
    stallCount.current = 0;

    let cancelled = false;
    fetchMovieDetail(movie.slug)
      .then((data) => {
        if (cancelled) return;
        const s: PlayerSource[] = [];
        const seen = new Set<string>();
        const add = (label: string, url: string, type: PlayerSource["type"]) => {
          if (!url || seen.has(url)) return;
          seen.add(url);
          s.push({ label, url, type });
        };

        add("ตัวเล่นหลัก (HLS)", data.fast168Url, "hls");
        add("ตัวเล่นเว็บ", data.vidPhpUrl, "alt");
        (data.playerUrls || []).forEach((u: string, i: number) => {
          add(`ตัวเล่นสำรอง ${i + 1}`, u, "alt");
        });
        (data.allIframes || []).forEach((u: string, i: number) => {
          if (u.includes("youtube.com") || u.includes("youtu.be")) return;
          add(`แหล่งอื่น ${i + 1}`, u, "alt");
        });
        add("YouTube (ตัวอย่าง)", data.youtubeUrl, "yt");
        setSources(s);
        setLoading(false);
        if (s.length > 0) tryServer(0, s);
        else setAllFailed(true);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setAllFailed(true);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer.current);
      clearTimeout(bufferTimer.current);
    };
  }, [movie]);

  // When source changes, set up stall detection
  useEffect(() => {
    clearTimeout(fallbackTimer.current);
    clearTimeout(bufferTimer.current);
    if (!sources.length || allFailed) return;

    // Initial buffer timeout — if iframe doesn't respond in 12s, move to next
    fallbackTimer.current = setTimeout(() => {
      setBuffering(false);
      stallCount.current++;
      if (stallCount.current >= 2) {
        tryServer(currentIdx + 1, sources);
      }
    }, 12000);

    return () => {
      clearTimeout(fallbackTimer.current);
      clearTimeout(bufferTimer.current);
    };
  }, [currentIdx, sources, allFailed, tryServer]);

  const handleFrameLoad = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    setBuffering(false);
    setBufferingCount(0);
    stallCount.current = 0;

    // Periodic check for iframe health
    bufferTimer.current = setInterval(() => {
      setBufferingCount((c) => {
        const next = c + 1;
        if (next >= 8) {
          // No activity for ~16s, assume stalled
          setBuffering(true);
        }
        return next;
      });
    }, 2000);
  }, []);

  const handleFrameError = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    clearTimeout(bufferTimer.current);
    setBuffering(false);
    tryServer(currentIdx + 1, sources);
  }, [currentIdx, sources, tryServer]);

  const handleRefresh = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    clearTimeout(bufferTimer.current);
    setBuffering(true);
    setBufferingCount(0);
    stallCount.current = 0;
    // Force iframe reload by re-mounting
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.src = iframe.src;
    }
  }, []);

  const manualSwitch = useCallback(
    (idx: number) => {
      clearTimeout(fallbackTimer.current);
      clearTimeout(bufferTimer.current);
      setAllFailed(false);
      tryServer(idx, sources);
    },
    [sources, tryServer]
  );

  const retryAll = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    clearTimeout(bufferTimer.current);
    setTried(new Set());
    setAllFailed(false);
    if (sources.length > 0) tryServer(0, sources);
  }, [sources, tryServer]);

  // Close on Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!movie) return null;

  const server = sources[currentIdx];

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 animate-[fadeIn_0.2s]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-card w-full max-w-[960px] max-h-[95vh] overflow-hidden flex flex-col animate-[slideUp_0.25s]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border gap-2">
          <h3 className="font-heading text-base font-bold overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Download/Save buttons */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu((v) => !v)}
                title="โหลดไว้ดูทีหลัง"
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-colors cursor-pointer ${isSaved ? "border-primary bg-primary/15 text-primary" : "border-border text-dim hover:text-text hover:border-text"}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              {showDownloadMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-56 bg-surface border border-border rounded-btn shadow-lg z-20 py-1">
                    <button
                      onClick={handleDownload}
                      className="w-full text-left px-3 py-2.5 text-sm text-text hover:bg-bg transition-colors cursor-pointer font-body flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6" />
                        <polyline points="6 9 12 15 18 9" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      เปิดหน้าดาวน์โหลด
                    </button>
                    <button
                      onClick={handleSave}
                      className="w-full text-left px-3 py-2.5 text-sm text-text hover:bg-bg transition-colors cursor-pointer font-body flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {isSaved ? (
                          <>
                            <path d="M3 3h18v18H3z" />
                            <path d="M8 12l3 3 5-5" />
                          </>
                        ) : (
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        )}
                      </svg>
                      {isSaved ? "ยกเลิกบันทึก" : "บันทึกไว้ดูภายหลัง"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Reload button */}
            {!loading && !allFailed && (
              <button
                onClick={handleRefresh}
                title="โหลดใหม่"
                className="w-8 h-8 rounded-full border border-border text-dim hover:text-text hover:border-text flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            )}

            {/* Open in new tab */}
            {!loading && !allFailed && server && (
              <button
                onClick={() => window.open(server.url, "_blank")}
                title="เปิดในหน้าต่างใหม่ (กรอวิดีโอ, Fullscreen)"
                className="w-8 h-8 rounded-full border border-border text-dim hover:text-text hover:border-text flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-border text-text flex items-center justify-center text-lg hover:bg-danger hover:border-danger transition-colors cursor-pointer"
              aria-label="ปิด"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-black">
          {loading ? (
            <div className="flex items-center justify-center h-full flex-col gap-3 text-dim">
              <div className="w-9 h-9 border-[3px] border-border border-t-primary rounded-full animate-spin" />
              <span className="text-sm font-body">กำลังโหลดแหล่งวิดีโอ...</span>
            </div>
          ) : allFailed ? (
            <div className="flex items-center justify-center h-full flex-col gap-2 text-dim px-4 text-center">
              <div className="text-4xl mb-2">😕</div>
              <p className="font-body">ไม่สามารถเล่นวิดีโอได้จากทุกแหล่ง</p>
              <p className="text-xs mt-1 font-body">
                หากดูหนังออนไลน์ไม่ได้ ลองรีเฟรชแล้วเปิดใหม่อีกครั้ง
              </p>
            </div>
          ) : server ? (
            <>
              <iframe
                ref={iframeRef}
                key={currentIdx}
                src={server.url}
                allowFullScreen
                allow="autoplay;encrypted-media;picture-in-picture"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full border-none"
                onLoad={handleFrameLoad}
                onError={handleFrameError}
              />
              {/* Buffering overlay */}
              {buffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none transition-opacity">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-[3px] border-white/20 border-t-yellow-400 rounded-full animate-spin" />
                    <span className="text-white/80 text-sm font-body">กำลังบัฟเฟอร์...</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-dim font-body">
              😕 ไม่พบลิงก์วิดีโอ
            </div>
          )}
        </div>

        {/* Action row */}
        <div className="px-4 py-2.5 border-t border-border flex items-center gap-2 flex-wrap">
          {/* Hint for seeking */}
          {!loading && !allFailed && server && (
            <span className="text-dim/50 text-[10px] italic w-full mb-0.5">
              💡 กด ↗ เพื่อเปิดในหน้าต่างใหม่ — รองรับการกรอวิดีโอและ Fullscreen
            </span>
          )}
          {allFailed ? (
            <>
              <button
                onClick={retryAll}
                className="px-3 py-1.5 bg-primary text-black rounded text-sm font-semibold cursor-pointer hover:bg-primary-dim transition-colors font-body"
              >
                ↻ ลองใหม่อีกครั้ง
              </button>
              <span className="text-dim text-xs font-body">หรือปิดแล้วเปิดใหม่</span>
            </>
          ) : (
            <>
              {/* Source selector */}
              {sources.map((s, i) => {
                let cls = "px-3 py-1.5 border border-border text-sm rounded-md transition-colors cursor-pointer font-body ";
                const isActive = i === currentIdx && !allFailed;
                const wasTried = tried.has(i);

                if (isActive) {
                  cls += "bg-primary text-black border-primary font-semibold";
                } else if (wasTried) {
                  cls += "bg-primary/15 border-primary text-text opacity-60";
                } else {
                  cls += "bg-raised text-text hover:bg-primary hover:text-black hover:border-primary";
                }

                return (
                  <button
                    key={i}
                    onClick={() => manualSwitch(i)}
                    className={cls}
                  >
                    {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse mr-1.5 align-middle" />}
                    {wasTried && !isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-danger mr-1.5 align-middle" />}
                    {s.label}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
});
