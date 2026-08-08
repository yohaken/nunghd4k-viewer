"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<string[]>([]);
  const [admin, setAdmin] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadEmails = useCallback(async () => {
    try {
      const res = await fetch("/api/settings-emails");
      if (res.status === 403) {
        router.replace("/");
        return;
      }
      const data = await res.json();
      setEmails(data.allowed || []);
      setAdmin(data.admin || "");
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้");
    }
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated") {
      loadEmails();
    }
  }, [status, loadEmails, router]);

  const handleAdd = useCallback(async () => {
    const e = newEmail.trim();
    if (!e) return;
    setError("");
    setSuccess("");
    setAdding(true);
    try {
      const res = await fetch("/api/settings-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
      } else {
        setEmails(data.allowed);
        setNewEmail("");
        setSuccess(`เพิ่ม ${e} แล้ว`);
      }
    } catch {
      setError("เกิดข้อผิดพลาด");
    }
    setAdding(false);
  }, [newEmail]);

  const handleRemove = useCallback(async (email: string) => {
    if (email === admin) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/settings-emails?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
      } else {
        setEmails(data.allowed);
        setSuccess(`ลบ ${email} แล้ว`);
      }
    } catch {
      setError("เกิดข้อผิดพลาด");
    }
  }, [admin]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-dim animate-pulse">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="mt-8 mb-6">
        <button
          onClick={() => router.push("/")}
          className="text-dim hover:text-text text-sm font-body transition-colors cursor-pointer"
        >
          ‹ กลับหน้าหลัก
        </button>
        <h1 className="text-2xl font-heading font-bold text-text mt-2">
          ตั้งค่า
        </h1>
        <p className="text-dim text-sm font-body mt-1">
          จัดการอีเมลที่อนุญาตให้เข้าใช้งาน
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-btn px-4 py-2.5 mb-4 font-body">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-primary/10 border border-primary/30 text-primary text-sm rounded-btn px-4 py-2.5 mb-4 font-body">
          {success}
        </div>
      )}

      {/* Add email form */}
      <div className="bg-surface border border-border rounded-card p-4 mb-4">
        <h2 className="text-sm font-heading font-semibold text-text mb-3">
          เพิ่มอีเมลใหม่
        </h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="example@gmail.com"
            className="flex-1 px-3 py-2 bg-bg border border-border rounded-btn text-text text-sm font-body placeholder:text-dim/50 focus:border-primary outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newEmail.trim()}
            className="px-5 py-2 bg-primary text-black text-sm font-semibold rounded-btn hover:bg-primary-dim disabled:opacity-35 transition-colors cursor-pointer font-body"
          >
            {adding ? "กำลังเพิ่ม..." : "เพิ่ม"}
          </button>
        </div>
      </div>

      {/* Email list */}
      <div className="bg-surface border border-border rounded-card p-4">
        <h2 className="text-sm font-heading font-semibold text-text mb-3">
          อีเมลที่อนุญาต ({emails.length})
        </h2>
        <ul className="divide-y divide-border">
          {emails.map((email) => (
            <li
              key={email}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-body text-text truncate">
                  {email}
                </span>
                {email === admin && (
                  <span className="shrink-0 px-1.5 py-0.5 bg-primary/15 text-primary text-[10px] font-semibold rounded-full font-body">
                    ADMIN
                  </span>
                )}
              </div>
              {email !== admin && (
                <button
                  onClick={() => handleRemove(email)}
                  className="ml-2 shrink-0 px-2.5 py-1 text-xs text-dim hover:text-danger border border-border hover:border-danger/30 rounded-btn transition-colors cursor-pointer font-body"
                >
                  ลบ
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
