const MAX_ATTEMPTS = 10;
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface RateEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil: number | null;
}

const store = new Map<string, RateEntry>();

// Clean old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.blockedUntil && entry.blockedUntil < now) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; blockedUntil?: number } {
  const now = Date.now();
  let entry = store.get(ip);

  if (!entry) {
    entry = { attempts: 0, lastAttempt: now, blockedUntil: null };
    store.set(ip, entry);
  }

  // Check if still blocked
  if (entry.blockedUntil) {
    if (now < entry.blockedUntil) {
      return { allowed: false, remaining: 0, blockedUntil: entry.blockedUntil };
    }
    // Block expired, reset
    entry.attempts = 0;
    entry.lastAttempt = now;
    entry.blockedUntil = null;
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    return { allowed: false, remaining: 0, blockedUntil: entry.blockedUntil };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - entry.attempts };
}

export function recordFailedAttempt(ip: string): { remaining: number; blocked?: boolean; blockedUntil?: number } {
  const now = Date.now();
  let entry = store.get(ip);

  if (!entry) {
    entry = { attempts: 0, lastAttempt: now, blockedUntil: null };
    store.set(ip, entry);
  }

  entry.attempts++;
  entry.lastAttempt = now;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    return { remaining: 0, blocked: true, blockedUntil: entry.blockedUntil };
  }

  return { remaining: MAX_ATTEMPTS - entry.attempts };
}

export function resetAttempts(ip: string): void {
  store.delete(ip);
}
