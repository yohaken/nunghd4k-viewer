"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  const from = searchParams.get("from") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        router.replace(from);
        router.refresh();
      } else {
        setError(data.error || "เกิดข้อผิดพลาด");
        if (data.remaining !== undefined) setRemaining(data.remaining);
        if (data.blocked) setRemaining(0);
        setPassword("");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-extrabold text-primary mb-2">
            NUNGHD4K
          </h1>
          <p className="text-dim text-sm font-body">
            ดูหนังออนไลน์ HD 4K พากย์ไทย ซับไทย
          </p>
        </div>

        <div className="bg-surface border border-border rounded-card p-6">
          <h2 className="text-lg font-heading font-semibold text-text mb-1 text-center">
            ใส่รหัสผ่าน
          </h2>
          <p className="text-dim text-xs text-center mb-5">
            กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน
          </p>

          <form onSubmit={handleSubmit}>
            <div className="relative mb-3">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="••••••••••"
                required
                autoFocus
                autoComplete="off"
                disabled={remaining === 0}
                className="w-full px-4 py-3 bg-bg border border-border rounded-btn text-text text-sm font-mono placeholder:text-dim/40 focus:outline-none focus:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password.trim() || remaining === 0}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-btn transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              {loading ? "กำลังตรวจสอบ..." : "เข้าใช้งาน"}
            </button>

            {error && (
              <p className={`text-xs text-center mt-3 font-body ${remaining === 0 ? "text-red-400" : "text-red-500"}`}>
                {error}
              </p>
            )}

            {remaining !== null && remaining > 0 && !error && (
              <p className="text-dim/60 text-[11px] text-center mt-2 font-body">
                เหลืออีก {remaining} ครั้ง
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
