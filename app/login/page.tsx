"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await signIn("email", { email: email.trim(), callbackUrl: "/" });
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
            เข้าสู่ระบบ
          </h2>
          <p className="text-dim text-xs text-center mb-5">
            กรอกอีเมลเพื่อรับลิงก์เข้าสู่ระบบ
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@gmail.com"
              required
              className="w-full px-4 py-3 bg-bg border border-border rounded-btn text-text text-sm font-body placeholder:text-dim/50 focus:outline-none focus:border-primary transition-colors mb-3"
            />

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-btn transition-colors cursor-pointer disabled:opacity-50"
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
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
              )}
              {loading ? "กำลังส่ง..." : "ส่งลิงก์เข้าสู่ระบบ"}
            </button>
          </form>
        </div>

        <p className="text-dim text-[11px] text-center mt-6 font-body">
          เฉพาะอีเมลที่ได้รับอนุญาตเท่านั้น
        </p>
      </div>
    </main>
  );
}
