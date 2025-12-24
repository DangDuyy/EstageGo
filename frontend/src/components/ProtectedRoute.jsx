import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/redux/user/userSlice';

/**
 * ProtectedRoute component - wraps routes that require authentication
 * If user is not logged in, redirects to home page
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const currentUser = useSelector(selectCurrentUser);
  const isLoggedIn = Boolean(currentUser?._id);
  const isAdmin = currentUser?.role === 'admin';

  // If not logged in, redirect to home
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // If admin-only route and user is not admin, redirect to home
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
