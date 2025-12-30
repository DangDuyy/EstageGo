import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectUsersStatus, updatePresenceStatus } from '@/redux/user/userSlice'
import { onPresenceUpdate, requestPresenceSnapshot } from '@/lib/socket'
import { PresenceBadge } from '@/components/common/PresenceBadge'

/**
 * UserListWithPresence
 * Example component showing user list with online/offline status
 * Can be used in conversation list, agent directory, etc.
 */
export function UserListWithPresence({ users = [] }) {
  const dispatch = useDispatch()
  const usersStatus = useSelector(selectUsersStatus)

  // Subscribe to presence updates
  useEffect(() => {
    const unsubscribe = onPresenceUpdate(({ userId, isOnline, lastActiveAt }) => {
      dispatch(updatePresenceStatus({ userId, isOnline, lastActiveAt }))
    })
    return unsubscribe
  }, [dispatch])

  // Request initial snapshot
  useEffect(() => {
    const userIds = users.map(u => u._id || u.id).filter(Boolean)
    if (userIds.length > 0) {
      requestPresenceSnapshot(userIds).then(snapshot => {
        if (Array.isArray(snapshot)) {
          snapshot.forEach(({ userId, isOnline, lastActiveAt }) => {
            if (userId) {
              dispatch(updatePresenceStatus({ userId, isOnline, lastActiveAt }))
            }
          })
        }
      })
    }
  }, [users, dispatch])

  return (
    <div className="space-y-2">
      {users.map(user => {
        const userId = String(user._id || user.id)
        const status = usersStatus[userId] || { isOnline: false, lastActiveAt: null }

        return (
          <div key={userId} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg">
            <img
              src={user.avatar || '/default-avatar.png'}
              alt={user.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm">{user.fullName}</p>
              <PresenceBadge 
                isOnline={status.isOnline} 
                lastActiveAt={status.lastActiveAt}
                className="mt-0.5"
              />
            </div>
          </div>
        )
      })}
      {users.length === 0 && (
        <div className="text-center text-muted-foreground py-4">
          No users available
        </div>
      )}
    </div>
  )
}
