// Precompute beat timelines for the songs in public/audio, written to src/beats.json.
// Run: node tools/analyze-beats.mjs   (needs ffmpeg on PATH)
// kicks = onsets of the low end (< 160 Hz), hits = onsets of the full mix, beats = tracked beat grid.
import { spawnSync } from 'node:child_process'
import { readdirSync, writeFileSync } from 'node:fs'
import { beatTrack, onsets } from '@audio/beat'

const FS = 22050
const DIR = new URL('../public/audio/', import.meta.url)

function decode(file, filter) {
  const args = ['-v', 'error', '-i', file, ...(filter ? ['-af', filter] : []), '-ac', '1', '-ar', String(FS), '-f', 'f32le', '-']
  const r = spawnSync('ffmpeg', args, { maxBuffer: 1 << 30 })
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${file}: ${r.stderr}`)
  const b = r.stdout
  return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.byteLength / 4))
}

const round = (a) => Array.from(a, (t) => Math.round(t * 1000) / 1000)
const out = {}

for (const name of readdirSync(DIR).filter((f) => f.endsWith('.mp3'))) {
  const file = new URL(name, DIR).pathname
  const full = decode(file)
  const low = decode(file, 'lowpass=f=160,lowpass=f=160')
  const opts = { fs: FS, hopSize: 512, delta: 2.2 }
  const kicks = onsets(low, opts)
  const hits = onsets(full, opts)
  const bt = beatTrack(full, { fs: FS })
  out[`/audio/${name}`] = { bpm: Math.round(bt.bpm * 10) / 10, kicks: round(kicks), hits: round(hits), beats: round(bt.beats) }
  console.log(name, 'bpm', out[`/audio/${name}`].bpm, 'kicks', kicks.length, 'hits', hits.length, 'beats', bt.beats.length, 'secs', (full.length / FS).toFixed(0))
}

writeFileSync(new URL('../src/beats.json', import.meta.url), JSON.stringify(out))
