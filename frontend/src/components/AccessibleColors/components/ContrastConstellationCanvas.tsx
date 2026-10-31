import {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Icon from '../../Icon/Icon'
import CopyToClipboard from '../../CopyToClipboard/CopyToClipboard'
import useLocalStorage from '../../../hooks/useStorage'
import { useLanguageContext } from '../../../contexts/LanguageContext'
import { useAppDispatch } from '../../../hooks/useAppDispatch'
import { notify } from '../../../reducers/notificationReducer'
import {
  getContrastRatio,
  getRandomBetween,
  hexToRGB,
  hslToRGB,
  rgbToHSL,
  rgbToHex,
} from '../../../utils'
import { ColorBlock } from '../AccessibleColors'
import { Select, SelectOption } from '../../Select/Select'
import styles from './contrastconstellationcanvas.module.css'

interface ContrastConstellationCanvasProps {
  colors: ColorBlock[]
  showNames: boolean
  lightTheme: boolean
  colorFormat: ColorBlock['colorFormat']
  onToggleShowNames: () => void
  onColorFormatChange: (format: ColorBlock['colorFormat']) => void
}

interface Position {
  x: number
  y: number
}

interface NodeData extends ColorBlock {
  hex: string
  x: number
  y: number
}

interface DragState {
  pointerId: number | null
  nodeId: number | null
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
}

interface ResizeState {
  pointerId: number
  direction: 1 | -1
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  startOffsetX: number
}

const THRESHOLDS = [3, 4.5, 7] as const
const DRAG_THRESHOLD_PX = 4
const MIN_CANVAS_WIDTH = 320
const MIN_CANVAS_HEIGHT = 320
const DEFAULT_CANVAS_SIZE = { width: 760, height: 540 }
const DEFAULT_LABEL_SCALE = 1
const DEFAULT_BADGE_SCALE = 1
const DEFAULT_ORB_SCALE = 1
const DEFAULT_LINE_THICKNESS = 1
const DEFAULT_BACKGROUND_HUE = 214
const DEFAULT_BACKGROUND_SATURATION = 0
const DEFAULT_BACKGROUND_LIGHTNESS_DARK = 22
const DEFAULT_BACKGROUND_LIGHTNESS_LIGHT = 92

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function getNodeDiameter(count: number, width: number, height: number) {
  const shorterSide = Math.min(width, height)
  const sizeFactor = count <= 4 ? 4.6 : count <= 8 ? 5.8 : 7.3
  return clamp(Math.round(shorterSide / sizeFactor), 58, 108)
}

function parseBlockToHex(block: ColorBlock) {
  if (block.colorFormat === 'hex') {
    return block.color.toUpperCase()
  }

  if (block.colorFormat === 'rgb') {
    const rgbMatch =
      /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(
        block.color
      )

    if (!rgbMatch) {
      return '#000000'
    }

    return rgbToHex(
      Number(rgbMatch[1]),
      Number(rgbMatch[2]),
      Number(rgbMatch[3])
    )
  }

  const hslMatch =
    /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i.exec(
      block.color
    )

  if (!hslMatch) {
    return '#000000'
  }

  const rgb = hslToRGB(
    Number(hslMatch[1]),
    Number(hslMatch[2]),
    Number(hslMatch[3])
  )
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

function getInitialPosition(
  index: number,
  total: number,
  width: number,
  height: number,
  diameter: number,
  showNames: boolean,
  luminance: number
) {
  const radius = diameter / 2
  const labelAllowance = showNames ? 38 : 16
  const leftPadding = radius + 28
  const rightPadding = width - radius - 28
  const topPadding = radius + 28
  const bottomPadding = height - radius - labelAllowance - 28
  const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2
  const orbit = 0.34 + luminance * 0.22
  const x = width / 2 + Math.cos(angle) * width * orbit
  const y =
    height / 2 +
    Math.sin(angle * 1.35) * height * 0.24 +
    Math.cos(angle * 0.5) * height * 0.08

  return {
    x: clamp(x, leftPadding, rightPadding),
    y: clamp(y, topPadding, bottomPadding),
  }
}

function getRandomPosition(
  width: number,
  height: number,
  diameter: number,
  showNames: boolean
) {
  const radius = diameter / 2
  const labelAllowance = showNames ? 38 : 16

  return {
    x: clamp(
      getRandomBetween(radius + 28, width - radius - 28),
      radius + 28,
      width - radius - 28
    ),
    y: clamp(
      getRandomBetween(radius + 28, height - radius - labelAllowance - 28),
      radius + 28,
      height - radius - labelAllowance - 28
    ),
  }
}

function getParallelLineCoordinates(
  from: Position,
  to: Position,
  offset: number
) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)

  if (length === 0) {
    return [
      {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
      },
      {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
      },
    ]
  }

  const perpendicularX = (-dy / length) * offset
  const perpendicularY = (dx / length) * offset

  return [
    {
      x1: from.x + perpendicularX,
      y1: from.y + perpendicularY,
      x2: to.x + perpendicularX,
      y2: to.y + perpendicularY,
    },
    {
      x1: from.x - perpendicularX,
      y1: from.y - perpendicularY,
      x2: to.x - perpendicularX,
      y2: to.y - perpendicularY,
    },
  ]
}

