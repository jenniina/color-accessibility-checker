import { useEffect, useState } from 'react'

export function useIsClient() {
  // SSR/hydration-safe: always start false, flip true after mount.
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

export function useWindow() {
  // SSR/hydration-safe: always start null, set after mount.
  const [windowObj, setWindowObj] = useState<Window | null>(null)

  useEffect(() => {
    setWindowObj(typeof window !== 'undefined' ? window : null)
  }, [])

  return windowObj
}
