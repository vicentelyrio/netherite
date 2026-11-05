/** `#rrggbb` to its red, green and blue, 0 to 255. */
export const hexToRgb = (hex: string): readonly [number, number, number] => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (m === null) throw new Error(`Not a #rrggbb colour: ${hex}`)
  const n = Number.parseInt(m[1] as string, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Relative luminance (WCAG 2.x). */
const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two `#rrggbb` colours, 1 to 21. Text needs 4.5, UI shapes 3. */
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}
