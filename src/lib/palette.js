// Banner/accent colours built from the palette extracted from an image.
import { hexToRgb01, hslToHex, rgbToHsl } from './color.js'

// Neutral hue used when the image is greyscale.
const MONO_HUE = 225

const hueOf = (hex) => {
  const [r, g, b] = hexToRgb01(hex)
  return rgbToHsl(r * 255, g * 255, b * 255)[0]
}

// Keep a colour's hue but push its saturation and lightness into a range that stays readable.
const vivify = (hex, S, L) => hslToHex(hueOf(hex), S, L)

// [primary, secondary, tertiary, dark] from the image's dominant colours. A missing colour is replaced
// by a lighter or darker shade of the primary hue rather than a rotated one, so no hue appears that
// the image does not contain.
export function bannerColors(res, s) {
  const S = Math.round(Math.min(0.92, Math.max(0.5, s)) * 100)
  const cols = (res.colors || []).filter(Boolean)
  const c1 = cols[0] ? vivify(cols[0], S, 62) : hslToHex(res.h, S, 62)
  const c2 = cols[1] ? vivify(cols[1], S, 56) : hslToHex(res.h + 10, S, 48)
  const c3 = cols[2] ? vivify(cols[2], S, 50) : hslToHex(res.h - 12, S, 70)
  return [c1, c2, c3, hslToHex(res.h, S, 15)]
}

// Banner colours for a greyscale image.
export const MONO_BANNER_COLORS = [
  hslToHex(MONO_HUE, 12, 78),
  hslToHex(MONO_HUE, 10, 56),
  hslToHex(MONO_HUE, 10, 40),
  hslToHex(MONO_HUE, 10, 13),
]
