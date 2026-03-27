import React, {
  useState,
  useEffect,
  FC,
  useRef,
  useMemo,
  useCallback,
} from 'react'
import styles from './accessiblecolors.module.css'
import { notify } from '../../reducers/notificationReducer'
import useLocalStorage from '../../hooks/useStorage'
import { useDragAndDrop } from './hooks/useColorDragAndDrop'
import { useTheme } from '../../hooks/useTheme'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import Icon from '../Icon/Icon'
import {
  hexToRGB,
  hslToRGB,
  rgbToHex,
  rgbToHSL,
  calculateLuminance,
} from '../../utils'
import { Select, SelectOption } from '../Select/Select'
import useAccessibleColors from './hooks/useAccessibleColors'
import { useSearchParams } from 'react-router-dom'
import { useConfirm } from '../../contexts/ConfirmContext'
import { useLanguageContext } from '../../contexts/LanguageContext'
import ColorsInput from './components/ColorsInput'
import NamedPalettes from './components/NamedPalettes'
import useSideScroll from '../../hooks/useSideScroll'
import SEO from '../SEO/SEO'
import Heading from '../Heading/Heading'
import { ReducerProps } from '../../types'
import { useSelector } from 'react-redux'
import FormMulti from '../FormMulti/FormMulti'

export interface ComplianceResult {
  isAARegularTextCompliant: boolean
  isAAARegularTextCompliant: boolean
  isAAUIComponentsCompliant: boolean
}

export interface ColorBlock {
  id: number
  color: string
  luminance: number
  status: string
  colorFormat: 'hex' | 'rgb' | 'hsl'
  compliantColors: {
    AA_RegularText: number[]
    AAA_RegularText: number[]
    AA_UIComponents: number[]
  }
}

export type TColorMode =
  | 'analogous'
  | 'complementary'
  | 'triad'
  | 'tetrad'
  | 'monochromatic'

export interface HSLColor {
  h: number
  s: number
  l: number
}

export enum ComplianceLevel {
  AA_RegularText = 'AA_RegularText',
  AAA_RegularText = 'AAA_RegularText',
  AA_UIComponents = 'AA_UIComponents',
}

////
//
//
//
//
//
////

interface DragData {
  type: 'item'
  id: string
}

