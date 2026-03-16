import { useCallback, useEffect, useMemo, useState } from 'react'

export interface IClosestItem {
  offset: number
  element?: HTMLElement
}

interface Item {
  id: number
  status: string
}

export const useDragAndDrop = <T extends Item, S extends string>(
  initialState: T[],
  statuses: S[]
) => {
  const [isDragging, setIsDragging] = useState(false)
  const [updatedItems, setUpdatedItems] = useState(initialState)

  const storageKeys = useMemo(() => {
    return statuses?.map((status) => `DnD-${status}`)
  }, [statuses])

  const initializeListItemsByStatus = useCallback(() => {
    // Do NOT read localStorage synchronously during render — that causes
    // server/client initial markup mismatches. Start with server-safe values
    // (derived from initialState) and load persisted values on mount.
    return statuses?.reduce(
      (acc, status, index) => {
        acc[status] = {
          items: initialState.filter((item) => item.status === status),
          setItems: (items: T[]) => {
            if (typeof window !== 'undefined') {
              localStorage.setItem(storageKeys[index], JSON.stringify(items))
            }
            setListItemsByStatus((prev) => ({
              ...prev,
              [status]: {
                ...prev[status],
                items,
              },
            }))
          },
          removeItems: () => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(storageKeys[index])
            }
            setListItemsByStatus((prev) => ({
              ...prev,
              [status]: {
                ...prev[status],
                items: [],
              },
            }))
          },
        }
        return acc
      },
      {} as Record<
        S,
        { items: T[]; setItems: (value: T[]) => void; removeItems: () => void }
      >
    )
  }, [initialState, statuses, storageKeys])

  // Load persisted DnD lists from localStorage after mount to avoid
  // hydration mismatches.
  useEffect(() => {
    if (typeof window === 'undefined') return
    statuses.forEach((status, index) => {
      const json = localStorage.getItem(storageKeys[index])
      if (!json) return
      try {
        const parsed = JSON.parse(json) as T[]
        setListItemsByStatus((prev) => ({
          ...prev,
          [status]: {
            ...prev[status],
            items: parsed,
          },
        }))
      } catch {
        // ignore parse errors
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const deepEqual = (a: T[] | S[], b: T[] | S[]) => {
    return JSON.stringify(a) === JSON.stringify(b)
  }

  const [listItemsByStatus, setListItemsByStatus] = useState(
    initializeListItemsByStatus()
  )

  // useEffect(() => {
  //   setUpdatedItems(initialState)
  // }, [initialState])

  useEffect(() => {
    statuses.forEach((status) => {
      const existingItems = listItemsByStatus[status]?.items ?? []
      const initialStatusItems = initialState.filter(
        (item) => item.status === status
      )

      // Create a map of initial items for quick lookup by ID
      const initialItemMap = new Map(
        initialStatusItems.map((item) => [item.id, item])
      )

      // Update existing items if their content has changed
      const updatedExistingItems = existingItems
        .map((existingItem) => {
          const initialItem = initialItemMap.get(existingItem.id)
          if (
            initialItem &&
            JSON.stringify(existingItem) !== JSON.stringify(initialItem)
          ) {
            return initialItem
          }
          return existingItem
        })
        .filter((item) => initialItemMap.has(item.id))

      // Identify new items to append (present in initialState but not in existingItems)
      const existingIds = new Set(existingItems.map((item) => item.id))
      const newItems = initialStatusItems.filter(
        (item) => !existingIds.has(item.id)
      )

      // Combine updated existing items with new items
      const combinedItems = [...updatedExistingItems, ...newItems]

      // Only update if there are changes to prevent unnecessary re-renders
      if (!deepEqual(existingItems, combinedItems)) {
        listItemsByStatus[status].setItems(combinedItems)
      }
    })

    // Update local storage for each status
    statuses.forEach((status, index) => {
      const items = listItemsByStatus[status]?.items ?? []
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKeys[index], JSON.stringify(items))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState, statuses, storageKeys, deepEqual])

  // const deepEqualItem = (a: T | S, b: T | S) => {
  //   return JSON.stringify(a) === JSON.stringify(b)
  // }

  // useEffect(() => {
  //   statuses.forEach((status, index) => {
  //     const existingItems = listItemsByStatus[status]?.items ?? []
  //     const initialStatusItems = initialState.filter((item) => item.status === status)

  //     // Create a map of initial items for quick lookup by ID
  //     const initialItemMap = new Map(initialStatusItems.map((item) => [item.id, item]))

  //     // Update existing items if their content has changed
  //     const updatedExistingItems = existingItems.map((existingItem) => {
  //       const initialItem = initialItemMap.get(existingItem.id)
  //       if (initialItem && JSON.stringify(existingItem) !== JSON.stringify(initialItem)) {
  //         return initialItem
  //       }
  //       return existingItem
  //     })

  //     // Identify new items to append (present in initialState but not in existingItems)
  //     const existingIds = new Set(existingItems.map((item) => item.id))
  //     const newItems = initialStatusItems.filter((item) => !existingIds.has(item.id))

  //     // Combine updated existing items with new items
  //     const combinedItems = [...updatedExistingItems, ...newItems]

  //     // Only update if there are changes to prevent unnecessary re-renders
  //     if (!deepEqual(existingItems, combinedItems)) {
  //       listItemsByStatus[status].setItems(combinedItems)
  //     }
  //   })

  //   // Update local storage for each status
  //   statuses.forEach((status, index) => {
  //     const items = listItemsByStatus[status]?.items ?? []
  //     localStorage.setItem(storageKeys[index], JSON.stringify(items))
  //   })
  // }, [initialState, statuses, storageKeys, listItemsByStatus, deepEqual])

  useEffect(() => {
    setUpdatedItems(
      statuses.flatMap((status) => listItemsByStatus[status]?.items ?? [])
    )
  }, [listItemsByStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    statuses.forEach((status, index) => {
      const items = listItemsByStatus[status]?.items ?? []
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKeys[index], JSON.stringify(items))
      }
    })
  }, [updatedItems, statuses, storageKeys, listItemsByStatus])

  const handleUpdate = useCallback(
    (id: number, newStatus: S, target?: number) => {
      const oldStatus = Object.keys(listItemsByStatus)?.find((status) =>
        listItemsByStatus?.[status as S]?.items?.find((item) => item?.id === id)
      ) as S

      if (!oldStatus) return

      const card = listItemsByStatus?.[oldStatus]?.items?.find(
        (item) => item?.id === id
      )
      const targetIndex = listItemsByStatus?.[newStatus]?.items?.findIndex(
        (item) => item?.id === target
      )

      if (!card) return

      // Update card status
      card.status = newStatus

      // Remove card from old status list
      const oldStatusItems = listItemsByStatus?.[oldStatus]?.items?.filter(
        (item: T) => item.id !== id
      )
      listItemsByStatus?.[oldStatus]?.setItems(oldStatusItems)

      // Create a copy of the new status list
      let newStatusItems = [...listItemsByStatus?.[newStatus]?.items]

      // Remove the card from its old position in the new status list
      newStatusItems = newStatusItems.filter((item) => item.id !== card.id)

      // Insert the card at the correct position in the new status list
      newStatusItems.splice(
        targetIndex >= 0 ? targetIndex : newStatusItems.length,
        0,
        card
      )

      // Update the new status list
      listItemsByStatus?.[newStatus]?.setItems(newStatusItems)

      // Update the listItemsByStatus state
      setListItemsByStatus((prev) => ({
        ...prev,
        [oldStatus]: {
          ...prev[oldStatus],
          items: oldStatusItems,
        },
        [newStatus]: {
          ...prev[newStatus],
          items: newStatusItems,
        },
      }))

      return newStatusItems
    },
    [listItemsByStatus, setListItemsByStatus]
  )

  const handleRenameStatus = useCallback(
    (oldStatus: S, newStatus: S) => {
      if (oldStatus === newStatus) return

      const oldStatusIndex = statuses?.indexOf(oldStatus)

      if (oldStatusIndex === -1) {
        console.error(`Old status "${oldStatus}" not found in statuses array`)
        return
      }

      // Get the old and new storage keys
      const oldStorageKey = storageKeys[oldStatusIndex]
      const newStorageKey = `DnD-${newStatus}`

      // Update items' status
      const updatedItems = listItemsByStatus[oldStatus].items.map((item) => ({
        ...item,
        status: newStatus,
      }))

      // Update state
      setListItemsByStatus((prev) => ({
        ...prev,
        [oldStatus]: {
          ...prev[oldStatus],
          items: [],
        },
        [newStatus]: {
          ...prev[newStatus],
          items: updatedItems,
        },
      }))

      // Update local storage
      if (typeof window !== 'undefined') {
        localStorage.setItem(newStorageKey, JSON.stringify(updatedItems))
        localStorage.removeItem(oldStorageKey)
      }
    },
    [listItemsByStatus, storageKeys, statuses]
  )

  const handleDragging = (dragging: boolean) => setIsDragging(dragging)

  return {
    isDragging,
    listItemsByStatus,
    handleUpdate,
    handleRenameStatus,
    handleDragging,
  }
}
