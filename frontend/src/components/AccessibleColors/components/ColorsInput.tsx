import React, { FC, useEffect, useState, useMemo } from 'react'
import styles from '../accessiblecolors.module.css'
import { Select, SelectOption } from '../../Select/Select'
import { useAppDispatch } from '../../../hooks/useAppDispatch'
import { notify } from '../../../reducers/notificationReducer'
import { useLanguageContext } from '../../../contexts/LanguageContext'
import { getErrorMessage } from '../../../utils'
import { ColorBlock } from '../AccessibleColors'

interface Props {
  block: ColorBlock
  updateColor: (
    id: number,
    color: string,
    format: 'hsl' | 'hex' | 'rgb'
  ) => void
  width: string
  fontSize: string
  hslToRGB: (
    h: number,
    s: number,
    l: number
  ) => { r: number; g: number; b: number }
  rgbToHSL: (
    r: number,
    g: number,
    b: number
  ) => { h: number; s: number; l: number }
  hexToRGB: (hex: string) => { r: number; g: number; b: number }
  rgbToHex: (r: number, g: number, b: number) => string
}

const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i
const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i
const hexRegex = /^#([0-9A-F]{3}){1,2}$/i

const ColorsInput: FC<Props> = ({
  block,
  fontSize,
  updateColor,
  width,
  hexToRGB,
  hslToRGB,
  rgbToHex,
  rgbToHSL,
}) => {
  const { t, language } = useLanguageContext()

  const dispatch = useAppDispatch()

  const colorFormatOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'hsl', label: 'HSL' },
      { value: 'rgb', label: 'RGB' },
      { value: 'hex', label: 'Hex' },
    ]
  }, [])

  const [selected, setSelected] = useState<SelectOption | undefined>(
    colorFormatOptions.find((option) => option.value === block.colorFormat) ??
      colorFormatOptions[0]
  )

  // Sync dropdown selection with block.colorFormat
  useEffect(() => {
    const newSelected = colorFormatOptions.find(
      (option) => option.value === block.colorFormat
    )
    if (newSelected && newSelected.value !== selected?.value) {
      setSelected(newSelected)
    }
  }, [block.colorFormat, colorFormatOptions, selected])

  const [hex, setHex] = useState<string>('')
  const [r, setR] = useState<number>(0)
  const [g, setG] = useState<number>(0)
  const [b, setB] = useState<number>(0)
  const [h, setH] = useState<number>(0)
  const [s, setS] = useState<number>(0)
  const [l, setL] = useState<number>(0)

  useEffect(() => {
    switch (block.colorFormat) {
      case 'hex': {
        setHex(block.color)
        const { r, g, b } = hexToRGB(block.color)
        setR(r)
        setG(g)
        setB(b)
        const { h, s, l } = rgbToHSL(r, g, b)
        setH(h)
        setS(s)
        setL(l)
        break
      }
      case 'rgb': {
        const rgbMatch = rgbRegex.exec(block.color)
        if (rgbMatch) {
          const rVal = Number(rgbMatch[1])
          const gVal = Number(rgbMatch[2])
          const bVal = Number(rgbMatch[3])
          setR(rVal)
          setG(gVal)
          setB(bVal)
          const { h, s, l } = rgbToHSL(rVal, gVal, bVal)
          setH(h)
          setS(s)
          setL(l)
        }
        break
      }
      case 'hsl': {
        const hslMatch = hslRegex.exec(block.color)
        if (hslMatch) {
          const hVal = Number(hslMatch[1])
          const sVal = Number(hslMatch[2])
          const lVal = Number(hslMatch[3])
          setH(hVal)
          setS(sVal)
          setL(lVal)
          const { r, g, b } = hslToRGB(hVal, sVal, lVal)
          setR(r)
          setG(g)
          setB(b)
          const hexVal = rgbToHex(r, g, b)
          setHex(hexVal)
        }
        break
      }
      default:
        break
    }
  }, [block.color, block.colorFormat, hexToRGB, rgbToHSL, hslToRGB, rgbToHex])

  const change = (format: 'hex' | 'rgb' | 'hsl') => {
    try {
      let formattedColor: string

      if (format === 'hex') {
        if (hexRegex.test(hex)) {
          formattedColor = hex.toUpperCase()
          const { r, g, b } = hexToRGB(formattedColor)
          setR(r)
          setG(g)
          setB(b)
          const { h, s, l } = rgbToHSL(r, g, b)
          setH(h)
          setS(s)
          setL(l)
          updateColor(block.id, formattedColor, 'hex')
        } else {
          throw new Error('Invalid Hex format.')
        }
      } else if (format === 'rgb') {
        if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
          formattedColor = `rgb(${r}, ${g}, ${b})`
          const hexVal = rgbToHex(r, g, b)
          setHex(hexVal)
          const { h, s, l } = rgbToHSL(r, g, b)
          setH(h)
          setS(s)
          setL(l)
          updateColor(block.id, formattedColor, 'rgb')
        } else {
          throw new Error('Invalid RGB values.')
        }
      } else if (format === 'hsl') {
        if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
          formattedColor = `hsl(${h}, ${s}%, ${l}%)`
          const { r, g, b } = hslToRGB(h, s, l)
          setR(r)
          setG(g)
          setB(b)
          const hexVal = rgbToHex(r, g, b)
          setHex(hexVal)
          updateColor(block.id, formattedColor, 'hsl')
        } else {
          throw new Error('Invalid HSL values.')
        }
      } else {
        throw new Error('Unsupported color format.')
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, t('Error'))
      console.error(message)
      void dispatch(notify(message, true, 4))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    change(selected?.value as 'hex' | 'rgb' | 'hsl')
  }

  const handleHSLChange = (component: 'h' | 's' | 'l', value: number) => {
    if (component === 'h') setH(value)
    if (component === 's') setS(value)
    if (component === 'l') setL(value)

    const newH = component === 'h' ? value : h
    const newS = component === 's' ? value : s
    const newL = component === 'l' ? value : l

    if (
      newH >= 0 &&
      newH <= 360 &&
      newS >= 0 &&
      newS <= 100 &&
      newL >= 0 &&
      newL <= 100
    ) {
      const { r, g, b } = hslToRGB(newH, newS, newL)
      setR(r)
      setG(g)
      setB(b)
      updateColor(block.id, `hsl(${newH}, ${newS}%, ${newL}%)`, 'hsl')
      setHex(rgbToHex(r, g, b))
    }
  }

  const handleRGBChange = (type: 'r' | 'g' | 'b', value: number) => {
    if (type === 'r') setR(value)
    if (type === 'g') setG(value)
    if (type === 'b') setB(value)

    const newR = type === 'r' ? value : r
    const newG = type === 'g' ? value : g
    const newB = type === 'b' ? value : b

    if ([newR, newG, newB].every((v) => v >= 0 && v <= 255)) {
      const { h, s, l } = rgbToHSL(newR, newG, newB)
      setH(h)
      setS(s)
      setL(l)
      updateColor(block.id, `rgb(${newR}, ${newG}, ${newB})`, 'rgb')
      setHex(rgbToHex(newR, newG, newB))
    }
  }

  return (
    <>
      <Select
        hideDelete
        id="color-select"
        className={styles['inner-mode-select']}
        language={language}
        instructions={t('SelectColorFormat')}
        hide
        gray
        options={colorFormatOptions}
        value={selected}
        z={1}
        onChange={(o) => {
          setSelected(o)
          if (o?.value === 'hex') {
            const currentHex = rgbToHex(r, g, b)
            setHex(currentHex)
            updateColor(block.id, currentHex, 'hex')
          } else if (o?.value === 'rgb') {
            setR(r)
            setG(g)
            setB(b)
            updateColor(block.id, `rgb(${r}, ${g}, ${b})`, 'rgb')
          } else if (o?.value === 'hsl') {
            setH(h)
            setS(s)
            setL(l)
            updateColor(block.id, `hsl(${h}, ${s}%, ${l}%)`, 'hsl')
          }
        }}
      />

      {selected?.value === 'hex' && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={`${styles.inputs} ${styles['hex-input']}`}>
            <label style={{ fontSize: `calc(${fontSize} * 1.2)` }}>
              <span>Hex: </span>
              <input
                name={`hex-input-${block.id}`}
                type="text"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className={styles['color-input']}
                style={{
                  maxWidth: `${width}`,
                  fontSize: `calc(${fontSize} * 1.1)`,
                  lineHeight: 1.4,
                }}
                placeholder="#FFFFFF"
              />
            </label>
          </div>

          <button
            style={{
              minWidth: `calc(100% - 4px)`,
              maxWidth: `calc(100% - 4px)`,
              fontSize: `calc(${fontSize} * 1.1)`,
              lineHeight: 1.4,
            }}
            type="submit"
            className={`${styles['color-format-submit']} gray`}
          >
            {t('Submit')}
          </button>
        </form>
      )}

      {selected?.value === 'rgb' && (
        <form
          className={`${styles.inputs} ${styles['rgb-inputs']}`}
          onSubmit={handleSubmit}
        >
          <label style={{ fontSize: `calc(${fontSize} * 1.2)` }}>
            <span>R: </span>
            <input
              name={`r-input-${block.id}`}
              type="number"
              value={r}
              onChange={(e) => handleRGBChange('r', Number(e.target.value))}
              min={0}
              max={255}
              className={styles['color-input']}
              style={{
                maxWidth: `${width}`,
                fontSize: `calc(${fontSize} * 1.1)`,
                lineHeight: 1.4,
              }}
            />
          </label>

          <label style={{ fontSize: `calc(${fontSize} * 1.2)` }}>
            <span>G: </span>
            <input
              name={`g-input-${block.id}`}
              type="number"
              value={g}
              onChange={(e) => handleRGBChange('g', Number(e.target.value))}
              min={0}
              max={255}
              className={styles['color-input']}
              style={{
                maxWidth: `${width}`,
                fontSize: `calc(${fontSize} * 1.1)`,
                lineHeight: 1.4,
              }}
            />
          </label>

          <label style={{ fontSize: `calc(${fontSize} * 1.2)` }}>
            <span>B: </span>
            <input
              name={`b-input-${block.id}`}
              type="number"
              value={b}
              onChange={(e) => handleRGBChange('b', Number(e.target.value))}
              min={0}
              max={255}
              className={styles['color-input']}
              style={{
                maxWidth: `${width}`,
                fontSize: `calc(${fontSize} * 1.1)`,
                lineHeight: 1.4,
              }}
            />
          </label>
        </form>
      )}

      {selected?.value === 'hsl' && (
        <form
          className={`${styles.inputs} ${styles['hsl-inputs']}`}
          onSubmit={handleSubmit}
        >
          <label style={{ fontSize: `calc(${fontSize} * 1.2)` }}>
            <span>H: </span>
            <input
              name={`h-input-${block.id}`}
              type="number"
              value={h}
              onChange={(e) => handleHSLChange('h', Number(e.target.value))}
              min={0}
              max={360}
              className={styles['color-input']}
              style={{
                maxWidth: `${width}`,
                fontSize: `calc(${fontSize} * 1.1)`,
                lineHeight: 1.4,
              }}
            />
          </label>
          <label style={{ fontSize: `calc(${fontSize} * 1.2)` }}>
            <span>S: </span>
            <input
              name={`s-input-${block.id}`}
              type="number"
              value={s}
              onChange={(e) => handleHSLChange('s', Number(e.target.value))}
              min={0}
              max={100}
              className={styles['color-input']}
              style={{
                maxWidth: `${width}`,
                fontSize: `calc(${fontSize} * 1.1)`,
                lineHeight: 1.4,
              }}
            />
          </label>

          <label style={{ fontSize: `calc(${fontSize} * 1.2)` }}>
            <span>L: </span>
            <input
              name={`l-input-${block.id}`}
              type="number"
              value={l}
              onChange={(e) => handleHSLChange('l', Number(e.target.value))}
              min={0}
              max={100}
              className={styles['color-input']}
              style={{
                maxWidth: `${width}`,
                fontSize: `calc(${fontSize} * 1.1)`,
                lineHeight: 1.4,
              }}
            />
          </label>
        </form>
      )}
    </>
  )
}

export default ColorsInput
