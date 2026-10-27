// Dev-only server for the beat chart editor. Not part of the site build.
// Run: npm run chart   then open http://localhost:5199
// Serves tools/chart/index.html, the mp3s from public/audio (with Range support so seeking works),
// and reads/writes src/beats.json.
import { createServer } from 'node:http'
import { createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const AUDIO = fileURLToPath(new URL('../../public/audio/', import.meta.url))
const BEATS = fileURLToPath(new URL('../../src/beats.json', import.meta.url))
const PORT = Number(process.env.PORT) || 5199

const readBeats = () => (existsSync(BEATS) ? JSON.parse(readFileSync(BEATS, 'utf8')) : {})
const songs = () => readdirSync(AUDIO).filter((f) => f.endsWith('.mp3'))

// Keep only finite numbers, sorted by time, with strengths clamped to 0..1 and kept parallel.
function cleanLane(times, strengths) {
  const rows = (Array.isArray(times) ? times : [])
    .map((t, i) => [Number(t), Number(strengths?.[i] ?? 1)])
    .filter(([t]) => Number.isFinite(t) && t >= 0)
    .map(([t, s]) => [Math.round(t * 1000) / 1000, Math.round(Math.min(1, Math.max(0, Number.isFinite(s) ? s : 1)) * 100) / 100])
    .sort((a, b) => a[0] - b[0])
  return [rows.map((r) => r[0]), rows.map((r) => r[1])]
}

function body(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendAudio(req, res, file) {
  const size = statSync(file).size
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '')
  if (!m) {
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': size, 'Accept-Ranges': 'bytes' })
    createReadStream(file).pipe(res)
    return
  }
  const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]))
  const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1
  res.writeHead(206, {
    'Content-Type': 'audio/mpeg',
    'Content-Range': `bytes ${start}-${end}/${size}`,
    'Content-Length': end - start + 1,
    'Accept-Ranges': 'bytes',
  })
  createReadStream(file, { start, end }).pipe(res)
}

const json = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(readFileSync(join(HERE, 'index.html')))
    } else if (url.pathname === '/api/songs') {
      const beats = readBeats()
      json(res, 200, songs().map((name) => ({ name, chart: beats[`/audio/${name}`] || null })))
    } else if (url.pathname.startsWith('/audio/')) {
      const name = normalize(decodeURIComponent(url.pathname.slice(7)))
      if (!songs().includes(name)) return json(res, 404, { error: 'no such song' })
      sendAudio(req, res, join(AUDIO, name))
    } else if (url.pathname.startsWith('/api/chart/') && req.method === 'PUT') {
      const name = decodeURIComponent(url.pathname.slice(11))
      if (!songs().includes(name)) return json(res, 404, { error: 'no such song' })
      const c = JSON.parse(await body(req))
      const [kicks, kickS] = cleanLane(c.kicks, c.kickS)
      const [hits, hitS] = cleanLane(c.hits, c.hitS)
      const [beats] = cleanLane(c.beats, [])
      const all = readBeats()
      // `hand: true` makes tools/analyze-beats.mjs leave this song alone.
      all[`/audio/${name}`] = { hand: true, bpm: Math.round((Number(c.bpm) || 0) * 10) / 10, kicks, kickS, hits, hitS, beats }
      writeFileSync(BEATS, JSON.stringify(all))
      json(res, 200, { ok: true, kicks: kicks.length, hits: hits.length })
    } else {
      json(res, 404, { error: 'not found' })
    }
  } catch (e) {
    json(res, 500, { error: String(e.message || e) })
  }
}).listen(PORT, '127.0.0.1', () => console.log(`beat chart editor: http://localhost:${PORT}`))
