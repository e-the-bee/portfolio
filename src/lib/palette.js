// ── palette.js ───────────────────────────────────────────────────────────
// Turns an extracted avatar palette (or its absence) into concrete colours:
// CSS custom-property sets for the page theme, and the [primary, secondary,
// tertiary, dark] quad handed to the banner effect. Pure functions — the
// caller applies the returned vars to an element.

import { hslStr, hslToHex } from './color.js'

// Neutral hue used when the avatar is greyscale.
const MONO_HUE = 225

// CSS vars for a vibrant avatar hue/saturation.
export function paletteVars(h, s) {
  const sp = (s * 100).toFixed(0)
  return {
    '--accent': hslStr(h, +sp, 62),
    '--accent2': hslStr((h + 28) % 360, +sp, 56),
    '--bg': hslStr(h, 22, 4.5),
    '--card': hslStr(h, 18, 8),
    '--card2': hslStr(h, 16, 12.5),
    '--card3': hslStr(h, 15, 17),
    '--border': `hsla(${h.toFixed(0)},25%,82%,0.09)`,
  }
}

// CSS vars for a greyscale avatar — barely-there cool tint.
export function monoVars() {
  const H = MONO_HUE
  return {
    '--accent': hslStr(H, 8, 84),
    '--accent2': hslStr(H, 10, 60),
    '--bg': hslStr(H, 8, 4.5),
    '--card': hslStr(H, 7, 8),
    '--card2': hslStr(H, 7, 12.5),
    '--card3': hslStr(H, 7, 17),
    '--border': `hsla(${H},12%,85%,0.09)`,
  }
}

// Map a theme config object ({ accent: '#...' , ... }) to CSS custom props.
export function themeVars(theme) {
  return Object.fromEntries(Object.entries(theme).map(([key, value]) => ['--' + key, value]))
}

// Build [primary, secondary, tertiary, dark] for the banner. Prefer the
// avatar's *actual* dominant colours from Okolors so multi-colour effects look
// like the pfp; fall back to hue-derived shades when only one colour is found.
export function bannerColors(res, s) {
  const S = Math.round(Math.min(0.92, Math.max(0.5, s)) * 100)
  const cols = (res.colors || []).filter(Boolean)
  const c1 = cols[0] || hslToHex(res.h, S, 62)
  const c2 = cols[1] || hslToHex(res.h + 28, S, 56)
  const c3 = cols[2] || hslToHex(res.h + 335, S, 50)
  return [c1, c2, c3, hslToHex(res.h, S, 15)]
}

// Banner colours for a greyscale avatar.
export const MONO_BANNER_COLORS = [
  hslToHex(MONO_HUE, 12, 78),
  hslToHex(MONO_HUE, 10, 56),
  hslToHex(MONO_HUE, 10, 40),
  hslToHex(MONO_HUE, 10, 13),
]
