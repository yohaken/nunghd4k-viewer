"use client";

import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

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
            ใช้บัญชี Google เพื่อเข้าใช้งาน
          </p>

          <form
            method="POST"
            action="/api/auth/signin/google"
            onSubmit={() => setLoading(true)}
          >
            <input type="hidden" name="callbackUrl" value="/" />
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-btn transition-colors cursor-pointer border border-gray-300 disabled:opacity-50"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.805 10.23c0-.68-.055-1.36-.173-2.03H10.2v3.87h5.41a4.62 4.62 0 01-2.01 3.04v2.51h3.24c1.89-1.74 2.97-4.31 2.97-7.35z"
                  fill="#4285F4"
                />
                <path
                  d="M10.2 20c2.7 0 4.96-.89 6.62-2.42l-3.24-2.51c-.9.6-2.05.95-3.38.95-2.6 0-4.8-1.75-5.58-4.1H1.27v2.6A9.97 9.97 0 0010.2 20z"
                  fill="#34A853"
                />
                <path
                  d="M4.62 11.92a5.97 5.97 0 010-3.84V5.48H1.27a9.98 9.98 0 000 8.93l3.35-2.49z"
                  fill="#FBBC05"
                />
                <path
                  d="M10.2 4c1.47 0 2.78.5 3.82 1.48l2.84-2.84C15.15 1.09 12.9 0 10.2 0A9.97 9.97 0 001.27 5.48l3.35 2.6c.78-2.35 2.98-4.08 5.58-4.08z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? "กำลังเปลี่ยนหน้า..." : "เข้าสู่ระบบด้วย Google"}
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
