/**
 * Generates a 10-stop OKLCH color scale (50–950) from a single hex input.
 * Uses the input color's hue and chroma; lightness follows a fixed perceptual ramp.
 * No external dependencies.
 */

function hexToOklch(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  // sRGB → linear RGB
  const rl = r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gl = g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bl = b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

  // linear RGB → OKLab (Björn Ottosson, 2020)
  const lms_l = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl)
  const lms_m = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl)
  const lms_s = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl)

  const L = 0.2104542553 * lms_l + 0.7936177850 * lms_m - 0.0040720468 * lms_s
  const a = 1.9779984951 * lms_l - 2.4285922050 * lms_m + 0.4505937099 * lms_s
  const bv = 0.0259040371 * lms_l + 0.7827717662 * lms_m - 0.8086757660 * lms_s

  // OKLab → OKLCH
  const C = Math.sqrt(a * a + bv * bv)
  const H = ((Math.atan2(bv, a) * 180) / Math.PI + 360) % 360
  return [L, C, H]
}

// Perceptual lightness ramp matching Tailwind's palette distribution
const LIGHTNESS: Record<number, number> = {
  50: 0.975, 100: 0.945, 200: 0.885,
  300: 0.805, 400: 0.705, 500: 0.595,
  600: 0.495, 700: 0.395, 800: 0.295,
  900: 0.215, 950: 0.145,
}

// Chroma is maximised at 500, tapered at both ends (very light & very dark are less saturated)
const CHROMA_FACTOR: Record<number, number> = {
  50: 0.04, 100: 0.10, 200: 0.25,
  300: 0.50, 400: 0.78, 500: 1.00,
  600: 0.95, 700: 0.85, 800: 0.70,
  900: 0.55, 950: 0.38,
}

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

/**
 * Returns a map of shade → CSS `oklch(...)` string for use as CSS custom properties.
 * e.g. { 500: 'oklch(59.50% 0.2090 252.00)' }
 */
export function generateColorScale(hex: string): Record<number, string> {
  const normalised = hex.startsWith('#') ? hex : `#${hex}`
  const [, C, H] = hexToOklch(normalised)
  const result: Record<number, string> = {}

  for (const shade of SHADES) {
    const l = LIGHTNESS[shade]!
    const c = Math.max(0, C * CHROMA_FACTOR[shade]!)
    result[shade] = `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${H.toFixed(2)})`
  }

  return result
}
