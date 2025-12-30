import React, { useEffect, useState } from 'react'
import { usePresenceSync } from '@/hooks/usePresenceSync'
import { UserListWithPresence } from '@/components/common/UserListWithPresence'

/**
 * Test page để xem presence hoạt động
 * Hiển thị danh sách user fake và cập nhật status realtime
 */
export default function PresenceTestPage() {
  // Sync presence từ socket
  usePresenceSync()

  const [users, setUsers] = useState([
    {
      _id: '1',
      fullName: 'User One',
      avatar: 'https://via.placeholder.com/40'
    },
    {
      _id: '2',
      fullName: 'User Two',
      avatar: 'https://via.placeholder.com/40'
    },
    {
      _id: '3',
      fullName: 'User Three',
      avatar: 'https://via.placeholder.com/40'
    }
  ])

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Users with Presence</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Open this page on 2 browsers. Online status updates in real-time.
      </p>
      <UserListWithPresence users={users} />
    </div>
  )
}
