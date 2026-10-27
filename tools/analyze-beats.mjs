// Precompute beat timelines for the songs in public/audio, written to src/beats.json.
// Run: node tools/analyze-beats.mjs   (needs ffmpeg on PATH)
// kicks = onsets of the low end (< 160 Hz), hits = onsets of the full mix, beats = tracked beat grid.
// kickS / hitS are 0..1 strengths parallel to kicks / hits. An onset only counts if its band is actually loud
// compared with the rest of the song, so a quiet intro does not trigger bass effects.
import { spawnSync } from 'node:child_process'
import { readdirSync, writeFileSync } from 'node:fs'
import { beatTrack, onsets } from '@audio/beat'

const FS = 22050
const FRAME = 1024
const HOP = 512
const MIN_STRENGTH = { kicks: 0.4, hits: 0.3 }
const DIR = new URL('../public/audio/', import.meta.url)

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
const out = {}

for (const name of readdirSync(DIR).filter((f) => f.endsWith('.mp3'))) {
  const file = new URL(name, DIR).pathname
  const full = decode(file)
  const low = decode(file, 'lowpass=f=160,lowpass=f=160')
  const opts = { fs: FS, hopSize: 512, delta: 2.2 }
  const lowEnv = envelope(low)
  const k = gate(onsets(low, opts), lowEnv, MIN_STRENGTH.kicks)
  // A hit with no bass under it (guitar intro, noise) counts for less than one that lands with the low end.
  const h = gate(onsets(full, opts), envelope(full), MIN_STRENGTH.hits, (t) => 0.35 + 0.65 * peakAt(lowEnv, t))
  const bt = beatTrack(full, { fs: FS })
  out[`/audio/${name}`] = {
    bpm: Math.round(bt.bpm * 10) / 10,
    kicks: round(k.keep),
    kickS: round(k.strength, 100),
    hits: round(h.keep),
    hitS: round(h.strength, 100),
    beats: round(bt.beats),
  }
  const intro = (a) => a.filter((t) => t < 8).length
  console.log(name, 'bpm', out[`/audio/${name}`].bpm, 'kicks', k.keep.length, `(${intro(k.keep)} in first 8s)`, 'hits', h.keep.length, `(${intro(h.keep)} in first 8s)`)
}

writeFileSync(new URL('../src/beats.json', import.meta.url), JSON.stringify(out))
