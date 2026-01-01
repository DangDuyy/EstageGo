import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/redux/user/userSlice'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'

export const SocketManager = () => {
  const currentUser = useSelector(selectCurrentUser)

  useEffect(() => {
    if (currentUser) {
      // Get access token from cookies or localStorage
      const getCookie = (name) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop().split(';').shift()
      }

      let accessToken = getCookie('accessToken')
      
      // Fallback to localStorage if cookie not available
      if (!accessToken) {
        accessToken = localStorage.getItem('accessToken')
      }
      
      // If no token anywhere, user needs to re-login
      if (!accessToken) {
        console.warn('[SocketManager] No access token found. Please login.')
        return
      }
      
      // Only connect if not already connected
      const socket = getSocket()
      
      if (!socket || !socket.connected) {
        connectSocket(accessToken, currentUser._id)
      }
    } else {
      // Disconnect socket when user logs out
      const socket = getSocket()
      if (socket?.connected) {
        disconnectSocket()
      }
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount, only on logout
      // This allows the socket to persist across route changes
    }
  }, [currentUser])

  return null
}
