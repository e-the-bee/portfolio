// Precompute beat timelines for the songs in public/audio, written to src/beats.json.
// Run: npm run analyze   (needs ffmpeg on PATH and tools/beat-grid.json from tools/beat_grid.py).
// Use `npm run chart` afterwards to correct the result by hand.
//
// The beat and downbeat grid comes from the Beat This! neural tracker (tools/beat_grid.py). On its own the
// onset detector is noisy, so the grid is used to decide which onsets matter:
//   kicks = a bass onset near each beat (the beat itself when the low end is loud there but no onset is found)
//   hits  = a full-mix onset near a beat or half-beat that is not already a kick
// kickS / hitS are 0..1 strengths parallel to kicks / hits; downbeats get the biggest kicks. An onset only
// counts if its band is loud compared with the rest of the song, so a quiet intro does not trigger effects.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { onsets } from '@audio/beat'

const FS = 22050
const FRAME = 1024
const HOP = 512
const MIN_STRENGTH = { kicks: 0.4, hits: 0.3 }
const DIR = new URL('../public/audio/', import.meta.url)
const GRID = new URL('./beat-grid.json', import.meta.url)
const SNAP = 0.07 // seconds an onset may sit away from the beat it is attached to

function decode(file, filter) {
  const args = ['-v', 'error', '-i', file, ...(filter ? ['-af', filter] : []), '-ac', '1', '-ar', String(FS), '-f', 'f32le', '-']
  const r = spawnSync('ffmpeg', args, { maxBuffer: 1 << 30 })
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${file}: ${r.stderr}`)
  const b = r.stdout
  return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.byteLength / 4))
}

// RMS per frame, plus the level that counts as "loud" for this signal (95th percentile).
function envelope(samples) {
  const n = Math.max(0, Math.floor((samples.length - FRAME) / HOP))
  const rms = new Float32Array(n)
  for (let f = 0; f < n; f++) {
    let s = 0
    for (let i = 0; i < FRAME; i++) {
      const v = samples[f * HOP + i]
      s += v * v
    }
    rms[f] = Math.sqrt(s / FRAME)
  }
  const sorted = Float32Array.from(rms).sort()
  return { rms, ref: sorted[Math.floor(sorted.length * 0.95)] || 1e-6 }
}

// Keep onsets whose band peaks (within 100 ms after the onset) at a decent fraction of the song's loud level.
function peakAt(env, t) {
  const f0 = Math.floor((t * FS) / HOP)
  const f1 = Math.min(env.rms.length - 1, f0 + Math.ceil((0.1 * FS) / HOP))
  let peak = 0
  for (let f = f0; f <= f1; f++) peak = Math.max(peak, env.rms[f] || 0)
  return Math.min(1, peak / env.ref)
}

// `weight(t)` (optional, 0..1) scales an onset down further; used to soften full-mix hits while the bass is absent.
function gate(times, env, min, weight = () => 1) {
  const keep = []
  const strength = []
  for (const t of times) {
    const s = peakAt(env, t) * weight(t)
    if (s >= min) {
      keep.push(t)
      strength.push(s)
    }
  }
  return { keep, strength }
}

const round = (a, k = 1000) => Array.from(a, (t) => Math.round(t * k) / k)

// Nearest value in a sorted array and its distance.
function nearest(arr, t) {
  let lo = 0
  let hi = arr.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] < t) lo = mid + 1
    else hi = mid
  }
  const cand = [lo - 1, lo].filter((i) => i >= 0 && i < arr.length)
  return cand.reduce((best, i) => (best < 0 || Math.abs(arr[i] - t) < Math.abs(arr[best] - t) ? i : best), -1)
}

// The tracker sometimes doubles up beats where the groove changes; drop any beat that follows the previous one too soon.
function tidy(beats) {
  const ibi = beats.slice(1).map((b, i) => b - beats[i]).sort((a, b) => a - b)
  const min = (ibi[Math.floor(ibi.length / 2)] || 0.5) * 0.6
  const keep = []
  for (const b of beats) if (!keep.length || b - keep[keep.length - 1] >= min) keep.push(b)
  return keep
}

if (!existsSync(GRID)) {
  console.error('tools/beat-grid.json is missing. Run tools/beat_grid.py first (setup is in its header).')
  process.exit(1)
}
const grid = JSON.parse(readFileSync(GRID, 'utf8'))

const OUT = new URL('../src/beats.json', import.meta.url)
// Songs charted by hand in tools/chart (marked `hand: true`) are kept as they are.
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {}
const out = {}

for (const name of readdirSync(DIR).filter((f) => f.endsWith('.mp3'))) {
  const key = `/audio/${name}`
  if (prev[key]?.hand) {
    out[key] = prev[key]
    console.log(name, 'hand-charted, skipped')
    continue
  }
  if (!grid[key]) {
    console.log(name, 'not in beat-grid.json, skipped (rerun tools/beat_grid.py)')
    continue
  }
  const beats = tidy(grid[key].beats)
  const downs = new Set(grid[key].downbeats.map((t) => beats[nearest(beats, t)]))

  const file = new URL(name, DIR).pathname
  const full = decode(file)
  const low = decode(file, 'lowpass=f=160,lowpass=f=160')
  const opts = { fs: FS, hopSize: 512, delta: 2.2 }
  const lowEnv = envelope(low)
  const lowOn = gate(onsets(low, opts), lowEnv, 0)
  const fullOn = gate(onsets(full, opts), envelope(full), 0)

  // kicks: one per beat, placed on the bass onset next to it when there is one, and only where the low end is loud
  const kicks = []
  const kickS = []
  for (const b of beats) {
    const loud = peakAt(lowEnv, b)
    if (loud < MIN_STRENGTH.kicks) continue
    const i = lowOn.keep.length ? nearest(lowOn.keep, b) : -1
    const t = i >= 0 && Math.abs(lowOn.keep[i] - b) <= SNAP ? lowOn.keep[i] : b
    kicks.push(t)
    kickS.push(Math.min(1, loud * (downs.has(b) ? 1 : 0.8)))
  }

  // hits: full-mix onsets that sit on a beat or half-beat and are not a kick; bass-less ones count for less
  const subs = []
  beats.forEach((b, i) => {
    subs.push(b)
    if (i + 1 < beats.length) subs.push((b + beats[i + 1]) / 2)
  })
  const hits = []
  const hitS = []
  fullOn.keep.forEach((t, i) => {
    const s = fullOn.strength[i] * (0.35 + 0.65 * peakAt(lowEnv, t))
    if (s < MIN_STRENGTH.hits) return
    const j = nearest(subs, t)
    if (j < 0 || Math.abs(subs[j] - t) > SNAP) return
    const k = kicks.length ? nearest(kicks, t) : -1
    if (k >= 0 && Math.abs(kicks[k] - t) < 0.08) return
    hits.push(t)
    hitS.push(s)
  })

  const ibi = beats.slice(1).map((b, i) => b - beats[i]).sort((a, b) => a - b)
  out[key] = {
    bpm: Math.round((60 / (ibi[Math.floor(ibi.length / 2)] || 0.5)) * 10) / 10,
    kicks: round(kicks),
    kickS: round(kickS, 100),
    hits: round(hits),
    hitS: round(hitS, 100),
    beats: round(beats),
  }
  const intro = (a) => a.filter((t) => t < 8).length
  console.log(name, 'bpm', out[key].bpm, 'kicks', kicks.length, `(${intro(kicks)} in first 8s)`, 'hits', hits.length, `(${intro(hits)} in first 8s)`, 'beats', beats.length)
}

writeFileSync(OUT, JSON.stringify(out))
