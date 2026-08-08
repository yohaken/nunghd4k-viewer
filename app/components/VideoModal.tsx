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

export const VideoModal = memo(function VideoModal({ movie, onClose }: VideoModalProps) {
  const [sources, setSources] = useState<PlayerSource[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tried, setTried] = useState(new Set<number>());
  const [allFailed, setAllFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const title = movie?.title || "";

  const fallbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const successTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const tryServer = useCallback(
    (idx: number, s: PlayerSource[]) => {
      if (idx >= s.length) {
        setAllFailed(true);
        return;
      }
      setCurrentIdx(idx);
      setTried((prev) => new Set([...prev, idx]));
      setAllFailed(false);
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

        // 1. fast168 HLS embed — real full movie stream
        add("ตัวเล่นหลัก (HLS)", data.fast168Url, "hls");
        // 2. vid.php player — full movie with JWPlayer
        add("ตัวเล่นเว็บ", data.vidPhpUrl, "alt");
        // 3. changePlayer backup URLs
        (data.playerUrls || []).forEach((u: string, i: number) => {
          add(`ตัวเล่นสำรอง ${i + 1}`, u, "alt");
        });
        // 4. Any additional iframes from the page (not already included)
        (data.allIframes || []).forEach((u: string, i: number) => {
          // Skip youtube (handled separately) and duplicates
          if (u.includes("youtube.com") || u.includes("youtu.be")) return;
          add(`แหล่งอื่น ${i + 1}`, u, "alt");
        });
        // 5. YouTube — trailer, lowest priority
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
      clearTimeout(successTimer.current);
    };
  }, [movie]);

  // Set up fallback timer when source changes
  useEffect(() => {
    clearTimeout(fallbackTimer.current);
    clearTimeout(successTimer.current);
    if (!sources.length || allFailed) return;

    const server = sources[currentIdx];
    const timeout = server?.type === "yt" ? 6000 : 8000;

    fallbackTimer.current = setTimeout(() => {
      tryServer(currentIdx + 1, sources);
    }, timeout);

    return () => {
      clearTimeout(fallbackTimer.current);
      clearTimeout(successTimer.current);
    };
  }, [currentIdx, sources, allFailed, tryServer]);

  const handleFrameLoad = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    successTimer.current = setTimeout(() => {}, 1500);
  }, []);

  const handleFrameError = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    tryServer(currentIdx + 1, sources);
  }, [currentIdx, sources, tryServer]);

  const manualSwitch = useCallback(
    (idx: number) => {
      clearTimeout(fallbackTimer.current);
      clearTimeout(successTimer.current);
      setAllFailed(false);
      tryServer(idx, sources);
    },
    [sources, tryServer]
  );

  const retryAll = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    clearTimeout(successTimer.current);
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
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border gap-3">
          <h3 className="font-heading text-base font-bold overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border text-text flex items-center justify-center text-lg hover:bg-danger hover:border-danger transition-colors flex-shrink-0 cursor-pointer"
            aria-label="ปิด"
          >
            &times;
          </button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-black">
          {loading ? (
            <div className="flex items-center justify-center h-full flex-col gap-3 text-dim">
              <div className="w-9 h-9 border-[3px] border-border border-t-primary rounded-full animate-spin" />
              <span className="text-sm">กำลังโหลดแหล่งวิดีโอ...</span>
            </div>
          ) : allFailed ? (
            <div className="flex items-center justify-center h-full flex-col gap-2 text-dim px-4 text-center">
              <div className="text-4xl mb-2">😕</div>
              <p>ไม่สามารถเล่นวิดีโอได้จากทุกแหล่ง</p>
              <p className="text-xs mt-1">
                หากดูหนังออนไลน์ไม่ได้ ลองรีเฟรชแล้วเปิดใหม่อีกครั้ง
              </p>
            </div>
          ) : server ? (
            <iframe
              key={currentIdx}
              src={server.url}
              allowFullScreen
              allow="autoplay;encrypted-media;picture-in-picture"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full border-none"
              onLoad={handleFrameLoad}
              onError={handleFrameError}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-dim">
              😕 ไม่พบลิงก์วิดีโอ
            </div>
          )}
        </div>

        {/* Fail hint */}
        {allFailed && (
          <div className="text-center py-2 px-4 border-t border-border flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={retryAll}
              className="px-3 py-1.5 bg-primary text-black rounded text-sm font-semibold cursor-pointer hover:bg-primary-dim transition-colors"
            >
              ↻ ลองใหม่อีกครั้ง
            </button>
            <span className="text-dim text-xs">หรือปิดแล้วเปิดใหม่</span>
          </div>
        )}

        {/* Server buttons */}
        {sources.length > 1 && (
          <div className="px-4 py-2.5 border-t border-border flex gap-2 flex-wrap">
            {sources.map((s, i) => {
              let cls = "px-3 py-1.5 border border-border text-sm rounded-md transition-colors cursor-pointer ";
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
          </div>
        )}
      </div>
    </div>
  );
});
