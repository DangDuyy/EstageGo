import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { updatePresenceStatus } from '@/redux/user/userSlice'
import { onPresenceUpdate } from '@/lib/socket'

/**
 * usePresenceSync
 * Automatically sync presence updates from socket to Redux
 * Call once at app level, not per-component
 */
export function usePresenceSync() {
  const dispatch = useDispatch()

  useEffect(() => {
    const unsubscribe = onPresenceUpdate(({ userId, isOnline, lastActiveAt }) => {
      dispatch(updatePresenceStatus({ userId, isOnline, lastActiveAt }))
    })

    return unsubscribe
  }, [dispatch])
}
