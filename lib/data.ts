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

let _movies: Movie[] | null = null;
let _categories: Category[] | null = null;
let _scrapedAt: string | null = null;

function init() {
  if (_movies) return;
  const raw = fs.readFileSync(path.join(process.cwd(), "movies.json"), "utf8");
  const data: StaticData = JSON.parse(raw);
  _movies = data.movies;
  _categories = data.categories;
  _scrapedAt = data.scrapedAt;
  console.log(`[data] Loaded ${_movies.length} movies, ${_categories.length} categories`);
}

export function getMovies(): Movie[] {
  init();
  return _movies!;
}

export function getCategories(): Category[] {
  init();
  return _categories!;
}

export function getScrapedAt(): string {
  init();
  return _scrapedAt!;
}

/** Prepend new movies to the live cache (newest first) */
export function addMovies(newMovies: Movie[]): void {
  init();
  const existingSlugs = new Set(_movies!.map((m) => m.slug));
  const unique = newMovies.filter((m) => !existingSlugs.has(m.slug));
  if (unique.length > 0) {
    _movies!.unshift(...unique);
    console.log(`[data] Merged ${unique.length} new movies, total now: ${_movies!.length}`);
  }
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
