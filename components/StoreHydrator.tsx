'use client'
import { useEffect } from 'react'
import { useSessionStore } from '@/stores/session-store'

export function StoreHydrator() {
  useEffect(() => {
    useSessionStore.persist.rehydrate()
  }, [])
  return null
}
