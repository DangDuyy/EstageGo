import { Navigate, Route, Routes } from 'react-router-dom'
import { MapProvider } from './components/common/GoogleMap/MapProvider'
import { SocketManager } from './components/common/SocketManager'
import { useAuth } from './hooks/useAuth'
import AdminLayout from './layouts/AdminLayout'
import DashboardLayout from './layouts/DashboardLayout'
import NotFoundPage from './pages/404'
import AdminAgentRequests from './pages/AdminPage/AdminAgentRequests'
import AdminDashboard from './pages/AdminPage/AdminDashboard'
import AdminProperties from './pages/AdminPage/AdminProperties'
import AdminUsers from './pages/AdminPage/AdminUsers'
import AgentListPage from './pages/AgentPage'
import AgentProfile from './pages/AgentPage/AgentProfile'
import AISearchPage from './pages/AI/AISearchPage'
import VoiceAssistantPage from './pages/AI/VoiceAssigntantPage'
import ImageTaggingPage from './pages/AI/ImageTaggingPage'
import SemanticRecommendPage from './pages/AI/SemanticRecommendPage'
import DashboardPage from './pages/DashboardPage/DashBoard'
import Message from './pages/DashboardPage/Message'
import NewPost from './pages/DashboardPage/Post/NewPost'
import Post from './pages/DashboardPage/Post/Post'
import PricingPlans from './pages/DashboardPage/PricingPlans'
import Profile from './pages/DashboardPage/Profile'
import UserProfileRedirect from './pages/DashboardPage/UserProfileRedirect'
import Wishlist from './pages/DashboardPage/Wishlist'
import HomePage from './pages/HomePage'
import VerifyAccountPage from './pages/HomePage/verifyAccount'
import VerifyPhoneRegister from './pages/HomePage/verifyPhoneRegister'
import MapPage from './pages/MapPage'
import PropertiesMap from './pages/MapPage/index_v2'
import PropertyPages from './pages/PropertyPage'
import PropertyPage from './pages/PropertyPage/_id'
import MainLayout from './components/common/Layout/MainLayout'

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

        <Route path="/" element={<MainLayout />} >
          <Route index element={<HomePage />} />
          <Route path="properties/:propertyId" element={
            <MapProvider apiKey={API_KEY_GOOGLE_MAPS}>
              <PropertyPage />
            </MapProvider>
          } />
          <Route path="listing/grid" element={<PropertyPages />} />
        </Route>
        <Route path="/verify-account" element={<VerifyAccountPage />} />
        <Route path="/verify-phone-register" element={<VerifyPhoneRegister />} />

        <Route path="/listing/map" element={
          <MapProvider apiKey={API_KEY_GOOGLE_MAPS}>
            <PropertiesMap />
          </MapProvider>
        } />

        <Route path="/agents" element={<AgentListPage />} />
        <Route path="/agents/:agentId" element={<AgentProfile />} />

        <Route path="/ai/chatbot" element={<VoiceAssistantPage />} />
        <Route path="/ai/nl-search" element={<AISearchPage />} />
        <Route path="/ai/image-tagging" element={<ImageTaggingPage />} />
        <Route path="/ai/semantic-recommend" element={<SemanticRecommendPage />} />

        <Route path="/map" element={<MapPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UserProfileRedirect />} />
          <Route path="account" element={<Profile />} />
          <Route path="messages" element={<Message />} />
          <Route path="posts">
            <Route index element={<Post />} />
            <Route path="new" element={
              <MapProvider apiKey={API_KEY_GOOGLE_MAPS}>
                <NewPost />
              </MapProvider>
            } />
          </Route>
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