const status = 'colors'
const AccessibleColors: FC = () => {
  const {
    colors,
    setColors,
    replaceColors,
    addColor,
    duplicateColorAfter,
    removeColor,
    updateColor,
    currentColor,
    setCurrentColor,
    resetColors,
    clearColors,
    mode,
    setMode,
    makeColorPalette,
    setColorsReset,
    updateSearchParams,
  } = useAccessibleColors('analogous')

  const user = useSelector((state: ReducerProps) => {
    return state.auth?.user
  })

  const addBtnTextColor = useMemo(() => {
    try {
      const { r, g, b } = hexToRGB(currentColor)
      const lum = calculateLuminance(r, g, b)
      return lum < 0.179 ? 'white' : 'black'
    } catch {
      return 'black'
    }
  }, [currentColor])

  const { t } = useLanguageContext()
  const confirm = useConfirm()

  const statuses = useMemo(() => [status], [])

  const containerRef = useRef<HTMLDivElement | null>(null)

  const colorPicker = useRef<HTMLDivElement | null>(null)
  const exportButtonsRef = useRef<HTMLDivElement | null>(null)
  const { ref: scrollRef } = useSideScroll<HTMLDivElement>(
    'accessible-colors-scroll'
  )

  const dispatch = useAppDispatch()
  const lightTheme = useTheme()

  const copyToClipboard = useCallback(
    async (text: string) => {
      if (typeof window === 'undefined') return

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
          void dispatch(notify(t('CopiedToClipboard'), false, 5))
          return
        }

        // Fallback for older browsers / insecure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        textArea.style.top = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const ok = document.execCommand('copy')
        document.body.removeChild(textArea)

        if (ok) {
          void dispatch(notify(t('CopiedToClipboard'), false, 5))
        } else {
          void dispatch(notify(`${t('FailedToCopy')}`, true, 5))
        }
      } catch (error) {
        console.error('Failed to copy:', error)
        void dispatch(notify(`${t('FailedToCopy')}`, true, 5))
      }
    },
    [dispatch, t]
  )
  const [searchParams, setSearchParams] = useSearchParams({
    name: 'true',
    mode: 'analogous',
  })

  const name = (searchParams.get('name') ?? 'true') === 'true'

  const { isDragging, listItemsByStatus, handleDragging, handleUpdate } =
    useDragAndDrop(colors, statuses)
  const dragOverItem = useRef<number>(0)
  const [theTarget, setTheTarget] = useState<number>(0)

  const [haveCleared, setHaveCleared] = useState(false)

  const focusExportButtons = useCallback(() => {
    exportButtonsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    exportButtonsRef.current?.focus()
  }, [])

  const baseWidth = 8
  const [widthNumber, setWidth] = useLocalStorage(
    'Jenniina-color-block-width',
    baseWidth
  )
  const width = `${widthNumber}em`

  const fontSizeMultiplier = widthNumber / baseWidth

  const dynamicFontSize = {
    tooltip: `${0.86 * fontSizeMultiplier}em`,
    colorName: `${0.82 * fontSizeMultiplier}em`,
    input: `${0.95 * fontSizeMultiplier}em`,
  }

  const colorModeOptions: SelectOption[] = [
    { value: 'analogous', label: t('Analogous') },
    { value: 'complementary', label: t('Complementary') },
    { value: 'monochromatic', label: t('Monochromatic') },
    { value: 'triad', label: t('Triad') },
    { value: 'tetrad', label: t('Tetrad') },
  ]

  const isValidMode = (value: string | null): value is TColorMode => {
    return (
      value === 'analogous' ||
      value === 'complementary' ||
      value === 'triad' ||
      value === 'tetrad' ||
      value === 'monochromatic'
    )
  }

  const urlMode = searchParams.get('mode')
  const colorMode: TColorMode = isValidMode(urlMode) ? urlMode : 'analogous'

  useEffect(() => {
    setMode(colorMode)
  }, [colorMode, setMode])

  const setModeFromServer = useCallback(
    (nextMode: TColorMode) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('mode', nextMode)
          return next
        },
        {
          replace: true,
          preventScrollReset: true,
        }
      )
    },
    [setSearchParams]
  )

  const resetAndMake = () => {
    listItemsByStatus[status].removeItems()
    setColorsReset(true)
    clearColors()
  }

  const ComplianceShapes: Record<
    | ComplianceLevel.AA_RegularText
    | ComplianceLevel.AA_UIComponents
    | ComplianceLevel.AAA_RegularText,
    ComplianceShapeFunction
  > = {
    AA_RegularText: ({
      xPosition,
      yIndicator,
      blockWidth,
      indicatorSize,
      otherColor,
      blockColor,
      colorFormatBlock,
      colorFormatOther,
    }) => {
      // Always use hex for block and other color
      let blockHex, otherHex
      if (colorFormatBlock === 'hex') {
        blockHex = blockColor
      } else if (colorFormatBlock === 'rgb') {
        const rgbMatch = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i.exec(
          blockColor
        )
        blockHex = rgbMatch
          ? rgbToHex(
              Number(rgbMatch[1]),
              Number(rgbMatch[2]),
              Number(rgbMatch[3])
            )
          : '#000000'
      } else if (colorFormatBlock === 'hsl') {
        const hslMatch = /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i.exec(
          blockColor
        )
        if (hslMatch) {
          const rgb = hslToRGB(
            Number(hslMatch[1]),
            Number(hslMatch[2]),
            Number(hslMatch[3])
          )
          blockHex = rgbToHex(rgb.r, rgb.g, rgb.b)
        } else {
          blockHex = '#000000'
        }
      } else {
        blockHex = '#000000'
      }
      if (colorFormatOther === 'hex') {
        otherHex = otherColor
      } else if (colorFormatOther === 'rgb') {
        const rgbMatch = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i.exec(
          otherColor
        )
        otherHex = rgbMatch
          ? rgbToHex(
              Number(rgbMatch[1]),
              Number(rgbMatch[2]),
              Number(rgbMatch[3])
            )
          : '#000000'
      } else if (colorFormatOther === 'hsl') {
        const hslMatch = /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i.exec(
          otherColor
        )
        if (hslMatch) {
          const rgb = hslToRGB(
            Number(hslMatch[1]),
            Number(hslMatch[2]),
            Number(hslMatch[3])
          )
          otherHex = rgbToHex(rgb.r, rgb.g, rgb.b)
        } else {
          otherHex = '#000000'
        }
      } else {
        otherHex = '#000000'
      }
      return `
 <circle
  cx="${xPosition + blockWidth / 2}"
  cy="${yIndicator + indicatorSize / 2}"
  r="${indicatorSize * 0.32}"
  fill="${blockHex}"
  stroke="${otherHex}"
  stroke-width="${indicatorSize * 0.1}"
/>
`
    },
    AA_UIComponents: ({
      xPosition,
      yIndicator,
      blockWidth,
      indicatorSize,
      otherColor,
      blockColor,
      colorFormatBlock,
      colorFormatOther,
    }) => {
      let blockHex, otherHex
      if (colorFormatBlock === 'hex') {
        blockHex = blockColor
      } else if (colorFormatBlock === 'rgb') {
        const rgbMatch = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i.exec(
          blockColor
        )
        blockHex = rgbMatch
          ? rgbToHex(
              Number(rgbMatch[1]),
              Number(rgbMatch[2]),
              Number(rgbMatch[3])
            )
          : '#000000'
      } else if (colorFormatBlock === 'hsl') {
        const hslMatch = /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i.exec(
          blockColor
        )
        if (hslMatch) {
          const rgb = hslToRGB(
            Number(hslMatch[1]),
            Number(hslMatch[2]),
            Number(hslMatch[3])
          )
          blockHex = rgbToHex(rgb.r, rgb.g, rgb.b)
        } else {
          blockHex = '#000000'
        }
      } else {
        blockHex = '#000000'
      }
      if (colorFormatOther === 'hex') {
        otherHex = otherColor
      } else if (colorFormatOther === 'rgb') {
        const rgbMatch = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i.exec(
          otherColor
        )
        otherHex = rgbMatch
          ? rgbToHex(
              Number(rgbMatch[1]),
              Number(rgbMatch[2]),
              Number(rgbMatch[3])
            )
          : '#000000'
      } else if (colorFormatOther === 'hsl') {
        const hslMatch = /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i.exec(
          otherColor
        )
        if (hslMatch) {
          const rgb = hslToRGB(
            Number(hslMatch[1]),
            Number(hslMatch[2]),
            Number(hslMatch[3])
          )
          otherHex = rgbToHex(rgb.r, rgb.g, rgb.b)
        } else {
          otherHex = '#000000'
        }
      } else {
        otherHex = '#000000'
      }
      return `
    <rect
  x="${xPosition + blockWidth / 2 - indicatorSize * 0.2}"
  y="${yIndicator + indicatorSize / 2 - indicatorSize * 0.15}"
  width="${indicatorSize * 0.3}"
  height="${indicatorSize * 0.3}"
  fill="${blockHex}"
  stroke="${otherHex}"
  stroke-width="${indicatorSize * 0.1}"
/>
`
    },
    AAA_RegularText: ({
      xPosition,
      yIndicator,
      blockWidth,
      indicatorSize,
      otherColor,
      colorFormatOther,
    }) => {
      let otherHex
      if (colorFormatOther === 'hex') {
        otherHex = otherColor
      } else if (colorFormatOther === 'rgb') {
        const rgbMatch = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i.exec(
          otherColor
        )
        otherHex = rgbMatch
          ? rgbToHex(
              Number(rgbMatch[1]),
              Number(rgbMatch[2]),
              Number(rgbMatch[3])
            )
          : '#000000'
      } else if (colorFormatOther === 'hsl') {
        const hslMatch = /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i.exec(
          otherColor
        )
        if (hslMatch) {
          const rgb = hslToRGB(
            Number(hslMatch[1]),
            Number(hslMatch[2]),
            Number(hslMatch[3])
          )
          otherHex = rgbToHex(rgb.r, rgb.g, rgb.b)
        } else {
          otherHex = '#000000'
        }
      } else {
        otherHex = '#000000'
      }
      return `
<circle
  cx="${xPosition + blockWidth / 2}"
  cy="${yIndicator + indicatorSize / 2}"
  r="${indicatorSize / 2}"
  fill="${otherHex}"
  stroke="none"
/>
`
    },
  }

  const generateSVG = (): {
    svgContent: string
    svgWidth: number
    svgHeight: number
  } => {
    const width = widthNumber * 20
    const blockWidth = width
    const indicatorSize = blockWidth / 3
    const indicatorSpacing = indicatorSize / 3
    const padding = width / 6
    const lineHeight = indicatorSize / 20
    const fontSize = blockWidth / 10
    const items = listItemsByStatus[status]?.items ?? []

    const totalIndicators = items?.length
    const blockHeight = name
      ? totalIndicators * (indicatorSize + indicatorSpacing) -
        indicatorSpacing +
        padding * 0.5
      : totalIndicators * (indicatorSize + indicatorSpacing) -
        indicatorSpacing +
        padding * 1.2
    const textBlockHeight = name ? fontSize + padding * 0.8 : padding * 1.3

    const svgWidth = items.length * blockWidth
    const svgHeight = blockHeight + textBlockHeight * 1.9

    const blocksGroup = items
      ?.map((block, index) => {
        const xPosition = index * blockWidth

        // Always use hex for block color
        let hexColor: string
        try {
          if (block.colorFormat === 'hex') {
            hexColor = block.color
          } else if (block.colorFormat === 'rgb') {
            const rgbMatch =
              /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i.exec(block.color)
            if (rgbMatch) {
              hexColor = rgbToHex(
                Number(rgbMatch[1]),
                Number(rgbMatch[2]),
                Number(rgbMatch[3])
              )
            } else {
              throw new Error('Invalid RGB format')
            }
          } else if (block.colorFormat === 'hsl') {
            const hslMatch =
              /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i.exec(
                block.color
              )
            if (hslMatch) {
              const rgb = hslToRGB(
                Number(hslMatch[1]),
                Number(hslMatch[2]),
                Number(hslMatch[3])
              )
              hexColor = rgbToHex(rgb.r, rgb.g, rgb.b)
            } else {
              throw new Error('Invalid HSL format')
            }
          } else {
            hexColor = '#000000'
          }
        } catch (error) {
          console.error(error)
          void dispatch(
            notify(`${t('Error')}: ${(error as Error).message}`, true, 4)
          )
          hexColor = '#000000' // Default to black on error
        }

        // Color block rectangle
        const blockRect = `
        <rect
          x="${xPosition}"
          y="0"
          width="${blockWidth}"
          height="${blockHeight}"
          fill="${hexColor}"
          stroke="none"
        />
      `

        // Text background rectangle and label
        const textContent = name
          ? `
        <!-- Text Background -->
        <rect
          x="${xPosition}"
          y="${blockHeight - 0.8}"
          width="${blockWidth}"
          height="${textBlockHeight}"
          fill="${hexColor}"
          stroke="none"
        />
        <!-- Color Text Label -->
        <text
          x="${xPosition + blockWidth / 2}"
          y="${blockHeight + textBlockHeight / 2 + fontSize / 4}"
          font-size="${fontSize}"
          font-family="Arial"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="${block.luminance > 0.179 ? '#000000' : '#FFFFFF'}"
          stroke="none"
        >
          ${block.color}
        </text>
      `
          : ''

        return `
        <g>
          <!-- Color Block -->
          ${blockRect}
          <!-- Color Text Label -->
          ${textContent}
        </g>
      `
      })
      .join('')

    const linesGroup = items
      ?.map((colorItem, idx) => {
        const yIndicator =
          padding * 0.5 + idx * (indicatorSize + indicatorSpacing)
        const yLine = yIndicator + (indicatorSize - lineHeight) / 2
        // Always use hex for line color
        let lineHex
        if (colorItem.colorFormat === 'hex') {
          lineHex = colorItem.color
        } else if (colorItem.colorFormat === 'rgb') {
          const rgbMatch = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i.exec(
            colorItem.color
          )
          lineHex = rgbMatch
            ? rgbToHex(
                Number(rgbMatch[1]),
                Number(rgbMatch[2]),
                Number(rgbMatch[3])
              )
            : '#000000'
        } else if (colorItem.colorFormat === 'hsl') {
          const hslMatch =
            /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i.exec(
              colorItem.color
            )
          if (hslMatch) {
            const rgb = hslToRGB(
              Number(hslMatch[1]),
              Number(hslMatch[2]),
              Number(hslMatch[3])
            )
            lineHex = rgbToHex(rgb.r, rgb.g, rgb.b)
          } else {
            lineHex = '#000000'
          }
        } else {
          lineHex = '#000000'
        }

        return `
        <rect
          x="0"
          y="${yLine}"
          width="${svgWidth}"
          height="${lineHeight}"
          fill="${lineHex}"
          stroke="none"
        />
      `
      })
      .join('')

    const indicatorsGroup = items
      ?.map((block, index) => {
        const xPosition = index * blockWidth

        // Determine highest compliance level for each color
        const highestCompliance = (
          otherId: number
        ): keyof typeof ComplianceShapes | null => {
          if (block.compliantColors?.AAA_RegularText?.includes(otherId))
            return ComplianceLevel.AAA_RegularText
          if (block.compliantColors?.AA_RegularText?.includes(otherId))
            return ComplianceLevel.AA_RegularText
          if (block.compliantColors?.AA_UIComponents?.includes(otherId))
            return ComplianceLevel.AA_UIComponents

          return null
        }

        const indicators = items
          ?.filter((_, otherIdx) => otherIdx !== index)
          .map((other) => {
            const complianceLevel = highestCompliance(other.id)
            if (!complianceLevel) return ''

            return ComplianceShapes[complianceLevel]({
              xPosition,
              yIndicator:
                padding * 0.5 +
                items.indexOf(other) * (indicatorSize + indicatorSpacing),
              blockWidth,
              indicatorSize,

              otherColor: other.color,
              blockColor: block.color,
              colorFormatBlock: block.colorFormat,
              colorFormatOther: other.colorFormat,
            })
          })
          .join('')

        return `
        <g>
          <!-- Compliance Indicators -->
          ${indicators}
        </g>
      `
      })
      .join('')

    const linkMargin = 8
    const linkX = svgWidth - linkMargin * 1.2
    const linkY =
      totalIndicators < 3
        ? svgHeight - linkMargin * 1.5
        : svgHeight - linkMargin
    const size = totalIndicators < 3 ? fontSize * 0.7 : fontSize
    const linkURL = 'https://colors.jenniina.fi'

    const linkElement = `
      <a href="${linkURL}" target="_blank" rel="noopener noreferrer">
        <text
          x="${linkX}"
          y="${linkY}"
          font-size="${size}"
          font-family="Arial"
          text-anchor="end"
          fill="#000000"
          stroke="none"
        >
          ${linkURL}
        </text>
      </a>
    `

    const linkElement2 = `
      <a href="${linkURL}" target="_blank" rel="noopener noreferrer">
        <text
          x="${linkMargin}"
          y="${linkY}"
          font-size="${size}"
          font-family="Arial"
          text-anchor="start"
          fill="#FFFFFF"
          stroke="none"
        >
          ${linkURL}
        </text>
      </a>
    `

    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
      <!-- Color Blocks -->
      <g>
        ${blocksGroup}
      </g>
      <!-- Lines -->
      <g>
        ${linesGroup}
      </g>
      <!-- Compliance Indicators -->
      <g>
        ${indicatorsGroup}
      </g>
      <!-- Source Link -->
      <g>
        ${linkElement2}
      </g>
      <g>
        ${linkElement}
      </g>
    </svg>
  `

    return { svgContent, svgWidth, svgHeight }
  }

  // Compliance Shapes Mapping
  type ComplianceShapeFunction = (props: {
    xPosition: number
    yIndicator: number
    blockWidth: number
    indicatorSize: number
    otherColor: string
    blockColor: string
    colorFormatBlock: string
    colorFormatOther: string
  }) => string

  const saveAsSVG = () => {
    const isOnlyOneColor = (listItemsByStatus[status]?.items ?? []).length === 1
    if (isOnlyOneColor) {
      dispatch(notify(t('PleaseChooseAtLeastTwoColors'), true, 5))
      return
    }

    const { svgContent } = generateSVG()
    const blob = new Blob([svgContent], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document?.createElement('a')
    link.href = url
    link.download = 'color-blocks.svg'
    document?.body.appendChild(link)
    link.click()
    document?.body.removeChild(link)
    URL.revokeObjectURL(url)
    void dispatch(notify(t('ArtSaved'), false, 5))
  }

  const saveAsPNG = () => {
    const isOnlyOneColor = (listItemsByStatus[status]?.items ?? []).length === 1
    if (isOnlyOneColor) {
      dispatch(notify(t('PleaseChooseAtLeastTwoColors'), true, 5))
      return
    }

    const { svgContent, svgWidth, svgHeight } = generateSVG()

    const img = new Image()
    img.width = svgWidth
    img.height = svgHeight

    const svgBlob = new Blob([svgContent], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const canvas = document?.createElement('canvas')
      canvas.width = svgWidth
      canvas.height = svgHeight
      const context = canvas.getContext('2d')

      context?.drawImage(img, 0, 0)

      const pngDataUrl = canvas.toDataURL('image/png')

      const link = document?.createElement('a')
      link.href = pngDataUrl
      link.download = 'color-blocks.png'
      link.target = '_blank'
      link.rel = 'noreferrer'
      document?.body.appendChild(link)
      link.click()
      document?.body.removeChild(link)

      URL.revokeObjectURL(url)
      void dispatch(notify(t('ArtSaved'), false, 5))
    }

    img.onerror = (err) => {
      console.error('Error loading SVG into image for PNG conversion:', err)
      URL.revokeObjectURL(url)
      void dispatch(notify(t('Error'), true, 4))
    }

    img.src = url
  }

  const handleDragStart = (
    e: React.DragEvent<HTMLElement>,
    position: number
  ) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'item', id: position })
    )
  }

  const handleDragEnter = (
    e: React.DragEvent<HTMLElement>,
    position: number
  ) => {
    e.preventDefault()
    setTheTarget(position)
    dragOverItem.current = position
  }

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    handleDragging(true)
  }

  const handleDrop = (e: React.DragEvent<HTMLUListElement>) => {
    const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DragData
    if (data.type === 'item') {
      const nextItems = handleUpdate(parseInt(data.id), status, theTarget)
      const ordered = Array.isArray(nextItems)
        ? nextItems
        : (listItemsByStatus[status]?.items ?? [])

      // Keep the saved state (and URL) in sync with the visible order.
      replaceColors(ordered)
      handleDragging(false)
    }
  }

  const focusColorBlock = useCallback((targetId: number) => {
    const el = document.getElementById(`color-block-${targetId}`)
    if (!el) return
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
    el.focus()
  }, [])

  const moveColor = useCallback(
    (id: number, direction: 'left' | 'right') => {
      const items = listItemsByStatus[status]?.items ?? []
      const fromIndex = items.findIndex((item) => item.id === id)
      if (fromIndex === -1) return

      const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1
      if (toIndex < 0 || toIndex >= items.length) return

      const nextItems = [...items]
      ;[nextItems[fromIndex], nextItems[toIndex]] = [
        nextItems[toIndex],
        nextItems[fromIndex],
      ]

      listItemsByStatus[status].setItems(nextItems)
      replaceColors(nextItems)
    },
    [listItemsByStatus, replaceColors]
  )

  const times = 0.04

  const blocks = listItemsByStatus[status]?.items ?? []

  const applyLoadedColors = useCallback(
    (nextColors: ColorBlock[]) => {
      // DnD order is persisted in localStorage; when we load a palette we want
      // the palette's saved order, not whatever order was previously persisted.
      listItemsByStatus[status]?.removeItems()
      listItemsByStatus[status]?.setItems(nextColors)
      replaceColors(nextColors)
    },
    [listItemsByStatus, replaceColors]
  )

  return (
    <>
      <SEO
        title={`${t('WCAGTool')} | ${t('ColorAccessibilityTool')}`}
        description={`${t('WCAGTool')} - ${t('TestColorCombinations')}`}
        canonicalUrl={`https://colors.jenniina.fi`}
      />
      <Heading
        title={`${t('WCAGTool')}`}
        subtitle={`${t('SeeColorsContrastAccessibilityAtAGlance')}`}
        location="colors"
      />

      <div
        id={styles['color-container']}
        ref={containerRef}
        className={`fullwidth ${styles['color-container']} ${
          lightTheme ? styles.light : ''
        }`}
      >
        <section>
          <div id="info" className={styles['info-wrap']}>
            <h2>{t('SymbolMeanings')}</h2>
            <ul>
              <li>
                <div>
                  <b
                    style={{
                      display: 'inline-block',
                    }}
                  ></b>
                </div>
                <span>
                  {t('Line')}: {t('ColorsNotCompatible')};{' '}
                  {t('ContrastNotSufficient')}
                </span>
              </li>
              <li>
                <div>
                  <b
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'var(--color-primary-1)',
                      outline: `0.23em solid var(--color-primary-15)`,
                      outlineOffset: `-0.2em`,
                      borderRadius: '0.1rem',
                      width: `0.9em`,
                      height: `0.9em`,
                    }}
                  ></b>
                </div>
                <span>{t('OnlyUI')}</span>
              </li>
              <li>
                <div>
                  <b
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'var(--color-primary-1)',
                      outline: `0.25em solid var(--color-primary-15)`,
                      outlineOffset: `-0.25em`,
                      borderRadius: '50%',
                      width: `1.7em`,
                      height: `1.7em`,
                    }}
                  ></b>
                </div>
                <span>{t('TheRoundHollowIndicator')}</span>
              </li>{' '}
              <li>
                <div>
                  <b
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'var(--color-primary-15)',
                      borderRadius: '50%',
                      width: `2em`,
                      height: `2em`,
                    }}
                  ></b>
                </div>
                <span>{t('TheRoundFilledIndicator')}</span>
              </li>
            </ul>
          </div>
          <div
            ref={colorPicker}
            id="colorpicker"
            className={styles['color-picker']}
            style={{ ['--font-size' as string]: dynamicFontSize.input }}
          >
            <label htmlFor="color-input" className=" ">
              {t('ColorPicker')}:
            </label>
            <input
              id="color-input"
              type="color"
              value={currentColor}
              onChange={(e) => {
                setCurrentColor(e.target.value)
              }}
            />
            <button
              type="button"
              onClick={addColor}
              style={{
                backgroundImage: 'none',
                backgroundColor: currentColor,
                color: addBtnTextColor,
              }}
            >
              <span
                className={`transf ${styles['circle-left-edge']}`}
                style={{ ['--color' as string]: currentColor }}
              >
                &nbsp;
              </span>
              {t('AddColor')}
              <Icon lib="lu" name="LuCirclePlus" />
            </button>
          </div>
          <div className={styles['btn-wrap']}>
            <div
              className={`${styles['color-edit-container']} ${styles['mode-container']}`}
            >
              <Select
                options={colorModeOptions}
                value={
                  {
                    value: mode,
                    label: colorModeOptions.find((o) => o.value === mode)
                      ?.label,
                  } as SelectOption
                }
                onChange={(o) => {
                  setMode(o?.value as TColorMode)
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev)
                      next.set('mode', String(o?.value ?? mode ?? 'analogous'))
                      return next
                    },
                    {
                      replace: true,
                      preventScrollReset: true,
                    }
                  )
                }}
                id="color-mode"
                instructions={t('SelectColorModeForNewColors')}
                className={`${styles['color-select']} ${styles['mode-select']}`}
                hideDelete
                gray
                tooltip={true}
                y="above narrow2"
                z={3}
              />
              <button
                className={`gray tooltip-wrap ${styles['flat-left']}`}
                type="button"
                onClick={makeColorPalette}
              >
                {t('AddToColors')}&nbsp;&nbsp;
                <Icon lib="lu" name="LuCirclePlus" />
                <span className="scr">
                  {t('GeneratesColorsBasedOnLastColor')}
                </span>
                <span className="tooltip above narrow2" aria-hidden="true">
                  {t('GeneratesColorsBasedOnLastColor')}
                </span>
              </button>
              <button
                className={` gray ${styles['empty-generate']}`}
                type="button"
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={async () => {
                  if (haveCleared) {
                    resetAndMake()
                    return
                  }

                  const ok = await confirm({
                    message: t('AreYouSureYouWantToClearAllColors') ?? '',
                  })

                  if (!ok) return
                  resetAndMake()
                  setHaveCleared(true)
                }}
              >
                {t('ClearAndGenerateNew')}&nbsp;&nbsp;
                <Icon lib="lia" name="LiaUndoAltSolid" />
              </button>
              {listItemsByStatus[status]?.items?.length > 0 && (
                <>
                  <div className={styles['width-wrap']}>
                    <label htmlFor="color-block-width">{t('EditSize')}</label>
                    <input
                      id="color-block-width"
                      type="range"
                      min={5}
                      max={12}
                      step={0.5}
                      value={widthNumber}
                      onChange={(e) => setWidth(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <div
            id="color-blocks"
            ref={scrollRef}
            className={`${styles['color-blocks']} ${
              !name ? styles.overflow : ''
            } ${isDragging ? styles.drag : ''}`}
          >
            {blocks.map((block, index) => {
              const isFirst = index === 0
              const isLast = index === blocks.length - 1
              const prevId = blocks[index - 1]?.id
              const nextId = blocks[index + 1]?.id

              return (
                <ul
                  key={`${block.id}`}
                  className={styles['block-wrap']}
                  onDrop={handleDrop}
                  id={`color-block-${block.id}`}
                  tabIndex={-1}
                >
                  <li
                    className={styles['color-wrap']}
                    title={`ID: ${block.id}`}
                    aria-label={`ID: ${block.id}`}
                    style={{ width: `${width}`, maxWidth: `${width}` }}
                  >
                    <>
                      <div className={styles['skip-links']}>
                        {!isFirst && prevId != null && (
                          <a
                            href={`#color-block-${prevId}`}
                            className={`${styles['skip-link']}`}
                            onClick={(e) => {
                              e.preventDefault()
                              focusColorBlock(prevId)
                            }}
                          >
                            <span>
                              <Icon lib="fa" name="FaArrowLeft" />{' '}
                              {t('SkipToPreviousColor')}
                            </span>
                          </a>
                        )}

                        {!isLast && nextId != null && (
                          <a
                            href={`#color-block-${nextId}`}
                            className={`${styles['skip-link']} gray`}
                            onClick={(e) => {
                              e.preventDefault()
                              focusColorBlock(nextId)
                            }}
                          >
                            <span>
                              {' '}
                              {t('SkipToNextColor')}{' '}
                              <Icon lib="fa" name="FaArrowRight" />
                            </span>
                          </a>
                        )}
                      </div>
                      <div className={styles['move-buttons']}>
                        {!isFirst && (
                          <button
                            type="button"
                            title={t('MoveLeft')}
                            className={` ${styles.left}`}
                            onClick={() => moveColor(block.id, 'left')}
                            style={{
                              color:
                                block.luminance < 0.179 ? 'white' : 'black',
                              backgroundColor: block.color,
                              backgroundImage: 'none',
                            }}
                          >
                            <b aria-hidden="true">
                              <Icon lib="go" name="GoArrowLeft" />
                            </b>
                            <span className="scr">{t('MoveLeft')}</span>
                          </button>
                        )}

                        <big
                          draggable={'true'}
                          onDragStart={(e) => handleDragStart(e, block.id)}
                          onDragEnter={(e) => handleDragEnter(e, block.id)}
                          onDragOver={(e) => handleDragOver(e)}
                          onDragEnd={() => handleDragging(false)}
                          data-identity={block.id}
                          className={`${styles['drag-handle']} ${isFirst ? styles.left : isLast ? styles.right : ''}`}
                        >
                          <Icon lib="md" name="MdDragIndicator" />
                          <span className="scr">{t('Move')}</span>
                        </big>

                        {isLast && (
                          <button
                            type="button"
                            className={`${styles['skip-link']} gray`}
                            onClick={focusExportButtons}
                          >
                            <span>
                              {t('SkipToExportButtons')}{' '}
                              <Icon lib="fa" name="FaArrowRight" />
                            </span>
                          </button>
                        )}

                        {!isLast && (
                          <button
                            type="button"
                            title={t('MoveRight')}
                            className={` ${styles.right}`}
                            onClick={() => moveColor(block.id, 'right')}
                            style={{
                              color:
                                block.luminance < 0.179 ? 'white' : 'black',
                              backgroundColor: block.color,
                              backgroundImage: 'none',
                            }}
                          >
                            <b aria-hidden="true">
                              <Icon lib="go" name="GoArrowRight" />
                            </b>
                            <span className="scr">{t('MoveRight')}</span>
                          </button>
                        )}
                      </div>
                    </>

                    <ul>
                      <li
                        draggable={'true'}
                        onDragStart={(e) => handleDragStart(e, block.id)}
                        onDragEnter={(e) => handleDragEnter(e, block.id)}
                        onDragOver={(e) => handleDragOver(e)}
                        onDragEnd={() => handleDragging(false)}
                        data-identity={block.id}
                        className={styles['color-block']}
                        style={{
                          ['--color' as string]: block.color,
                          backgroundColor: block.color,
                          width: `${width}`,
                          maxWidth: `${width}`,
                          height: `calc(calc(${width} * 0.5) * ${blocks.length} + ${width} * 0.2)`,
                        }}
                      >
                        <div
                          className={styles['compliance-indicators']}
                          style={{
                            gap: `calc(${width} / 6)`,
                            ['--width-full' as string]: `${width}`,
                          }}
                        >
                          {blocks.map((otherColor) => {
                            if (otherColor.id === block.id) {
                              return (
                                <div
                                  key={`none-${otherColor.color}-${otherColor.id}`}
                                  className={styles.indicator}
                                  style={{
                                    ['--color' as string]: otherColor.color,
                                  }}
                                >
                                  <div
                                    aria-hidden="true"
                                    className={styles['indicator-null']}
                                    style={{
                                      backgroundColor: 'transparent',
                                      width: '100%',
                                      height: '100%',
                                    }}
                                  ></div>
                                </div>
                              )
                            }
                            let complianceLevel: ComplianceLevel | null = null
                            if (
                              block.compliantColors?.AAA_RegularText?.includes(
                                otherColor.id
                              )
                            ) {
                              complianceLevel = ComplianceLevel.AAA_RegularText
                            } else if (
                              block.compliantColors?.AA_RegularText?.includes(
                                otherColor.id
                              )
                            ) {
                              complianceLevel = ComplianceLevel.AA_RegularText
                            } else if (
                              block.compliantColors?.AA_UIComponents?.includes(
                                otherColor.id
                              )
                            ) {
                              complianceLevel = ComplianceLevel.AA_UIComponents
                            }

                            if (
                              complianceLevel ===
                              ComplianceLevel.AAA_RegularText
                            ) {
                              return (
                                <div
                                  key={`aaa-${otherColor.color}-${otherColor.id}`}
                                  className={styles.indicator}
                                  style={{
                                    ['--color' as string]: otherColor.color,
                                  }}
                                >
                                  <button
                                    type="button"
                                    className={`reset ${styles['indicator-aaa']} tooltip-wrap`}
                                    style={{
                                      backgroundColor: otherColor.color,
                                      width: '100%',
                                      height: '100%',
                                    }}
                                    onClick={() => {
                                      const text = `${otherColor.color} is AAA compliant with ${block.color}`
                                      void copyToClipboard(text)
                                    }}
                                  >
                                    <span className="scr">{`${t('AAACompliantWithID')}: ${otherColor.id}`}</span>
                                    <span
                                      aria-hidden="true"
                                      id={`span-${otherColor.id}-${block.id}`}
                                      className={`tooltip below narrow3 ${styles.tooltip}`}
                                      style={{
                                        fontSize: `clamp(12px, ${dynamicFontSize.input}, 1rem)`,
                                        ['--tooltip-max-width' as string]:
                                          width,
                                      }}
                                    >{`${t('AAACompliantWithID')}: ${
                                      otherColor.id
                                    }`}</span>
                                  </button>
                                </div>
                              )
                            } else if (
                              complianceLevel === ComplianceLevel.AA_RegularText
                            ) {
                              return (
                                <div
                                  key={`aa-${otherColor.color}-${otherColor.id}`}
                                  style={{
                                    ['--color' as string]: otherColor.color,
                                  }}
                                  className={styles.indicator}
                                >
                                  <button
                                    type="button"
                                    className={`reset ${styles['indicator-aa']} tooltip-wrap`}
                                    style={{
                                      backgroundColor: block.color,
                                      outline: `calc(${width} * ${
                                        times * 1.1
                                      }) solid ${otherColor.color}`,
                                      outlineOffset: `calc(${width} * -0.013)`,
                                      width: `calc(${width} / 5)`,
                                      height: `calc(${width} / 5)`,
                                      borderRadius: '50%',
                                    }}
                                    onClick={() => {
                                      const text = `${otherColor.color} is AA compliant with ${block.color}`
                                      void copyToClipboard(text)
                                    }}
                                  >
                                    <span className="scr">{`${t('AACompliantWithID')}: ${otherColor.id}`}</span>
                                    <span
                                      aria-hidden="true"
                                      id={`span-${otherColor.id}-${block.id}`}
                                      className="tooltip below narrow3"
                                      style={{
                                        fontSize: `clamp(12px, ${dynamicFontSize.input}, 1rem)`,
                                        ['--tooltip-max-width' as string]:
                                          width,
                                      }}
                                    >{`${t('AACompliantWithID')}: ${
                                      otherColor.id
                                    }`}</span>
                                  </button>
                                </div>
                              )
                            } else if (
                              complianceLevel ===
                              ComplianceLevel.AA_UIComponents
                            ) {
                              return (
                                <div
                                  key={`aa-ui-${otherColor.color}-${otherColor.id}`}
                                  style={{
                                    ['--color' as string]: otherColor.color,
                                  }}
                                  className={styles.indicator}
                                >
                                  <button
                                    type="button"
                                    className={`reset ${styles['indicator-aa-ui']} tooltip-wrap`}
                                    style={{
                                      backgroundColor: block.color,
                                      outline: `calc(${width} * ${times}) solid ${otherColor.color}`,
                                      outlineOffset: `calc(${width} * ${times} * -1)`,
                                      width: `calc(${width} / 7)`,
                                      height: `calc(${width} / 7)`,
                                    }}
                                    onClick={() => {
                                      const text = `${otherColor.color} is AA UI compliant with ${block.color}`
                                      void copyToClipboard(text)
                                    }}
                                  >
                                    <span className="scr">{`${t('AAGraphicElementCompliantWithID')}: ${otherColor.id}`}</span>
                                    <span
                                      aria-hidden="true"
                                      id={`span-ui-${otherColor.id}-${block.id}`}
                                      className={`tooltip below narrow3 ${styles.tooltip}`}
                                      style={{
                                        fontSize: `clamp(12px, ${dynamicFontSize.input}, 1rem)`,
                                        ['--tooltip-max-width' as string]:
                                          width,
                                      }}
                                    >{`${t('AAGraphicElementCompliantWithID')}: ${
                                      otherColor.id
                                    }`}</span>
                                  </button>
                                </div>
                              )
                            }

                            return (
                              <div
                                aria-hidden="true"
                                key={`null-${otherColor.color}-${otherColor.id}`}
                                className={styles.indicator}
                                style={{
                                  ['--color' as string]: otherColor.color,
                                }}
                              >
                                <div
                                  className={styles['indicator-null']}
                                  style={{
                                    backgroundColor: 'transparent',
                                    width: '100%',
                                    height: '100%',
                                  }}
                                ></div>
                              </div>
                            )
                          })}
                        </div>
                      </li>
                    </ul>
                    {name && (
                      <div
                        style={{
                          position: 'relative',
                          backgroundColor: block.color,
                          width: `${width}`,
                          maxWidth: `${width}`,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '1.4rem',
                        }}
                        className={styles['color-name']}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            color: block.luminance < 0.179 ? 'white' : 'black',
                            fontSize: `clamp(12px, ${dynamicFontSize.colorName}, 1.6rem)`,
                            textAlign: 'center',
                          }}
                        >
                          {block.color}
                        </span>
                      </div>
                    )}

                    <>
                      <div
                        className={styles['color-edit-container']}
                        style={{
                          fontSize: `clamp(12px, ${dynamicFontSize.input}, 2rem)`,
                        }}
                      >
                        <ColorsInput
                          block={block}
                          updateColor={updateColor}
                          width={width}
                          hexToRGB={hexToRGB}
                          rgbToHSL={rgbToHSL}
                          rgbToHex={rgbToHex}
                          hslToRGB={hslToRGB}
                          fontSize={`clamp(12px, ${dynamicFontSize.input}, 2rem)`}
                        />
                      </div>
                      <button
                        className={`tooltip-wrap gray ${styles.duplicate}`}
                        onClick={() => duplicateColorAfter(block.id)}
                        type="button"
                        style={{
                          margin: '0.8em auto 0.2em',
                          width: `calc(100% - 4px)`,
                          minWidth: `calc(100% - 4px)`,
                          fontSize: `clamp(12px, ${dynamicFontSize.input}, 2rem)`,
                        }}
                      >
                        {t('Duplicate')}
                      </button>
                      <button
                        className={`tooltip-wrap delete danger gray ${styles.remove}`}
                        onClick={() => {
                          confirm({
                            message:
                              t('AreYouSureYouWantToRemoveThisColor') ?? '',
                          }).then((ok) => {
                            if (ok) removeColor(block.id)
                          })
                        }}
                        type="button"
                        style={{
                          margin: '0.8em auto',
                          width: `calc(100% - 4px)`,
                          minWidth: `calc(100% - 4px)`,
                          fontSize: `clamp(12px, ${dynamicFontSize.input}, 2rem)`,
                        }}
                      >
                        {t('Remove')}
                      </button>
                    </>
                  </li>
                </ul>
              )
            })}
          </div>
          <div
            id="export-buttons"
            ref={exportButtonsRef}
            tabIndex={-1}
            className={`${styles['btn-wrap']} ${styles['export-wrap']}`}
          >
            {listItemsByStatus[status]?.items?.length > 0 && (
              <>
                <div>
                  <div
                    className={`${styles['visibility-wrap']} flex column center gap-half`}
                  >
                    <button
                      type="button"
                      title={name ? t('HideColorName') : t('ShowColorName')}
                      onClick={() => {
                        setSearchParams(
                          (prev) => {
                            prev.set('name', name ? 'false' : 'true')
                            return prev
                          },
                          {
                            replace: true,
                            preventScrollReset: true,
                          }
                        )
                      }}
                      className="reset p1"
                    >
                      <Icon
                        lib="bi"
                        name={name ? 'BiHide' : 'BiShowAlt'}
                        style={{ fontSize: '1.7em' }}
                        className="lower03"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchParams(
                          (prev) => {
                            prev.set('name', name ? 'false' : 'true')
                            return prev
                          },
                          {
                            replace: true,
                            preventScrollReset: true,
                          }
                        )
                      }}
                      className="gray tooltip-wrap"
                    >
                      {name ? t('HideColorName') : t('ShowColorName')}{' '}
                      <Icon lib="bi" name={name ? 'BiHide' : 'BiShowAlt'} />
                      <span className="tooltip right narrow2 below">
                        {t('ToggleColorNameVisibility')}
                      </span>
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex column center gap-half">
                    <button
                      type="button"
                      title={t('Reset')}
                      // eslint-disable-next-line @typescript-eslint/no-misused-promises
                      onClick={async () => {
                        if (
                          colors.length === 0 ||
                          (await confirm({
                            message: t('AreYouSureYouWantToResetAllColors'),
                          }))
                        ) {
                          void resetColors()
                          scrollRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          })
                        }
                      }}
                      className="reset p1"
                    >
                      <Icon
                        lib="bi"
                        name="BiReset"
                        style={{ fontSize: '1.8em' }}
                      />
                    </button>
                    <button
                      className="gray"
                      type="button"
                      // eslint-disable-next-line @typescript-eslint/no-misused-promises
                      onClick={async () => {
                        if (
                          colors.length === 0 ||
                          (await confirm({
                            message: t('AreYouSureYouWantToResetAllColors'),
                          }))
                        ) {
                          void resetColors()
                          scrollRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          })
                        }
                      }}
                    >
                      {t('Reset')}
                      <Icon lib="bi" name="BiReset" />
                    </button>
                  </div>
                  <div className="flex column center gap-half">
                    <button
                      type="button"
                      title={t('Clear')}
                      // eslint-disable-next-line @typescript-eslint/no-misused-promises
                      onClick={async () => {
                        if (
                          await confirm({
                            message:
                              t('AreYouSureYouWantToClearAllColors') ?? '',
                          })
                        ) {
                          listItemsByStatus[status].removeItems()
                          void clearColors()
                          scrollRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          })
                        }
                      }}
                      className="reset p1"
                    >
                      <Icon
                        lib="ri"
                        name="RiDeleteBin2Line"
                        style={{ fontSize: '1.8em' }}
                      />
                    </button>
                    <button
                      className="gray"
                      type="button"
                      // eslint-disable-next-line @typescript-eslint/no-misused-promises
                      onClick={async () => {
                        if (
                          await confirm({
                            message:
                              t('AreYouSureYouWantToClearAllColors') ?? '',
                          })
                        ) {
                          listItemsByStatus[status].removeItems()
                          void clearColors()
                          scrollRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          })
                        }
                      }}
                    >
                      {t('Clear')}
                      <Icon lib="ri" name="RiDeleteBin2Line" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex column center gap-half">
                    <button
                      type="button"
                      title={t('SavePNG')}
                      onClick={saveAsPNG}
                      className={`reset p1 ${styles['lower05']}`}
                    >
                      <Icon
                        lib="md"
                        name="MdOutlineImage"
                        style={{ fontSize: '1.8em' }}
                      />
                    </button>
                    <button type="button" onClick={saveAsPNG} className="gray">
                      {t('SavePNG')}
                      <Icon lib="pi" name="PiDownloadSimpleFill" />
                    </button>
                  </div>
                  <div className="flex column center gap-half">
                    <button
                      type="button"
                      title={t('SaveSVG')}
                      onClick={saveAsSVG}
                      className="reset p1"
                    >
                      <Icon
                        lib="si"
                        name="SiSvgtrace"
                        style={{ fontSize: '1.7em' }}
                      />
                    </button>
                    <button type="button" onClick={saveAsSVG} className="gray">
                      {t('SaveSVG')}
                      <Icon lib="pi" name="PiDownloadSimpleFill" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
        <NamedPalettes
          colors={colors}
          currentColor={currentColor}
          mode={mode}
          setColors={applyLoadedColors}
          setCurrentColor={setCurrentColor}
          setModeFromServer={setModeFromServer}
          updateUrlColors={updateSearchParams}
          scrollRefCurrent={scrollRef.current}
          user={user}
        />
        <section className={styles.contact}>
          <div>
            <h2 className="left">{t('Contact')}</h2> <p>{t('GetInTouch')}</p>
            <FormMulti />
          </div>
        </section>
      </div>
    </>
  )
}

export default AccessibleColors
