import { Navigate, Route, Routes } from 'react-router-dom'
import NotFoundPage from './pages/404'
import DashboardPage from './pages/DashboardPage/DashBoard'
import Post from './pages/DashboardPage/Post/Post'
import NewPost from './pages/DashboardPage/Post/NewPost'
import Message from './pages/DashboardPage/Message'
import MyProperty from './pages/DashboardPage/MyProperty'
import Profile from './pages/DashboardPage/Profile'
import Wishlist from './pages/DashboardPage/Wishlist'
import PricingPlans from './pages/DashboardPage/PricingPlans'
import UserProfileRedirect from './pages/DashboardPage/UserProfileRedirect'
import HomePage from './pages/HomePage'
import VerifyAccountPage from './pages/HomePage/verifyAccount'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'
import MapPage from './pages/MapPage'
import PropertyPages from './pages/PropertyPage'
import PropertyPage from './pages/PropertyPage/_id'
import PropertiesMap from './pages/MapPage/index_v2'
import { ChatBot } from './components/common/AITrend/ChatBot'
import { MapProvider } from './components/common/GoogleMap/MapProvider'
import AgentListPage from './pages/AgentPage'
import AgentProfile from './pages/AgentPage/AgentProfile'
import { SocketManager } from './components/common/SocketManager'
import AdminDashboard from './pages/AdminPage/AdminDashboard'
import AdminProperties from './pages/AdminPage/AdminProperties'
import AdminAgentRequests from './pages/AdminPage/AdminAgentRequests'
import AdminUsers from './pages/AdminPage/AdminUsers'
import { useAuth } from './hooks/useAuth'

const API_KEY_GOOGLE_MAPS = import.meta.env.VITE_GOOGLE_MAP_API_KEY
function App() {
  // Fetch current user on app load
  useAuth();

  return (
    <>
      <SocketManager />
    <Routes>
      {/* redirect route */}
      <Route path="/" element={
        <Navigate to="/home" replace={true} />
      } />

      <Route path="/home" element={<HomePage />} />
      <Route path="/verify-account" element={<VerifyAccountPage />} />
      <Route path="/properties/:propertyId" element={<PropertyPage />} />

      <Route path="/listing/grid" element={<PropertyPages />} />
      <Route path="/listing/map" element={
        <MapProvider apiKey={API_KEY_GOOGLE_MAPS} libraries={["places", "geometry"]}>
          <PropertiesMap />
        </MapProvider>
      } />

      <Route path="/agents" element={<AgentListPage />} />
      <Route path="/agents/:agentId" element={<AgentProfile />} />

      <Route path="/ai/chatbot" element={<ChatBot />} />

      <Route path="/map" element={<MapPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UserProfileRedirect />} />
        <Route path="account" element={<Profile />} />
        <Route path="messages" element={<Message />} />
        <Route path="posts">
          <Route index element={<Post />} />
          <Route path="new" element={
            <MapProvider apiKey={API_KEY_GOOGLE_MAPS} libraries={["places"]}>
              <NewPost />
            </MapProvider>
          } />
        </Route>
        <Route path="properties" element={<MyProperty />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="plans" element={<PricingPlans />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="properties" element={<AdminProperties />} />
        <Route path="agent-requests" element={<AdminAgentRequests />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* page not found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  )
}

export default App