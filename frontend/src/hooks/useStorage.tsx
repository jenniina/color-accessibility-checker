import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ReturnType<T> = [T, (value: T | ((val: T) => T)) => void, () => void]

export default function useLocalStorage<T>(key: string, defaultValue: T) {
  // Check if we're in the browser before accessing window
  const storage = typeof window !== 'undefined' ? window.localStorage : null
  return useStorage(key, defaultValue, storage)
}

export function useSessionStorage<T>(key: string, defaultValue: T) {
  // Check if we're in the browser before accessing window
  const storage = typeof window !== 'undefined' ? window.sessionStorage : null
  return useStorage(key, defaultValue, storage)
}

function useStorage<T>(
  key: string,
  defaultValue: T,
  storageObject: Storage | null
): ReturnType<T> {
  // IMPORTANT for SSR + hydration:
  // - Always render with defaultValue first (server and client), so the initial
  //   HTML matches during hydration.
  // - After mount, load the stored value (if any).
  // - Skip the initial write to avoid clobbering an existing stored value.
  const [value, setValue] = useState<T>(defaultValue)
  const skipNextWriteRef = useRef(true)

  useEffect(() => {
    if (!storageObject) return

    // Prevent the write-effect from running until we've had a chance
    // to read from storage for this key.
    skipNextWriteRef.current = true

    const jsonValue = storageObject.getItem(key)
    if (jsonValue != null) {
      try {
        setValue(JSON.parse(jsonValue) as T)
        return
      } catch {
        // fall through
      }
    }

    setValue(defaultValue)
  }, [key, storageObject, defaultValue])

  useEffect(() => {
    if (!storageObject) return

    // Skip the first write after mount (and after key changes), so we
    // don't overwrite an existing stored value before it's read.
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false
      return
    }

    if (value === undefined) {
      storageObject.removeItem(key)
      return
    }

    storageObject.setItem(key, JSON.stringify(value))
  }, [key, value, storageObject])

  const remove = useCallback(() => {
    setValue(defaultValue)
    // Only remove from storage if available
    if (storageObject) {
      storageObject.removeItem(key)
    }

    // Avoid re-creating the key immediately via the write-effect.
    skipNextWriteRef.current = true
  }, [defaultValue, key, storageObject])

  const setValueWithFunction = useCallback((nextValue: T | ((val: T) => T)) => {
    if (typeof nextValue === 'function') {
      setValue((currentValue) => (nextValue as (val: T) => T)(currentValue))
    } else {
      setValue(nextValue)
    }
  }, [])

  return useMemo(
    () => [value, setValueWithFunction, remove],
    [value, setValueWithFunction, remove]
  )
}
