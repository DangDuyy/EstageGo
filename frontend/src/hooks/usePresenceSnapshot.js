import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { updatePresenceStatus } from '@/redux/user/userSlice'
import { requestPresenceSnapshot } from '@/lib/socket'

/**
 * usePresenceSnapshot
 * Request initial presence snapshot for a list of user IDs
 * @param {string[]} userIds - List of user IDs to fetch presence for
 */
export function usePresenceSnapshot(userIds = []) {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!userIds || userIds.length === 0) return

    requestPresenceSnapshot(userIds).then(snapshot => {
      if (Array.isArray(snapshot)) {
        snapshot.forEach(({ userId, isOnline, lastActiveAt }) => {
          if (userId) {
            dispatch(updatePresenceStatus({ userId, isOnline, lastActiveAt }))
          }
        })
      }
    })
  }, [userIds, dispatch])
}
