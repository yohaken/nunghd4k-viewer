import { getFirestore } from "firebase-admin/firestore";
import "@/lib/firebase-admin";

const COL = "settings";
const DOC = "allowed-emails";

const DEFAULT: AllowedData = {
  admin: "yohaken@gmail.com",
  allowed: ["yohaken@gmail.com"],
};

interface AllowedData {
  admin: string;
  allowed: string[];
}

let _allowed: AllowedData | null = null;
let _loadedAt = 0;
const CACHE_TTL = 15_000; // 15s cache to avoid hitting Firestore on every request

async function loadFirestore(): Promise<AllowedData> {
  if (_allowed && Date.now() - _loadedAt < CACHE_TTL) return _allowed;

  const firestore = getFirestore();
  const snap = await firestore.collection(COL).doc(DOC).get();

  if (snap.exists) {
    _allowed = snap.data() as AllowedData;
    _loadedAt = Date.now();
    return _allowed;
  }

  // First time — seed with default
  await firestore.collection(COL).doc(DOC).set(DEFAULT);
  _allowed = { ...DEFAULT };
  _loadedAt = Date.now();
  return _allowed;
}

async function saveFirestore(data: AllowedData): Promise<void> {
  const firestore = getFirestore();
  await firestore.collection(COL).doc(DOC).set(data);
  _allowed = data;
  _loadedAt = Date.now();
}

export async function isAllowed(email: string): Promise<boolean> {
  const d = await loadFirestore();
  return d.allowed.includes(email.toLowerCase());
}

/** Synchronous version for Edge-compatible middleware usage.
 *  Falls back to in-memory cache only (no Firestore). */
export function isAllowedSync(email: string): boolean {
  if (!_allowed) { // If cache is empty (Edge/startup), just for auth flow
    _allowed = { ...DEFAULT };
  }
  return _allowed.allowed.includes(email.toLowerCase());
}

export async function isAdmin(email: string): Promise<boolean> {
  const d = await loadFirestore();
  return d.admin === email.toLowerCase();
}

export async function getAllowedEmails(): Promise<string[]> {
  const d = await loadFirestore();
  return [...d.allowed];
}

export async function getAdmin(): Promise<string> {
  const d = await loadFirestore();
  return d.admin;
}

export async function addEmail(email: string): Promise<boolean> {
  const d = await loadFirestore();
  const e = email.toLowerCase().trim();
  if (!e || d.allowed.includes(e)) return false;
  d.allowed.push(e);
  await saveFirestore(d);
  return true;
}

export async function removeEmail(email: string): Promise<boolean> {
  const d = await loadFirestore();
  const e = email.toLowerCase().trim();
  const idx = d.allowed.indexOf(e);
  if (idx === -1) return false;
  d.allowed.splice(idx, 1);
  await saveFirestore(d);
  return true;
}
