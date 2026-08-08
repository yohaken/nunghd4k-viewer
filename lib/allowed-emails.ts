interface AllowedData {
  admin: string;
  allowed: string[];
}

let _allowed: AllowedData | null = null;

const DEFAULT: AllowedData = {
  admin: "yohaken@gmail.com",
  allowed: ["yohaken@gmail.com"],
};

function getFsPath() {
  // In Next.js, process is available at runtime
  try {
    const path = require("path");
    return path.join(process.cwd(), "allowed-emails.json");
  } catch {
    return null;
  }
}

function readFile(): AllowedData | null {
  try {
    const filePath = getFsPath();
    if (!filePath) return null;
    const fs = require("fs");
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeFile(data: AllowedData): void {
  try {
    const filePath = getFsPath();
    if (!filePath) return;
    const fs = require("fs");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch { /* best effort */ }
}

function load(): AllowedData {
  if (_allowed) return _allowed;

  const fromFile = readFile();
  if (fromFile) {
    _allowed = fromFile;
    return _allowed;
  }

  _allowed = { ...DEFAULT };
  writeFile(_allowed);
  return _allowed;
}

export function isAllowed(email: string): boolean {
  const d = load();
  return d.allowed.includes(email.toLowerCase());
}

export function isAdmin(email: string): boolean {
  const d = load();
  return d.admin === email.toLowerCase();
}

export function getAllowedEmails(): string[] {
  const d = load();
  return [...d.allowed];
}

export function getAdmin(): string {
  const d = load();
  return d.admin;
}

export function addEmail(email: string): boolean {
  const d = load();
  const e = email.toLowerCase().trim();
  if (!e || d.allowed.includes(e)) return false;
  d.allowed.push(e);
  writeFile(d);
  return true;
}

export function removeEmail(email: string): boolean {
  const d = load();
  const e = email.toLowerCase().trim();
  const idx = d.allowed.indexOf(e);
  if (idx === -1) return false;
  d.allowed.splice(idx, 1);
  writeFile(d);
  return true;
}
