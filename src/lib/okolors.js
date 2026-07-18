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

const CACHE_PREFIX = 'okolors-v1:'

// ── sRGB ⇄ Oklab (Björn Ottosson's matrices) ──────────────────────────────
function srgbToLinear(c) {
  c /= 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function linearToSrgb(c) {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.max(0, Math.min(255, Math.round(v * 255)))
}

function rgbToOklab(r, g, b) {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b)
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ]
}

function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_
  return [
    linearToSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ]
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return [h, s, l]
}

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

// Analyse an ImageData buffer → { h, s } for the dominant vibrant colour, or
// { mono: true } if the image is essentially greyscale.
function analyze(data) {
  const { points, weights } = collect(data)
  const clusters = kmeans(points, weights, 6, 12)
  if (!clusters.length) return { mono: true }

  const total = clusters.reduce((sum, c) => sum + c.weight, 0)
  // Score clusters on vibrancy × presence, ignoring near-greys and extremes.
  let best = null, bestScore = -1
  for (const c of clusters) {
    const share = c.weight / total
    if (c.chroma < 0.04 || c.L < 0.18 || c.L > 0.92) continue
    const score = c.chroma * Math.sqrt(share)
    if (score > bestScore) { bestScore = score; best = c }
  }
  if (!best) return { mono: true }

  const [h, s] = rgbToHsl(best.r, best.g, best.b)
  return { h, s }
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
 * @returns Promise<{h:number,s:number} | {mono:true} | null>
 *   - {h,s}   dominant vibrant hue (0-360) and saturation (0-1)
 *   - {mono}  greyscale image — caller should use a neutral palette
 *   - null    image failed to load / CORS-tainted
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
