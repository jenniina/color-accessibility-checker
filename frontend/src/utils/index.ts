export function getRandomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export function clampValue(min: number, val: number, max: number) {
  return Math.min(Math.max(val, min), max)
}

export const randomUpTo100 = () => {
  const value = Math.ceil(getRandomBetween(30, 100))
  return clampValue(30, value, 100)
}

export const randomUpTo90 = () => {
  const value = Math.ceil(getRandomBetween(5, 90))
  return clampValue(5, value, 90)
}

export const randomHSLColor = (type = 'array') => {
  const randomOneOrTwo = Math.random() < 0.5 ? 1 : 2
  if (type === 'hsl') {
    const h = Math.floor(Math.random() * 360)
    const s = randomUpTo100()
    const l = randomUpTo90()
    return `hsl(${h}, ${s}%, ${l}%)`
  }
  const h = Math.floor(Math.random() * 360)
  const s = randomUpTo100()
  const l = randomOneOrTwo === 1 ? 5 : 85
  return [h, s, l]
}

export const rgbToHex = (r: number, g: number, b: number) => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`
}

export const rgbToHSL = (r: number, g: number, b: number) => {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
      default:
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(Math.min(s * 100, 100)),
    l: Math.round(l * 100),
  }
}

export const hslToRGB = (h: number, s: number, l: number) => {
  h /= 360
  s /= 100
  l /= 100

  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(Math.min(r * 255, 255)),
    g: Math.round(Math.min(g * 255, 255)),
    b: Math.round(Math.min(b * 255, 255)),
  }
}

export const hexToRGB = (value: string) => {
  if (value.startsWith('rgb(')) {
    const m = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(value)
    if (!m) throw new Error(`Unsupported rgb format: ${value}`)
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) }
  }

  if (!value.startsWith('#'))
    throw new Error(`Unsupported color format: ${value}`)

  let hex = value.slice(1)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((ch) => ch + ch)
      .join('')
  }
  if (hex.length !== 6) throw new Error(`Unsupported hex length: ${value}`)

  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return { r, g, b }
}

export const calculateLuminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

export const getContrastRatio = (lum1: number, lum2: number) => {
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

export const determineAccessibility = (
  color1: { color: string; colorFormat: 'hex' | 'rgb' | 'hsl' },
  color2: { color: string; colorFormat: 'hex' | 'rgb' | 'hsl' }
) => {
  const parseC = (color: {
    color: string
    colorFormat: 'hex' | 'rgb' | 'hsl'
  }) => {
    let r: number, g: number, b: number

    if (color.colorFormat === 'hex') {
      ;({ r, g, b } = hexToRGB(color.color))
    } else if (color.colorFormat === 'rgb') {
      const rgbMatch =
        /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(
          color.color
        )
      if (!rgbMatch) throw new Error('Invalid RGB format')
      r = Number(rgbMatch[1])
      g = Number(rgbMatch[2])
      b = Number(rgbMatch[3])
    } else {
      const hslMatch =
        /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i.exec(
          color.color
        )
      if (!hslMatch) throw new Error('Invalid HSL format')
      const h = Number(hslMatch[1])
      const s = Number(hslMatch[2])
      const l = Number(hslMatch[3])
      ;({ r, g, b } = hslToRGB(h, s, l))
    }

    return { r, g, b }
  }

  const rgb1 = parseC(color1)
  const rgb2 = parseC(color2)
  const lum1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b)
  const contrastRatio = getContrastRatio(lum1, lum2)

  return {
    isAAARegularTextCompliant: contrastRatio >= 7,
    isAARegularTextCompliant: contrastRatio >= 4.5,
    isAAUIComponentsCompliant: contrastRatio >= 3,
  }
}

export const getRandomString = (length: number) => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export const sanitize = (name: string = getRandomString(9)): string => {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '-')
}

export function getErrorMessage(err: unknown, fallback: string): string {
  try {
    if (err instanceof Error) return err.message
    if (typeof err === 'string') return err
    return fallback
  } catch {
    return fallback
  }
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export const firstToLowerCase = (str: string) => {
  if (!str) return str
  return str.charAt(0).toLowerCase() + str.slice(1)
}
