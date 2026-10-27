// Beat tracker: follows audio.currentTime against beat times precomputed by tools/analyze-beats.mjs
// (@audio/beat) and writes CSS variables on `root`:
//   --beat   1 on a kick, decaying to 0
//   --hit    1 on any strong onset (snare, guitar stab), decaying to 0
//   --bar    0..1 phase inside the current beat of the tracked grid
//   --b0..4  0..1 equaliser levels, a different decay per band, re-rolled on every beat
import timelines from '../beats.json'

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Index of the last entry <= t, or -1.
function lastAtOrBefore(arr, t) {
  let lo = 0
  let hi = arr.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] <= t) {
      ans = mid
      lo = mid + 1
    } else hi = mid - 1
  }
  return ans
}

// Cheap deterministic noise so the equaliser bars vary per beat but replay the same way.
const noise = (n, k) => {
  const x = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const DECAYS = [0.18, 0.26, 0.34, 0.22, 0.3] // seconds, per band

export function createBeat(audio, root) {
  let raf = 0

  const set = (k, v) => root.style.setProperty(k, v.toFixed(3))

  const clear = () => {
    set('--beat', 0)
    set('--hit', 0)
    set('--bar', 0)
    DECAYS.forEach((_, i) => set(`--b${i}`, 0.2))
  }

  const tick = () => {
    const tl = timelines[new URL(audio.currentSrc || audio.src, location.href).pathname]
    if (tl) {
      const t = audio.currentTime
      const ki = lastAtOrBefore(tl.kicks, t)
      const hi = lastAtOrBefore(tl.hits, t)
      const bi = lastAtOrBefore(tl.beats, t)
      const sinceKick = ki < 0 ? 9 : t - tl.kicks[ki]
      const sinceHit = hi < 0 ? 9 : t - tl.hits[hi]
      set('--beat', Math.exp(-sinceKick * 9))
      set('--hit', Math.exp(-sinceHit * 11))
      if (bi >= 0 && bi + 1 < tl.beats.length) set('--bar', (t - tl.beats[bi]) / (tl.beats[bi + 1] - tl.beats[bi]))
      DECAYS.forEach((d, i) => {
        // each kick or hit "plays" the band at a random height, then it falls back
        const ev = Math.max(ki < 0 ? -9 : tl.kicks[ki], i % 2 ? (hi < 0 ? -9 : tl.hits[hi]) : -9)
        const n = ev < 0 ? 0 : ev * 1000
        set(`--b${i}`, 0.15 + (0.35 + noise(n, i) * 0.5) * Math.exp(-(t - ev) / d))
      })
    }
    raf = requestAnimationFrame(tick)
  }

  return {
    start() {
      if (reduced() || raf) return
      root.classList.add('live')
      raf = requestAnimationFrame(tick)
    },
    stop() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      root.classList.remove('live')
      clear()
    },
  }
}
