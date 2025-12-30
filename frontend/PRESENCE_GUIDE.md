# Presence Status Integration Guide

## Overview
EstageGo now has realtime user online/offline status display, ported from konnect backend logic.

## Architecture

### Backend
- **Socket Handlers** (`src/sockets/presence.js`): Tracks user connections, broadcasts `presence:update` events
- **User Model**: `isOnline` (boolean), `lastActiveAt` (Date)
- **Service** (`userService.markUserStatus()`): Updates DB when user goes online/offline
- **API**: User endpoints return `isOnline` + `lastActiveAt` in response

### Frontend
- **Redux Slice**: `user.usersStatus` stores `{ userId: { isOnline, lastActiveAt } }`
- **Socket Helpers** (`lib/socket.js`):
  - `onPresenceUpdate(handler)` - Subscribe to realtime updates
  - `requestPresenceSnapshot(userIds)` - Get initial status batch
  - `focusConversation(conversationId)` / `blurConversation()` - Track viewing
- **Hooks**:
  - `usePresenceText()` - Convert status to UI text ("Online", "Away", "5 minutes ago")
  - `usePresenceSync()` - Auto-sync all updates to Redux
  - `usePresenceSnapshot()` - Fetch initial snapshot for user list
- **Components**:
  - `<PresenceBadge />` - Display status with colored dot + text
  - `<UserListWithPresence />` - Example: show multiple users with status

## Quick Start

### 1. Add Presence Sync at App Level
```jsx
// App.jsx or layout wrapper
import { usePresenceSync } from '@/hooks/usePresenceSync'

export default function App() {
  // Subscribe to all presence updates automatically
  usePresenceSync()

  return <YourAppContent />
}
```

### 2. Show User Status in Chat Header
```jsx
import { useSelector } from 'react-redux'
import { selectUsersStatus } from '@/redux/user/userSlice'
import { PresenceBadge } from '@/components/common/PresenceBadge'
import { pickPeerStatus } from '@/utils/formatters'

export function ChatHeader({ conversation }) {
  const usersStatus = useSelector(selectUsersStatus)
  const peerStatus = pickPeerStatus(conversation, usersStatus)

  return (
    <div>
      <h2>{conversation.direct?.otherUser?.fullName}</h2>
      <PresenceBadge 
        isOnline={peerStatus.isOnline}
        lastActiveAt={peerStatus.lastActiveAt}
      />
    </div>
  )
}
```

### 3. Show Multiple Users (e.g., Agent Directory)
```jsx
import { UserListWithPresence } from '@/components/common/UserListWithPresence'

export function AgentList({ agents }) {
  return <UserListWithPresence users={agents} />
}
```

### 4. Get Initial Status Snapshot
```jsx
import { usePresenceSnapshot } from '@/hooks/usePresenceSnapshot'
import { useSelector } from 'react-redux'
import { selectUsersStatus } from '@/redux/user/userSlice'

export function AgentProfile({ agentId }) {
  // Fetch initial presence snapshot
  usePresenceSnapshot([agentId])
  
  const usersStatus = useSelector(selectUsersStatus)
  const agentStatus = usersStatus[agentId]

  return <div>Agent is {agentStatus?.isOnline ? 'Online' : 'Offline'}</div>
}
```

## Display Options

### Option 1: Just Text
```jsx
import { usePresenceText } from '@/hooks/usePresenceText'

function UserStatus({ isOnline, lastActiveAt }) {
  const text = usePresenceText({ isOnline, lastActiveAt })
  return <span>{text}</span>
}
```
Output: "Online", "Away", "Offline", "Online 5 minutes ago"

### Option 2: Text + Colored Indicator
```jsx
<PresenceBadge isOnline={true} lastActiveAt={null} />
```
Output: Green dot + "Online"

### Option 3: Full User Card
```jsx
<UserListWithPresence users={agentList} />
```

## Socket Events

### Subscribe to Updates
```javascript
import { onPresenceUpdate } from '@/lib/socket'

const unsubscribe = onPresenceUpdate(({ userId, isOnline, lastActiveAt }) => {
  console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`)
})

// Cleanup
return unsubscribe
```

### Get Snapshot
```javascript
import { requestPresenceSnapshot } from '@/lib/socket'

const snapshot = await requestPresenceSnapshot([userId1, userId2])
// snapshot: [{ userId, isOnline, lastActiveAt }, ...]
```

### Focus/Blur (for typing indicators)
```javascript
import { focusConversation, blurConversation } from '@/lib/socket'

// User enters chat
focusConversation(conversationId)

// User leaves/navigates away
blurConversation(conversationId)
```

## Backend Socket Events

### Client → Server
- `user:join` - Join user:roomId
- `presence:heartbeat` - Keep-alive signal
- `presence:snapshot` - Request status of multiple users
- `conversation:focus` - Mark viewing conversation
- `conversation:blur` - Stop viewing conversation
- `user:logout` - Force offline

### Server → Client
- `presence:update` - Broadcast when user goes online/offline
  ```json
  {
    "userId": "...",
    "isOnline": true,
    "lastActiveAt": "2025-12-30T10:00:00Z"
  }
  ```
- `presence:snapshot` - Response to snapshot request
  ```json
  [
    { "userId": "...", "isOnline": true, "lastActiveAt": "..." },
    { "userId": "...", "isOnline": false, "lastActiveAt": "..." }
  ]
  ```

## Database Fields

User model now includes:
```javascript
{
  isOnline: { type: Boolean, default: false },
  lastActiveAt: { type: Date, default: null }
}
```

## Testing

### Run Backend
```bash
cd backend
npm run dev
```

### Run Frontend
```bash
cd frontend
npm run dev
```

### Test Presence
1. Open browser window 1 → Login as User A
2. Open browser window 2 → Login as User B
3. Visit Message/Chat page or `/presence-test`
4. Both users should show as "Online"
5. Close one browser → Other browser should show "Online" then update to "Away" / "Offline"

## Formatting Functions

### formatTimeAgo(isoString)
Convert timestamp to relative text:
```javascript
formatTimeAgo('2025-12-30T10:00:00Z') // "Just now"
formatTimeAgo('2025-12-30T09:55:00Z') // "5 minutes"
formatTimeAgo('2025-12-30T08:00:00Z') // "2 hours"
```

### extractId(obj)
Extract ID from user object (handles `_id`, `id`, etc.):
```javascript
extractId(user) // Returns user._id or user.id
```

### pickPeerStatus(conversation, usersStatus)
Get peer's status from conversation + store:
```javascript
const { isOnline, lastActiveAt } = pickPeerStatus(conv, usersStatus)
```

## Next Steps

1. Integrate `<PresenceBadge />` into chat headers
2. Add `usePresenceSync()` to App wrapper
3. Use `<UserListWithPresence />` in agent directory
4. Customize styling via Tailwind classes
