import {
  hexToRGB,
  randomHSLColor,
  rgbToHSL,
  getRandomBetween,
  randomUpTo100,
  clampValue,
} from "../../../utils"
import { ColorBlock, HSLColor, TColorMode } from "../AccessibleColors"

export const generateColors = (
  mode: TColorMode,
  baseHSL: HSLColor
): number[][] => {
  const randomOneOrTwo = baseHSL.l < 50 ? 1 : 2
  const adjustment = Math.round(getRandomBetween(15, 20))
  const adjustmentBigger = Math.round(getRandomBetween(20, 30))
  const adjustmentBiggest = Math.round(getRandomBetween(30, 40))
  const colorset: number[][] = []
  switch (mode) {
    case "analogous":
      for (let i = 1; i <= 4; i++) {
        let adjustedL =
          randomOneOrTwo === 1
            ? (baseHSL.l + adjustment * i) % 90
            : (baseHSL.l - adjustment * i + 90) % 90
        adjustedL = clampValue(0, adjustedL, 90)
        const analogousHSL: [number, number, number] = [
          (baseHSL.h + 30 * i) % 360,
          randomUpTo100(),
          adjustedL,
        ]
        colorset.push(analogousHSL)
      }
      break
    case "complementary":
      for (let i = 1; i <= 4; i++) {
        let adjustedL =
          randomOneOrTwo === 1
            ? (baseHSL.l + adjustment * i) % 90
            : (baseHSL.l - adjustment * i + 90) % 90
        adjustedL = clampValue(0, adjustedL, 90)
        const variationHSL: [number, number, number] = [
          i % 2 === 0 ? baseHSL.h : (baseHSL.h + 180) % 360,
          randomUpTo100(),
          adjustedL,
        ]
        colorset.push(variationHSL)
      }
      break
    case "triad":
      for (let i = 1; i <= 2; i++) {
        let adjustedL =
          randomOneOrTwo === 1
            ? (baseHSL.l + adjustmentBiggest * i) % 90
            : (baseHSL.l - adjustmentBiggest * i + 90) % 90
        adjustedL = clampValue(0, adjustedL, 90)
        const triadHSL: [number, number, number] = [
          (baseHSL.h + 120 * i) % 360,
          randomUpTo100(),
          adjustedL,
        ]
        colorset.push(triadHSL)
      }
      break
    case "monochromatic":
      for (let i = 1; i <= 4; i++) {
        let adjustedL =
          randomOneOrTwo === 1
            ? (baseHSL.l + adjustment * i) % 90
            : (baseHSL.l - adjustment * i + 90) % 90
        adjustedL = clampValue(0, adjustedL, 90)
        const adjustedHSL: [number, number, number] = [
          baseHSL.h,
          randomUpTo100(),
          adjustedL,
        ]
        colorset.push(adjustedHSL)
      }
      break
    case "tetrad":
      for (let i = 1; i <= 3; i++) {
        let adjustedL =
          randomOneOrTwo === 1
            ? (baseHSL.l + adjustmentBigger * i) % 90
            : (baseHSL.l - adjustmentBigger * i + 90) % 90
        adjustedL = clampValue(0, adjustedL, 90)
        const tetradHSL: [number, number, number] = [
          (baseHSL.h + 90 * i) % 360,
          randomUpTo100(),
          adjustedL,
        ]
        colorset.push(tetradHSL)
      }
      break
    default:
      // Fallback to analogous
      for (let i = 1; i <= 4; i++) {
        let adjustedL =
          randomOneOrTwo === 1
            ? (baseHSL.l + adjustment * i) % 90
            : (baseHSL.l - adjustment * i + 90) % 90
        adjustedL = clampValue(0, adjustedL, 90)
        const defaultHSL: [number, number, number] = [
          (baseHSL.h + 30 * i) % 360,
          randomUpTo100(),
          adjustedL,
        ]
        colorset.push(defaultHSL)
      }
      break
  }
  return colorset
}

export const buildColors = (
  existingColors: ColorBlock[],
  colorMode: string | undefined,
  colorsReset: boolean
): number[][] => {
  const newColors: number[][] = []

  if (existingColors.length === 0 || colorsReset) {
    const baseColor = randomHSLColor("array")
    if (Array.isArray(baseColor)) {
      newColors.push(baseColor)
    }

    // Generate additional colors based on the selected colorMode
    const generated = generateColors(colorMode as TColorMode, {
      h: baseColor[0] as number,
      s: baseColor[1] as number,
      l: baseColor[2] as number,
    })
    newColors.push(...generated)

    return newColors
  } else {
    // Generate two new colors based on the last existing color
    const baseColor = existingColors[existingColors.length - 1]
    let baseHSL: HSLColor

    try {
      if (baseColor.colorFormat === "hex") {
        const rgb = hexToRGB(baseColor.color)
        baseHSL = rgbToHSL(rgb.r, rgb.g, rgb.b)
      } else if (baseColor.colorFormat === "rgb") {
        const rgbMatch =
          /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(
            baseColor.color
          )
        if (rgbMatch) {
          const r = Number(rgbMatch[1])
          const g = Number(rgbMatch[2])
          const b = Number(rgbMatch[3])
          baseHSL = rgbToHSL(r, g, b)
        } else {
          throw new Error("Invalid RGB format")
        }
      } else if (baseColor.colorFormat === "hsl") {
        const hslMatch =
          /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i.exec(
            baseColor.color
          )
        if (hslMatch) {
          const h = Number(hslMatch[1])
          const s = Number(hslMatch[2])
          const l = Number(hslMatch[3])
          baseHSL = { h, s, l }
        } else {
          throw new Error("Invalid HSL format")
        }
      } else {
        throw new Error("Unsupported color format")
      }

      const generated = generateColors(colorMode as TColorMode, baseHSL)
      if (colorMode === "tetrad") newColors.push(...generated.slice(0, 3))
      else newColors.push(...generated.slice(0, 3))
    } catch (error) {
      console.error("Error generating new colors:", error)
      // Fallback to generating three random colors
      for (let i = 0; i < 3; i++) {
        const randomColor = randomHSLColor("array")
        if (Array.isArray(randomColor)) {
          newColors.push(randomColor)
        }
      }
    }
  }
  if (!colorsReset && existingColors.length > 0) {
    return newColors
  }
  return newColors
}