export default function ContrastConstellationCanvas({
  colors,
  showNames,
  lightTheme,
  colorFormat,
  onToggleShowNames,
  onColorFormatChange,
}: ContrastConstellationCanvasProps) {
  const { t } = useLanguageContext()
  const dispatch = useAppDispatch()
  const componentRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const nodeListRef = useRef<HTMLUListElement | null>(null)
  const resizeStateRef = useRef<ResizeState | null>(null)
  const dragStateRef = useRef<DragState>({
    pointerId: null,
    nodeId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  })
  const suppressClickRef = useRef(false)
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null)
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null)
  const [pinnedNodeId, setPinnedNodeId] = useState<number | null>(null)
  const [threshold, setThreshold] = useState<(typeof THRESHOLDS)[number]>(3)
  const [canvasSize, setCanvasSize] = useLocalStorage(
    'Jenniina-constellation-canvas-size',
    DEFAULT_CANVAS_SIZE
  )
  const [canvasOffsetX, setCanvasOffsetX] = useLocalStorage(
    'Jenniina-constellation-canvas-offset-x',
    0
  )
  const [labelScale, setLabelScale] = useLocalStorage(
    'Jenniina-constellation-label-scale',
    DEFAULT_LABEL_SCALE
  )
  const [badgeScale, setBadgeScale] = useLocalStorage(
    'Jenniina-constellation-badge-scale',
    DEFAULT_BADGE_SCALE
  )
  const [lineThickness, setLineThickness] = useLocalStorage(
    'Jenniina-constellation-line-thickness',
    DEFAULT_LINE_THICKNESS
  )
  const [orbScale, setOrbScale] = useLocalStorage(
    'Jenniina-constellation-orb-scale',
    DEFAULT_ORB_SCALE
  )
  const [backgroundHue, setBackgroundHue] = useLocalStorage(
    'Jenniina-constellation-bg-hue',
    DEFAULT_BACKGROUND_HUE
  )
  const [backgroundSaturation, setBackgroundSaturation] = useLocalStorage(
    'Jenniina-constellation-bg-saturation',
    DEFAULT_BACKGROUND_SATURATION
  )
  const [backgroundLightness, setBackgroundLightness] = useLocalStorage(
    'Jenniina-constellation-bg-lightness',
    lightTheme
      ? DEFAULT_BACKGROUND_LIGHTNESS_LIGHT
      : DEFAULT_BACKGROUND_LIGHTNESS_DARK
  )
  const badgePreviewTimeoutRef = useRef<number | null>(null)
  const [previewBadges, setPreviewBadges] = useState(false)
  const [nodePositions, setNodePositions] = useState<Record<number, Position>>(
    {}
  )
  const [backgroundHex, setBackgroundHex] = useState('#204d8a')

  const colorFormatOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'hsl', label: 'HSL' },
      { value: 'rgb', label: 'RGB' },
      { value: 'hex', label: 'Hex' },
    ],
    []
  )

  const nodeDiameter = useMemo(
    () =>
      Math.round(
        getNodeDiameter(colors.length, canvasSize.width, canvasSize.height) *
          orbScale
      ),
    [canvasSize.height, canvasSize.width, colors.length, orbScale]
  )

  const clampOffsetX = useCallback((offsetX: number, nextWidth: number) => {
    const stageWidth = stageRef.current?.clientWidth ?? nextWidth
    const maxOffset = Math.max(0, stageWidth - nextWidth)
    return clamp(Math.round(offsetX), 0, maxOffset)
  }, [])

  const clampCanvasSize = useCallback(
    (size: { width: number; height: number }) => {
      const stageWidth = stageRef.current?.clientWidth ?? size.width
      const maxWidth = Math.max(MIN_CANVAS_WIDTH, stageWidth)
      const viewportHeight =
        typeof window !== 'undefined'
          ? window.innerHeight
          : DEFAULT_CANVAS_SIZE.height
      const maxHeight = Math.max(
        MIN_CANVAS_HEIGHT,
        Math.round(viewportHeight * 1.15)
      )

      return {
        width: clamp(Math.round(size.width), MIN_CANVAS_WIDTH, maxWidth),
        height: clamp(Math.round(size.height), MIN_CANVAS_HEIGHT, maxHeight),
      }
    },
    []
  )

  const clampNodePosition = useCallback(
    (x: number, y: number) => {
      const radius = nodeDiameter / 2
      const labelAllowance = showNames ? 38 : 16

      return {
        x: clamp(x, radius + 28, canvasSize.width - radius - 28),
        y: clamp(
          y,
          radius + 28,
          canvasSize.height - radius - labelAllowance - 28
        ),
      }
    },
    [canvasSize.height, canvasSize.width, nodeDiameter, showNames]
  )

  useEffect(() => {
    return () => {
      if (badgePreviewTimeoutRef.current != null) {
        window.clearTimeout(badgePreviewTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setBackgroundLightness((current) => {
      if (
        current !== DEFAULT_BACKGROUND_LIGHTNESS_DARK &&
        current !== DEFAULT_BACKGROUND_LIGHTNESS_LIGHT
      ) {
        return current
      }

      return lightTheme
        ? DEFAULT_BACKGROUND_LIGHTNESS_LIGHT
        : DEFAULT_BACKGROUND_LIGHTNESS_DARK
    })
  }, [lightTheme, setBackgroundLightness])

  useEffect(() => {
    setNodePositions((current) => {
      const nextPositions: Record<number, Position> = {}

      colors.forEach((color, index) => {
        const existing = current[color.id]
        if (existing) {
          nextPositions[color.id] = clampNodePosition(existing.x, existing.y)
          return
        }

        nextPositions[color.id] = getRandomPosition(
          canvasSize.width,
          canvasSize.height,
          nodeDiameter,
          showNames
        )
      })

      return nextPositions
    })
  }, [
    canvasSize.height,
    canvasSize.width,
    clampNodePosition,
    colors,
    nodeDiameter,
    showNames,
  ])

  useEffect(() => {
    const rgb = hslToRGB(
      backgroundHue,
      backgroundSaturation,
      backgroundLightness
    )
    setBackgroundHex(rgbToHex(rgb.r, rgb.g, rgb.b))
  }, [backgroundHue, backgroundLightness, backgroundSaturation])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncCanvasBounds = () => {
      setCanvasSize((current) => {
        const next = clampCanvasSize(current)
        return next.width === current.width && next.height === current.height
          ? current
          : next
      })

      setCanvasOffsetX((current) => {
        const next = clampOffsetX(current, canvasSize.width)
        return next === current ? current : next
      })
    }

    syncCanvasBounds()
    window.addEventListener('resize', syncCanvasBounds)

    return () => {
      window.removeEventListener('resize', syncCanvasBounds)
    }
  }, [
    canvasSize.width,
    clampCanvasSize,
    clampOffsetX,
    setCanvasOffsetX,
    setCanvasSize,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      const resizeState = resizeStateRef.current
      if (!resizeState || resizeState.pointerId !== event.pointerId) {
        return
      }

      const deltaX = event.clientX - resizeState.startX
      const deltaY = event.clientY - resizeState.startY
      const nextHeight = resizeState.startHeight + deltaY

      if (resizeState.direction === 1) {
        const nextSize = clampCanvasSize({
          width: resizeState.startWidth + deltaX,
          height: nextHeight,
        })

        setCanvasSize(nextSize)
        setCanvasOffsetX((current) => clampOffsetX(current, nextSize.width))
        return
      }

      const rightEdge = resizeState.startOffsetX + resizeState.startWidth
      const nextSize = clampCanvasSize({
        width: resizeState.startWidth - deltaX,
        height: nextHeight,
      })
      const nextOffset = clampOffsetX(
        rightEdge - nextSize.width,
        nextSize.width
      )

      setCanvasSize(nextSize)
      setCanvasOffsetX(nextOffset)
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (resizeStateRef.current?.pointerId !== event.pointerId) {
        return
      }

      resizeStateRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [clampCanvasSize, clampOffsetX, setCanvasOffsetX, setCanvasSize])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      if (componentRef.current?.contains(target)) {
        return
      }

      setHoveredNodeId(null)
      setFocusedNodeId(null)
      setPinnedNodeId(null)
    }

    document.addEventListener('pointerdown', handlePointerDownOutside)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside)
    }
  }, [])

  const nodes = useMemo<NodeData[]>(() => {
    return colors.map((color) => ({
      ...color,
      hex: parseBlockToHex(color),
      x: nodePositions[color.id]?.x ?? canvasSize.width / 2,
      y: nodePositions[color.id]?.y ?? canvasSize.height / 2,
    }))
  }, [canvasSize.height, canvasSize.width, colors, nodePositions])

  const edges = useMemo(() => {
    const nextEdges: Array<{
      from: number
      to: number
      ratio: number
      passes: boolean
      level: 'AAA' | 'AA' | 'UI' | null
    }> = []

    for (let index = 0; index < nodes.length; index++) {
      for (
        let otherIndex = index + 1;
        otherIndex < nodes.length;
        otherIndex++
      ) {
        const ratio = getContrastRatio(
          nodes[index].luminance,
          nodes[otherIndex].luminance
        )
        const level =
          ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'UI' : null

        nextEdges.push({
          from: nodes[index].id,
          to: nodes[otherIndex].id,
          ratio,
          passes: ratio >= threshold,
          level,
        })
      }
    }

    return nextEdges
  }, [nodes, threshold])

  const activeNodeId = pinnedNodeId ?? hoveredNodeId ?? focusedNodeId ?? null

  const activeEdges = useMemo(() => {
    if (activeNodeId == null) {
      return []
    }

    return edges.filter(
      (edge) =>
        edge.passes && (edge.from === activeNodeId || edge.to === activeNodeId)
    )
  }, [activeNodeId, edges])

  const activeNode = useMemo(
    () => nodes.find((node) => node.id === activeNodeId) ?? null,
    [activeNodeId, nodes]
  )

  const previewEdgesByNode = useMemo(() => {
    const previewMap = new Map<
      number,
      { level: 'AAA' | 'AA' | 'UI'; ratio: number }
    >()

    edges
      .filter((edge) => edge.passes && edge.level)
      .forEach((edge) => {
        const currentFrom = previewMap.get(edge.from)
        if (!currentFrom || edge.ratio > currentFrom.ratio) {
          previewMap.set(edge.from, {
            level: edge.level as 'AAA' | 'AA' | 'UI',
            ratio: edge.ratio,
          })
        }

        const currentTo = previewMap.get(edge.to)
        if (!currentTo || edge.ratio > currentTo.ratio) {
          previewMap.set(edge.to, {
            level: edge.level as 'AAA' | 'AA' | 'UI',
            ratio: edge.ratio,
          })
        }
      })

    return previewMap
  }, [edges])

  const lineWidths = useMemo(
    () => ({
      aaa: clamp(Number(lineThickness) - 0.2, 1, 3),
      aa: clamp(Number(lineThickness), 1, 3),
      ui: clamp(Number(lineThickness) - 0.1, 1, 3),
    }),
    [lineThickness]
  )

  const activePartnerSummaries = useMemo(() => {
    if (activeNodeId == null) {
      return []
    }

    return activeEdges
      .map((edge) => {
        const partnerId = edge.from === activeNodeId ? edge.to : edge.from
        const partner = nodes.find((node) => node.id === partnerId)
        if (!partner) {
          return null
        }

        return `${partner.color}, ${edge.level ?? t('BelowThreshold')}, ${edge.ratio.toFixed(1)} to 1`
      })
      .filter((value): value is string => Boolean(value))
  }, [activeEdges, activeNodeId, nodes, t])

  const liveRegionMessage = useMemo(() => {
    if (!activeNode) {
      return `${t('ColorConstellation')}. ${nodes.length} ${t('DraggableColors')}. ${t('CurrentThreshold')} ${threshold} to 1. ${t('FocusOrPinAColorToHearItsContrastMatches')}`
    }

    if (activePartnerSummaries.length === 0) {
      return `${activeNode.color}. ${t('NoVisibleMatchesAtTheCurrentThreshold')} ${threshold} to 1.`
    }

    return `${activeNode.color}. ${activePartnerSummaries.length} ${t('VisibleMatches')}: ${activePartnerSummaries.join('; ')}`
  }, [activeNode, activePartnerSummaries, nodes.length, t, threshold])

  const getPartnerEdge = useCallback(
    (nodeId: number) => {
      if (activeNodeId == null || nodeId === activeNodeId) {
        return null
      }

      return (
        activeEdges.find(
          (edge) =>
            (edge.from === activeNodeId && edge.to === nodeId) ||
            (edge.to === activeNodeId && edge.from === nodeId)
        ) ?? null
      )
    },
    [activeEdges, activeNodeId]
  )

  const moveNode = useCallback(
    (nodeId: number, deltaX: number, deltaY: number) => {
      setNodePositions((current) => {
        const existing = current[nodeId]
        if (!existing) {
          return current
        }

        return {
          ...current,
          [nodeId]: clampNodePosition(existing.x + deltaX, existing.y + deltaY),
        }
      })
    },
    [clampNodePosition]
  )

  const togglePinnedNode = useCallback((nodeId: number) => {
    setPinnedNodeId((current) => (current === nodeId ? null : nodeId))
  }, [])

  const handleNodeKeyDown = useCallback(
    (nodeId: number) => (event: ReactKeyboardEvent<HTMLLIElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        moveNode(nodeId, -10, 0)
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        moveNode(nodeId, 10, 0)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        moveNode(nodeId, 0, -10)
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        moveNode(nodeId, 0, 10)
        return
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        togglePinnedNode(nodeId)
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        setPinnedNodeId(null)
        setFocusedNodeId(null)
        setHoveredNodeId(null)
      }
    },
    [moveNode, togglePinnedNode]
  )

  const handlePointerDown = useCallback(
    (nodeId: number) => (event: ReactPointerEvent<HTMLLIElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }

      const existing = nodePositions[nodeId]
      if (!existing) {
        return
      }

      dragStateRef.current = {
        pointerId: event.pointerId,
        nodeId,
        startX: event.clientX,
        startY: event.clientY,
        originX: existing.x,
        originY: existing.y,
        moved: false,
      }

      suppressClickRef.current = false
      event.currentTarget.setPointerCapture?.(event.pointerId)
      event.currentTarget.focus()
      setFocusedNodeId(nodeId)
      setHoveredNodeId(nodeId)
    },
    [nodePositions]
  )

  const handlePointerMove = useCallback(
    (nodeId: number) => (event: ReactPointerEvent<HTMLLIElement>) => {
      const dragState = dragStateRef.current
      if (
        dragState.pointerId !== event.pointerId ||
        dragState.nodeId !== nodeId
      ) {
        return
      }

      const deltaX = event.clientX - dragState.startX
      const deltaY = event.clientY - dragState.startY
      if (
        !dragState.moved &&
        (Math.abs(deltaX) >= DRAG_THRESHOLD_PX ||
          Math.abs(deltaY) >= DRAG_THRESHOLD_PX)
      ) {
        dragStateRef.current.moved = true
      }

      event.preventDefault()
      setNodePositions((current) => ({
        ...current,
        [nodeId]: clampNodePosition(
          dragState.originX + deltaX,
          dragState.originY + deltaY
        ),
      }))
    },
    [clampNodePosition]
  )

  const finishDrag = useCallback((event: ReactPointerEvent<HTMLLIElement>) => {
    if (dragStateRef.current.pointerId == null) {
      return
    }

    suppressClickRef.current = dragStateRef.current.moved
    dragStateRef.current = {
      pointerId: null,
      nodeId: null,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      moved: false,
    }

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const handleResizeStart = useCallback(
    (direction: 1 | -1) => (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      resizeStateRef.current = {
        pointerId: event.pointerId,
        direction,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: canvasSize.width,
        startHeight: canvasSize.height,
        startOffsetX: canvasOffsetX,
      }
      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    [canvasOffsetX, canvasSize.height, canvasSize.width]
  )

  const buildSvg = useCallback(() => {
    const background = lightTheme ? '#f6efe6' : '#102b4b'
    const frame = lightTheme ? '#1a2029' : '#88d2ff'
    const labelColor = lightTheme ? '#1b1d1f' : '#f7f7f8'
    const radius = Math.round(nodeDiameter / 2)

    const lines = edges
      .filter((edge) => edge.passes)
      .map((edge) => {
        const from = nodePositions[edge.from]
        const to = nodePositions[edge.to]
        if (!from || !to) {
          return ''
        }

        const stroke =
          edge.level === 'AAA'
            ? '#f4d06f'
            : edge.level === 'AA'
              ? '#9be7ff'
              : '#f7a3c3'

        if (edge.level === 'AAA') {
          const [firstLine, secondLine] = getParallelLineCoordinates(
            from,
            to,
            Math.max(1.9, lineWidths.aaa * 1.35)
          )

          return `<g>
            <line x1="${firstLine.x1}" y1="${firstLine.y1}" x2="${firstLine.x2}" y2="${firstLine.y2}" stroke="${stroke}" stroke-width="${lineWidths.aaa}" stroke-linecap="round" opacity="0.88" />
            <line x1="${secondLine.x1}" y1="${secondLine.y1}" x2="${secondLine.x2}" y2="${secondLine.y2}" stroke="${stroke}" stroke-width="${lineWidths.aaa}" stroke-linecap="round" opacity="0.88" />
          </g>`
        }

        if (edge.level === 'UI') {
          return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${stroke}" stroke-width="${lineWidths.ui}" stroke-linecap="round" stroke-dasharray="1.5 7" opacity="0.85" />`
        }

        return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${stroke}" stroke-width="${lineWidths.aa}" stroke-linecap="round" opacity="0.85" />`
      })
      .join('')
    const nodeMarkup = nodes
      .map((node) => {
        const ring = node.luminance > 0.179 ? '#09131f' : '#ffffff'
        const highlight =
          node.luminance > 0.6
            ? 'rgba(255,255,255,0.35)'
            : 'rgba(255,255,255,0.22)'
        const label = showNames
          ? `<text x="${node.x}" y="${node.y + radius + 24}" font-size="${Math.round(16 * labelScale)}" font-family="Arial" text-anchor="middle" fill="${labelColor}">${escapeXml(node.color)}</text>`
          : ''

        return `<g>
          <circle cx="${node.x}" cy="${node.y}" r="${radius}" fill="${node.hex}" stroke="${ring}" stroke-width="4" />
          <circle cx="${node.x - radius * 0.28}" cy="${node.y - radius * 0.28}" r="${Math.max(8, Math.round(radius * 0.28))}" fill="${highlight}" />
          ${label}
        </g>`
      })
      .join('')

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize.width}" height="${canvasSize.height}" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}">
      <rect width="100%" height="100%" rx="26" ry="26" fill="${background}" />
      <rect x="2" y="2" width="${canvasSize.width - 4}" height="${canvasSize.height - 4}" rx="24" ry="24" fill="none" stroke="${frame}" stroke-width="4" opacity="0.45" />
      ${lines}
      ${nodeMarkup}
    </svg>`

    return {
      svgContent,
      svgWidth: canvasSize.width,
      svgHeight: canvasSize.height,
    }
  }, [
    badgeScale,
    canvasSize.height,
    canvasSize.width,
    edges,
    labelScale,
    lightTheme,
    nodeDiameter,
    nodePositions,
    nodes,
    showNames,
    lineWidths.aa,
    lineWidths.aaa,
    lineWidths.ui,
  ])

  const resetLayout = useCallback(() => {
    setCanvasSize(DEFAULT_CANVAS_SIZE)
    setCanvasOffsetX(0)
    setThreshold(3)
    setHoveredNodeId(null)
    setFocusedNodeId(null)
    setPinnedNodeId(null)
    setLabelScale(DEFAULT_LABEL_SCALE)
    setBadgeScale(DEFAULT_BADGE_SCALE)
    setLineThickness(DEFAULT_LINE_THICKNESS)
    setOrbScale(DEFAULT_ORB_SCALE)
    setBackgroundHue(DEFAULT_BACKGROUND_HUE)
    setBackgroundSaturation(DEFAULT_BACKGROUND_SATURATION)
    setBackgroundLightness(
      lightTheme
        ? DEFAULT_BACKGROUND_LIGHTNESS_LIGHT
        : DEFAULT_BACKGROUND_LIGHTNESS_DARK
    )
    setNodePositions(() => {
      const nextPositions: Record<number, Position> = {}

      colors.forEach((color, index) => {
        nextPositions[color.id] = getInitialPosition(
          index,
          colors.length,
          DEFAULT_CANVAS_SIZE.width,
          DEFAULT_CANVAS_SIZE.height,
          getNodeDiameter(
            colors.length,
            DEFAULT_CANVAS_SIZE.width,
            DEFAULT_CANVAS_SIZE.height
          ),
          showNames,
          color.luminance
        )
      })

      return nextPositions
    })
  }, [
    colors,
    lightTheme,
    setBadgeScale,
    setBackgroundHue,
    setBackgroundLightness,
    setBackgroundSaturation,
    setCanvasOffsetX,
    setCanvasSize,
    setLabelScale,
    setLineThickness,
    setOrbScale,
    showNames,
  ])

  const startBadgePreview = useCallback(() => {
    setPreviewBadges(true)

    if (badgePreviewTimeoutRef.current != null) {
      window.clearTimeout(badgePreviewTimeoutRef.current)
    }

    badgePreviewTimeoutRef.current = window.setTimeout(() => {
      setPreviewBadges(false)
      badgePreviewTimeoutRef.current = null
    }, 1400)
  }, [])

  const saveAsSVG = useCallback(() => {
    if (nodes.length < 2) {
      void dispatch(notify(t('PleaseChooseAtLeastTwoColors'), true, 5))
      return
    }

    const { svgContent } = buildSvg()
    const blob = new Blob([svgContent], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'color-constellation.svg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    void dispatch(notify(t('ArtSaved'), false, 5))
  }, [buildSvg, dispatch, nodes.length, t])

  const saveAsPNG = useCallback(() => {
    if (nodes.length < 2) {
      void dispatch(notify(t('PleaseChooseAtLeastTwoColors'), true, 5))
      return
    }

    const { svgContent, svgWidth, svgHeight } = buildSvg()
    const img = new Image()
    img.width = svgWidth
    img.height = svgHeight

    const svgBlob = new Blob([svgContent], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = svgWidth
      canvas.height = svgHeight
      const context = canvas.getContext('2d')
      context?.drawImage(img, 0, 0)

      const pngDataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = pngDataUrl
      link.download = 'color-constellation.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      void dispatch(notify(t('ArtSaved'), false, 5))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      void dispatch(notify(t('Error'), true, 4))
    }

    img.src = url
  }, [buildSvg, dispatch, nodes.length, t])

  const instructionsId = 'accessible-colors-constellation-instructions'
  const liveRegionId = 'accessible-colors-constellation-status'
  const backgroundStyleValue = `hsl(${backgroundHue} ${backgroundSaturation}% ${backgroundLightness}%)`
  const backgroundStyle = useMemo<CSSProperties>(
    () => ({
      transform: `translateX(${canvasOffsetX}px)`,
      ['--label-scale' as string]: String(labelScale),
      ['--badge-scale' as string]: String(badgeScale),
      backgroundColor: backgroundStyleValue,
    }),
    [badgeScale, backgroundStyleValue, canvasOffsetX, labelScale]
  )

  const handleBackgroundPickerChange = useCallback(
    (value: string) => {
      try {
        const rgb = hexToRGB(value)
        const hsl = rgbToHSL(rgb.r, rgb.g, rgb.b)
        setBackgroundHue(hsl.h)
        setBackgroundSaturation(hsl.s)
        setBackgroundLightness(hsl.l)
      } catch {
        // Ignore invalid values from the native color input.
      }
    },
    [setBackgroundHue, setBackgroundLightness, setBackgroundSaturation]
  )

  return (
    <section className={styles.section} ref={componentRef}>
      <div className={styles.header}>
        <h2>{t('ColorConstellation')}</h2>
        <p>{t('FocusOrPinAColorToHearItsContrastMatches')}</p>
      </div>

      <div className={styles.topControls}>
        <Select
          options={colorFormatOptions}
          value={
            {
              value: colorFormat,
              label: colorFormatOptions.find(
                (option) => option.value === colorFormat
              )?.label,
            } as SelectOption
          }
          onChange={(option) => {
            if (!option) {
              return
            }

            onColorFormatChange(option.value as ColorBlock['colorFormat'])
          }}
          id="constellation-color-format"
          instructions={t('SelectColorFormat')}
          className={styles.formatSelect}
          hideDelete
          gray
          z={2}
        />

        <button type="button" className="gray" onClick={resetLayout}>
          {t('Reset')}
        </button>
      </div>

      <div className={styles.stage} ref={stageRef}>
        <div className={styles.shell}>
          <div
            className={`${styles.canvas} ${lightTheme ? styles.light : ''}`}
            style={{
              ...backgroundStyle,
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
            }}
          >
            <svg
              className={styles.lines}
              aria-hidden="true"
              viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
              preserveAspectRatio="none"
            >
              {edges
                .filter((edge) => edge.passes)
                .map((edge) => {
                  const from = nodePositions[edge.from]
                  const to = nodePositions[edge.to]
                  if (!from || !to) {
                    return null
                  }

                  const isHighlighted =
                    activeNodeId != null &&
                    (edge.from === activeNodeId || edge.to === activeNodeId)

                  const className = `${styles.line} ${
                    edge.level === 'AAA'
                      ? styles.aaa
                      : edge.level === 'UI'
                        ? styles.ui
                        : styles.aa
                  } ${
                    activeNodeId != null && !isHighlighted ? styles.dimmed : ''
                  } ${isHighlighted ? styles.highlight : ''}`

                  if (edge.level === 'AAA') {
                    const [firstLine, secondLine] = getParallelLineCoordinates(
                      from,
                      to,
                      Math.max(1.9, lineWidths.aaa * 1.35)
                    )

                    return (
                      <g key={`${edge.from}-${edge.to}`}>
                        <line
                          x1={firstLine.x1}
                          y1={firstLine.y1}
                          x2={firstLine.x2}
                          y2={firstLine.y2}
                          className={className}
                          style={{ strokeWidth: lineWidths.aaa }}
                        />
                        <line
                          x1={secondLine.x1}
                          y1={secondLine.y1}
                          x2={secondLine.x2}
                          y2={secondLine.y2}
                          className={className}
                          style={{ strokeWidth: lineWidths.aaa }}
                        />
                      </g>
                    )
                  }

                  return (
                    <line
                      key={`${edge.from}-${edge.to}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      className={className}
                      style={{
                        strokeWidth:
                          edge.level === 'UI' ? lineWidths.ui : lineWidths.aa,
                      }}
                    />
                  )
                })}
            </svg>

            <ul
              ref={nodeListRef}
              role="listbox"
              tabIndex={0}
              aria-describedby={`${instructionsId} ${liveRegionId}`}
              aria-activedescendant={
                activeNodeId ? `constellation-node-${activeNodeId}` : undefined
              }
              className={styles.nodes}
              onMouseLeave={() => setHoveredNodeId(null)}
            >
              {nodes.map((node) => {
                const partnerEdge = getPartnerEdge(node.id)
                const previewEdge = previewEdgesByNode.get(node.id)
                const isActive = activeNodeId === node.id
                const ring = node.luminance > 0.179 ? '#0c1522' : '#ffffff'
                const visibleBadge =
                  partnerEdge ?? (previewBadges ? previewEdge : null)

                return (
                  <li
                    key={node.id}
                    id={`constellation-node-${node.id}`}
                    role="option"
                    tabIndex={0}
                    aria-selected={isActive}
                    aria-label={`${node.color}. ${partnerEdge ? `${t('ConnectedToActiveColorWith')} ${partnerEdge.level} ${t('ContrastAt')} ${partnerEdge.ratio.toFixed(1)} to 1.` : t('NoActiveContrastConnectionAnnounced')}`}
                    className={`${styles.node} ${isActive ? styles.active : ''} ${
                      pinnedNodeId === node.id ? styles.pinned : ''
                    } ${
                      activeNodeId != null && !isActive && !partnerEdge
                        ? styles.faded
                        : ''
                    }`}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${nodeDiameter}px`,
                      height: `${nodeDiameter}px`,
                      ['--orb-color' as string]: node.hex,
                      ['--orb-ring' as string]: ring,
                    }}
                    onPointerDown={handlePointerDown(node.id)}
                    onPointerMove={handlePointerMove(node.id)}
                    onPointerUp={finishDrag}
                    onPointerCancel={finishDrag}
                    onLostPointerCapture={finishDrag}
                    onClick={(event) => {
                      if (suppressClickRef.current) {
                        suppressClickRef.current = false
                        return
                      }

                      event.currentTarget.focus()
                      togglePinnedNode(node.id)
                    }}
                    onKeyDown={handleNodeKeyDown(node.id)}
                    onFocus={() => {
                      setFocusedNodeId(node.id)
                      setHoveredNodeId(node.id)
                    }}
                    onBlur={() => {
                      setFocusedNodeId((current) =>
                        current === node.id ? null : current
                      )
                      setHoveredNodeId((current) =>
                        current === node.id ? null : current
                      )
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                  >
                    <span className={styles.orb} aria-hidden="true">
                      <span className={styles.gloss} />
                    </span>
                    {visibleBadge && (
                      <span className={styles.badge} aria-hidden="true">
                        {visibleBadge.level} · {visibleBadge.ratio.toFixed(1)}:1
                      </span>
                    )}
                    {showNames && (
                      <strong className={styles.label}>{node.color}</strong>
                    )}
                  </li>
                )
              })}
            </ul>

            <button
              type="button"
              className={`${styles.handle} ${styles.leftHandle}`}
              aria-label={t('ResizeCanvasFromLeft')}
              onPointerDown={handleResizeStart(-1)}
            />
            <button
              type="button"
              className={`${styles.handle} ${styles.rightHandle}`}
              aria-label={t('ResizeCanvasFromRight')}
              onPointerDown={handleResizeStart(1)}
            />
          </div>
        </div>
      </div>

      <p id={instructionsId} className="scr">
        {t('ColorConstellationInstructions')}
      </p>
      <p
        id={liveRegionId}
        className="scr"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveRegionMessage}
      </p>

      <div className={styles.controls}>
        <div className={styles.sizeControls}>
          <label className={styles.rangeControl}>
            <span>{t('LineThickness')}</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={lineThickness}
              onChange={(event) => setLineThickness(Number(event.target.value))}
            />
          </label>
          <label className={styles.rangeControl}>
            <span>{t('OrbSize')}</span>
            <input
              type="range"
              min={0.7}
              max={1.6}
              step={0.05}
              value={orbScale}
              onChange={(event) => setOrbScale(Number(event.target.value))}
            />
          </label>
          <label className={styles.rangeControl}>
            <span>{t('ColorNameSize')}</span>
            <input
              type="range"
              min={0.7}
              max={1.8}
              step={0.05}
              value={labelScale}
              onChange={(event) => setLabelScale(Number(event.target.value))}
            />
          </label>
          <label className={styles.rangeControl}>
            <span>{t('BadgeSize')}</span>
            <input
              type="range"
              min={0.7}
              max={1.8}
              step={0.05}
              value={badgeScale}
              onChange={(event) => {
                setBadgeScale(Number(event.target.value))
                startBadgePreview()
              }}
            />
          </label>
        </div>

        <div className={styles.backgroundControls}>
          <div className={styles.backgroundPickerWrap}>
            <label
              htmlFor="constellation-background-color"
              className={styles.backgroundPickerLabel}
            >
              {t('BackgroundColor')}:
            </label>
            <input
              id="constellation-background-color"
              type="color"
              value={backgroundHex}
              onChange={(event) =>
                handleBackgroundPickerChange(event.target.value)
              }
              className={styles.backgroundColorInput}
              aria-label={t('BackgroundColor')}
            />
          </div>
          <label className={styles.rangeControl}>
            <span>{t('BackgroundHue')}</span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={backgroundHue}
              onChange={(event) => setBackgroundHue(Number(event.target.value))}
            />
          </label>
          <label className={styles.rangeControl}>
            <span>{t('BackgroundSaturation')}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={backgroundSaturation}
              onChange={(event) =>
                setBackgroundSaturation(Number(event.target.value))
              }
            />
          </label>
          <label className={styles.rangeControl}>
            <span>{t('BackgroundLightness')}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={backgroundLightness}
              onChange={(event) =>
                setBackgroundLightness(Number(event.target.value))
              }
            />
          </label>
        </div>

        <div className={styles.copyGroup}>
          {activeNode ? (
            <>
              <CopyToClipboard
                value={activeNode.hex}
                label={activeNode.hex}
                ariaLabel={`${activeNode.hex} ${t('CopyToClipboard')}`}
                className={styles.copyButton}
              />
              <CopyToClipboard
                value={activeNode.color}
                label={activeNode.color}
                ariaLabel={`${activeNode.color} ${t('CopyToClipboard')}`}
                className={styles.copyButton}
              />
            </>
          ) : (
            <>
              <span className={styles.copyPlaceholder}>
                {t('CurrentThreshold')}
              </span>
              <span className={styles.copyPlaceholder}>{threshold}:1</span>
            </>
          )}
        </div>

        <div className={styles.thresholds}>
          {THRESHOLDS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={threshold === value}
              aria-label={`${t('ShowColorLinksAtContrastAndAbove')} ${value} to 1`}
              className={`${styles.thresholdButton} ${threshold === value ? styles.thresholdActive : ''}`}
              onClick={() => setThreshold(value)}
            >
              {value}:1
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onToggleShowNames} className="gray">
            {showNames ? t('HideColorName') : t('ShowColorName')}
            <Icon lib="bi" name={showNames ? 'BiHide' : 'BiShowAlt'} />
          </button>
          <button type="button" className="gray" onClick={saveAsPNG}>
            {t('SavePNG')}
            <Icon lib="pi" name="PiDownloadSimpleFill" />
          </button>
          <button type="button" className="gray" onClick={saveAsSVG}>
            {t('SaveSVG')}
            <Icon lib="pi" name="PiDownloadSimpleFill" />
          </button>
        </div>
      </div>
    </section>
  )
}
