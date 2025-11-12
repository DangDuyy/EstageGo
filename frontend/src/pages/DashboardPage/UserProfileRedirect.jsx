import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/redux/user/userSlice'

export default function UserProfileRedirect() {
  const user = useSelector(selectCurrentUser)
  
  if (!user || !user._id) {
    return <Navigate to="/home" replace />
  }
  
  return <Navigate to={`/agents/${user._id}`} replace />
}
