import fs from "fs";
import path from "path";

export interface Movie {
  slug: string;
  title: string;
  image: string;
  rating: string | null;
  quality: string | null;
  language: string | null;
  url: string;
}

export interface Category {
  name: string;
  url: string;
}

interface StaticData {
  movies: Movie[];
  categories: Category[];
  scrapedAt: string;
  totalMovies: number;
  totalCategories: number;
  totalPages: number;
}

const BASE_PATH = path.join(process.cwd(), "movies.json");
const DELTA_PATH = path.join(process.cwd(), "movies-delta.json");

let _baseMovies: Movie[] = [];
let _deltaMovies: Movie[] = [];
let _categories: Category[] = [];
let _scrapedAt = "";

function loadBase(): void {
  if (!fs.existsSync(BASE_PATH)) return;
  const raw = fs.readFileSync(BASE_PATH, "utf8");
  const data: StaticData = JSON.parse(raw);
  _baseMovies = data.movies;
  _categories = data.categories;
  _scrapedAt = data.scrapedAt;
}

function loadDelta(): void {
  if (!fs.existsSync(DELTA_PATH)) return;
  try {
    const raw = fs.readFileSync(DELTA_PATH, "utf8");
    _deltaMovies = JSON.parse(raw);
  } catch {
    _deltaMovies = [];
  }
}

function saveDelta(): void {
  fs.writeFileSync(DELTA_PATH, JSON.stringify(_deltaMovies));
}

let _initialized = false;

function init(): void {
  if (_initialized) return;
  _initialized = true;
  loadBase();
  loadDelta();
  console.log(
    `[data] Loaded ${_baseMovies.length} base + ${_deltaMovies.length} delta = ${_baseMovies.length + _deltaMovies.length} movies`
  );
}

export function getMovies(): Movie[] {
  init();
  // Delta first (newest), then base
  return [..._deltaMovies, ..._baseMovies];
}

export function getBaseCount(): number {
  init();
  return _baseMovies.length;
}

export function getDeltaCount(): number {
  init();
  return _deltaMovies.length;
}

export function getCategories(): Category[] {
  init();
  return _categories;
}

export function getScrapedAt(): string {
  init();
  return _scrapedAt;
}

export function getAllSlugs(): Set<string> {
  init();
  const slugs = new Set<string>();
  _baseMovies.forEach((m) => slugs.add(m.slug));
  _deltaMovies.forEach((m) => slugs.add(m.slug));
  return slugs;
}

/** Merge new movies into delta (prepend) and persist to disk immediately */
export function addMovies(newMovies: Movie[]): number {
  init();
  const existing = getAllSlugs();
  const unique = newMovies.filter((m) => !existing.has(m.slug));
  if (unique.length === 0) return 0;

  _deltaMovies.unshift(...unique);
  saveDelta();
  console.log(
    `[data] Persisted ${unique.length} new movies → delta (base: ${_baseMovies.length}, delta: ${_deltaMovies.length})`
  );
  return unique.length;
}

export function findMovieBySlug(slug: string): Movie | undefined {
  const movies = getMovies();
  let movie = movies.find((m) => m.slug === slug);
  if (!movie) {
    const lower = encodeURIComponent(slug).toLowerCase();
    movie = movies.find((m) => m.slug.toLowerCase() === lower);
  }
  return movie;
}

export function filterMovies(options: {
  search?: string;
  page?: number;
  limit?: number;
}): { movies: Movie[]; total: number } {
  let movies = [...getMovies()];
  const { search, page = 1, limit = 48 } = options;

  if (search) {
    const q = search.toLowerCase().trim();
    if (q) {
      movies = movies.filter((m) => {
        const t = (m.title || "").toLowerCase();
        const s = (m.slug || "").toLowerCase().replace(/-/g, " ");
        return t.includes(q) || s.includes(q);
      });
    }
  }

  const total = movies.length;
  const start = (page - 1) * limit;
  return { movies: movies.slice(start, start + limit), total };
}
