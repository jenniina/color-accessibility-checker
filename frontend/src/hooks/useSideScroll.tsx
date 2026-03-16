import { useCallback, useEffect, useMemo, useRef } from 'react'
import useLocalStorage from './useStorage'

export default function useSideScroll<T extends HTMLElement>(
  storageKey: string
) {
  const ref = useRef<T | null>(null)

  const [scrollLeft, setScrollLeft] = useLocalStorage<number>(storageKey, 0)

  const onWheel = useCallback(
    (event: WheelEvent) => {
      const element = ref.current
      if (!element) return

      const hasHorizontalOverflow = element.scrollWidth > element.clientWidth
      if (!hasHorizontalOverflow) return

      const delta = event.deltaY
      if (delta === 0) return

      const maxScrollLeft = element.scrollWidth - element.clientWidth
      const epsilon = 1

      const atLeft = element.scrollLeft <= 0 + epsilon
      const atRight = element.scrollLeft >= maxScrollLeft - epsilon

      // If we're at an edge and the wheel is trying to go further, allow page scroll
      if ((delta < 0 && atLeft) || (delta > 0 && atRight)) {
        return
      }

      event.preventDefault()
      element.scrollLeft += delta
      setScrollLeft(element.scrollLeft)
    },
    [setScrollLeft]
  )

  useEffect(() => {
    const element = ref.current
    if (!element) return

    element.scrollLeft = scrollLeft

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      element.removeEventListener('wheel', onWheel)
    }
  }, [onWheel, scrollLeft])

  return useMemo(() => ({ ref }), [])
}
