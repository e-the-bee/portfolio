// ── okolors.js ───────────────────────────────────────────────────────────
// A small JavaScript port of the approach used by Okolors
// (https://github.com/IanManske/Okolors): quantize an image by running
// k-means clustering in the Oklab colour space, then rank the resulting
// clusters. Oklab is perceptually uniform, so clustering there yields far
// nicer, more representative palettes than clustering in sRGB/HSL.
//
// Rust can't run in the browser, so rather than shelling out to the Okolors
// crate this reimplements its core method (Oklab + weighted k-means) in JS.
// Results are cached in localStorage keyed by image URL, so the (already
// cheap) k-means only ever runs once per avatar — no recompute lag on revisit.
//
// Colour-space conversions live in color.js; this file is the quantizer.

import { oklabToRgb, rgbHex, rgbToHsl, rgbToOklab } from './color.js'

const CACHE_PREFIX = 'okolors-v1:'

// ── weighted k-means in Oklab ──────────────────────────────────────────────
// points: Float array of [L,a,b] triples; weights: per-point pixel counts.
function kmeans(points, weights, k, iters) {
  const n = points.length
  if (n === 0) return []
  k = Math.min(k, n)

  // k-means++-ish seeding: first centroid random, rest favour distant points.
  const cen = []
  cen.push(points[Math.floor(Math.random() * n)].slice())
  while (cen.length < k) {
    let best = null, bestD = -1
    for (let i = 0; i < n; i++) {
      let dMin = Infinity
      for (const c of cen) {
        const dl = points[i][0] - c[0], da = points[i][1] - c[1], db = points[i][2] - c[2]
        const d = dl * dl + da * da + db * db
        if (d < dMin) dMin = d
      }
      const score = dMin * weights[i]
      if (score > bestD) { bestD = score; best = i }
    }
    cen.push(points[best].slice())
  }

  const assign = new Int32Array(n)
  for (let it = 0; it < iters; it++) {
    // assignment
    for (let i = 0; i < n; i++) {
      let bi = 0, bd = Infinity
      for (let c = 0; c < cen.length; c++) {
        const dl = points[i][0] - cen[c][0], da = points[i][1] - cen[c][1], db = points[i][2] - cen[c][2]
        const d = dl * dl + da * da + db * db
        if (d < bd) { bd = d; bi = c }
      }
      assign[i] = bi
    }
    // update
    const sumL = new Float64Array(k), sumA = new Float64Array(k), sumB = new Float64Array(k), sumW = new Float64Array(k)
    for (let i = 0; i < n; i++) {
      const c = assign[i], w = weights[i]
      sumL[c] += points[i][0] * w; sumA[c] += points[i][1] * w; sumB[c] += points[i][2] * w; sumW[c] += w
    }
    for (let c = 0; c < k; c++) {
      if (sumW[c] > 0) cen[c] = [sumL[c] / sumW[c], sumA[c] / sumW[c], sumB[c] / sumW[c]]
    }
  }

  // final cluster weights
  const clusterW = new Float64Array(k)
  for (let i = 0; i < n; i++) clusterW[assign[i]] += weights[i]

  return cen.map((c, i) => {
    const [r, g, b] = oklabToRgb(c[0], c[1], c[2])
    return { L: c[0], a: c[1], b: c[2], r, g, b, weight: clusterW[i], chroma: Math.hypot(c[1], c[2]) }
  }).filter((c) => c.weight > 0)
}

// Reduce raw pixels to unique-ish colours (bucketed) with counts, so k-means
// operates on a few hundred weighted points instead of thousands of pixels.
function collect(data) {
  const map = new Map()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 130) continue // skip transparent
    const r = data[i], g = data[i + 1], b = data[i + 2]
    // quantise to 5 bits/channel for the histogram key
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
    const e = map.get(key)
    if (e) { e.r += r; e.g += g; e.b += b; e.n++ }
    else map.set(key, { r, g, b, n: 1 })
  }
  const points = [], weights = []
  for (const e of map.values()) {
    const r = e.r / e.n, g = e.g / e.n, b = e.b / e.n
    points.push(rgbToOklab(r, g, b))
    weights.push(e.n)
  }
  return { points, weights }
}

// Analyse an ImageData buffer → { h, s, colors } where `colors` are the image's
// actual dominant vibrant colours (up to 3, most prominent first) so effects
// can reflect the real avatar palette, not just one rotated hue. Returns
// { mono: true } if the image is essentially greyscale.
function analyze(data) {
  const { points, weights } = collect(data)
  const clusters = kmeans(points, weights, 6, 12)
  if (!clusters.length) return { mono: true }

  const total = clusters.reduce((sum, c) => sum + c.weight, 0)
  // Rank clusters on vibrancy × presence, dropping near-greys and extremes.
  const vibrant = clusters
    .filter((c) => c.chroma >= 0.04 && c.L >= 0.18 && c.L <= 0.92)
    .map((c) => ({ c, score: c.chroma * Math.sqrt(c.weight / total) }))
    .sort((a, b) => b.score - a.score)
  if (!vibrant.length) return { mono: true }

  const primary = vibrant[0].c
  const [h, s] = rgbToHsl(primary.r, primary.g, primary.b)
  const colors = vibrant.slice(0, 3).map(({ c }) => rgbHex(c.r, c.g, c.b))
  return { h, s, colors }
}

function readCache(url) {
  try {
    const v = localStorage.getItem(CACHE_PREFIX + url)
    return v ? JSON.parse(v) : null
  } catch { return null }
}

function writeCache(url, val) {
  try { localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(val)) } catch { /* quota/private mode */ }
}

/**
 * Resolve a palette hint for an image URL.
 * @returns Promise<{h:number,s:number,colors:string[]} | {mono:true} | null>
 *   - {h,s,colors}  dominant vibrant hue/sat plus up to 3 dominant hex colours
 *   - {mono}        greyscale image — caller should use a neutral palette
 *   - null          image failed to load / CORS-tainted
 * Cached in localStorage, so repeat calls for the same URL are instant.
 */
export function getPaletteFromUrl(url) {
  return new Promise((resolve) => {
    const cached = readCache(url)
    if (cached) { resolve(cached); return }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 48
        const canvas = document.createElement('canvas')
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        const result = analyze(data)
        writeCache(url, result)
        resolve(result)
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}
