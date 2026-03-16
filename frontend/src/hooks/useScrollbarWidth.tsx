import { useEffect, useState } from 'react'
import { useIsClient } from './useSSR'

export const useScrollbarWidth = () => {
  const isClient = useIsClient()
  const [scrollbarWidth, setScrollbarWidth] = useState(0)

  useEffect(() => {
    if (!isClient) return
    if (typeof document === 'undefined') return

    const outer = document.createElement('div')
    outer.style.visibility = 'hidden'
    outer.style.overflow = 'scroll'
    outer.style.setProperty('msOverflowStyle', 'scrollbar')

    document.body.appendChild(outer)

    const inner = document.createElement('div')
    outer.appendChild(inner)

    const width = outer.offsetWidth - inner.offsetWidth
    outer.parentNode?.removeChild(outer)

    if (Number.isFinite(width)) setScrollbarWidth(width)
  }, [isClient])

  return scrollbarWidth
}
