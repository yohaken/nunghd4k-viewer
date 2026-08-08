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

export interface MovieDetail {
  slug: string;
  movieId: string | null;
  hlsEmbedUrl: string | null;
  youtubeUrl: string | null;
  playerUrls: string[];
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

let _data: StaticData | null = null;

export function loadData(): StaticData {
  if (_data) return _data;
  const raw = fs.readFileSync(path.join(process.cwd(), "movies.json"), "utf8");
  _data = JSON.parse(raw);
  return _data!;
}

export function getMovies(): Movie[] {
  return loadData().movies;
}

export function getCategories(): Category[] {
  return loadData().categories;
}

export function getScrapedAt(): string {
  return loadData().scrapedAt;
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
