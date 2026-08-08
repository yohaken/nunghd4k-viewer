const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'movies.json'), 'utf8'));
const shuffled = [...data.movies].sort(() => Math.random() - 0.5).slice(0, 50);

async function fetchHTML(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, timeout: 15000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', timeout: 10000, headers: { 'User-Agent': UA, 'Referer': 'https://www.nunghd4k.com/' } });
    return res.ok ? 'OK' : `HTTP ${res.status}`;
  } catch (e) { return 'FAIL'; }
}

async function checkHLS(movieId) {
  const embed = `https://play.gan-play.com/embed/fast168.php?key=nunghd4k&id=${movieId}&ep=&type=`;
  try {
    const html = await fetchHTML(embed);
    const m3u8 = [...new Set(html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g) || [])].slice(0, 2);
    if (!m3u8.length) return 'no m3u8';
    const results = [];
    for (const u of m3u8) {
      const r = await checkUrl(u);
      results.push(r);
    }
    return results.includes('OK') ? 'OK' : results.join(',');
  } catch (e) { return `embed fail: ${e.message}`; }
}

async function checkMovie(m) {
  const html = await fetchHTML(m.url); const $ = cheerio.load(html);
  let id = null; let yt = null; const alt = [];
  const ps = $('#player-iframe').attr('src') || '';
  const im = ps.match(/id=(\d+)/); if (im) id = im[1];
  if (!id) { $('button[onclick*="changePlayer"]').each((i, el) => { const oc = $(el).attr('onclick') || ''; const mi = oc.match(/id=(\d+)/); if (mi && !id) id = mi[1]; const u = oc.match(/changePlayer\('([^']+)'/); if (u && u[1]) alt.push(u[1]); }); }
  $('iframe').each((i, el) => { const s = $(el).attr('src') || ''; if ((s.includes('youtube.com/embed/') || s.includes('youtu.be/')) && !yt) yt = s; });
  return { title: m.title, slug: m.slug, id, yt, alt };
}

async function main() {
  console.log(`Checking ${shuffled.length} random movies...\n`);
  let total = 0, hlsOk = 0, hlsFail = 0, ytOk = 0, ytFail = 0, noSources = 0;
  const failures = [];

  for (const m of shuffled) {
    total++;
    process.stdout.write(`\r  ${total}/${shuffled.length} ${m.title.slice(0,50).padEnd(50)}`);
    try {
      const info = await checkMovie(m);
      if (info.id) {
        const s = await checkHLS(info.id);
        if (s === 'OK') hlsOk++; else { hlsFail++; failures.push({ title: info.title, type: 'HLS', status: s }); }
      }
      if (info.yt) {
        const s = await checkUrl(info.yt);
        if (s === 'OK') ytOk++; else { ytFail++; failures.push({ title: info.title, type: 'YT', status: s }); }
      }
      if (!info.id && !info.yt) noSources++;
    } catch(e) {}
  }

  console.log(`\n\n=== RESULTS (${total} movies) ===`);
  console.log(`  HLS: ${hlsOk} OK / ${hlsFail} fail`);
  console.log(`  YouTube: ${ytOk} OK / ${ytFail} fail`);
  console.log(`  No sources: ${noSources}`);
  if (failures.length) {
    console.log(`\n--- Failures ---`);
    failures.slice(0,15).forEach(f => console.log(`  ${f.title.slice(0,55)} | ${f.type}: ${f.status}`));
  }
  fs.writeFileSync('check-results.json', JSON.stringify({ hlsOk, hlsFail, ytOk, ytFail, noSources, failures }));
}
main().catch(e => { console.error(e); process.exit(1); });
