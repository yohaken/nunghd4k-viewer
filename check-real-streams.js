const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'movies.json'), 'utf8'));
const shuffled = [...data.movies].sort(() => Math.random() - 0.5).slice(0, 30);
const BASE = 'http://localhost:3000';

async function checkMovie(movie) {
  try {
    const res = await fetch(`${BASE}/api/movie/${encodeURIComponent(movie.slug)}`, {
      signal: AbortSignal.timeout(15000),
    });
    const d = await res.json();
    return {
      slug: movie.slug,
      title: movie.title.slice(0, 60),
      movieId: d.movieId || null,
      hasFast168: !!d.fast168Url,
      hasVidPhp: !!d.vidPhpUrl,
      hasYouTube: !!d.youtubeUrl,
      hasPlayerUrls: (d.playerUrls || []).length,
      idType: d.movieId ? (/^\d+$/.test(d.movieId) ? 'numeric' : 'alphanumeric') : 'none',
      error: d.error || null,
    };
  } catch (e) {
    return {
      slug: movie.slug,
      title: movie.title.slice(0, 60),
      movieId: null,
      error: e.message,
    };
  }
}

async function main() {
  console.log(`Checking ${shuffled.length} random movies...\n`);

  const results = [];
  for (let i = 0; i < shuffled.length; i++) {
    process.stdout.write(`\r  ${i + 1}/${shuffled.length} ${shuffled[i].title.slice(0, 50).padEnd(50)}`);
    const r = await checkMovie(shuffled[i]);
    results.push(r);
  }

  console.log('\n');

  const withId = results.filter(r => r.movieId);
  const noId = results.filter(r => !r.movieId);
  const numIds = withId.filter(r => r.idType === 'numeric');
  const alphaIds = withId.filter(r => r.idType === 'alphanumeric');
  const withFast168 = results.filter(r => r.hasFast168);
  const withYouTube = results.filter(r => r.hasYouTube);
  const errors = results.filter(r => r.error);

  console.log('=== RESULTS ===');
  console.log(`Total checked:     ${results.length}`);
  console.log(`Has movieId:       ${withId.length} (${Math.round(withId.length / results.length * 100)}%)`);
  console.log(`  Numeric IDs:     ${numIds.length}`);
  console.log(`  Alphanumeric IDs: ${alphaIds.length}`);
  console.log(`  Has fast168Url:  ${withFast168.length}`);
  console.log(`  Has vidPhpUrl:   ${results.filter(r => r.hasVidPhp).length}`);
  console.log(`  Has YouTube:     ${withYouTube.length}`);
  console.log(`No movieId (fail): ${noId.length}`);
  console.log(`Errors:            ${errors.length}`);

  if (noId.length > 0) {
    console.log('\n--- FAILED (no movieId) ---');
    noId.forEach(r => console.log(`  ${r.slug}: ${r.title}`));
  }

  if (errors.length > 0) {
    console.log('\n--- ERRORS ---');
    errors.forEach(r => console.log(`  ${r.slug}: ${r.error}`));
  }

  // Show sample IDs
  console.log('\n--- Sample numeric IDs ---');
  numIds.slice(0, 5).forEach(r => console.log(`  ${r.movieId} → ${r.title.slice(0, 50)}`));
  console.log('\n--- Sample alphanumeric IDs ---');
  alphaIds.slice(0, 10).forEach(r => console.log(`  ${r.movieId} → ${r.title.slice(0, 50)}`));
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
