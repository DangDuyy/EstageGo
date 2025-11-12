import { Navigate, Route, Routes } from 'react-router-dom'
import NotFoundPage from './pages/404'
import DashboardPage from './pages/DashboardPage/DashBoard'
import Post from './pages/DashboardPage/Post/Post'
import NewPost from './pages/DashboardPage/Post/NewPost'
import Message from './pages/DashboardPage/Message'
import MyProperty from './pages/DashboardPage/MyProperty'
import Profile from './pages/DashboardPage/Profile'
import Wishlist from './pages/DashboardPage/Wishlist'
import UserProfileRedirect from './pages/DashboardPage/UserProfileRedirect'
import HomePage from './pages/HomePage'
import VerifyAccountPage from './pages/HomePage/verifyAccount'
import DashboardLayout from './layouts/DashboardLayout'
import MapPage from './pages/MapPage'
import PropertyPages from './pages/PropertyPage'
import PropertyPage from './pages/PropertyPage/_id'
import PropertiesMap from './pages/MapPage/index_v2'
import { ChatBot } from './components/common/AITrend/ChatBot'
import { MapProvider } from './components/common/GoogleMap/MapProvider'
import AgentListPage from './pages/AgentPage'
import AgentProfile from './pages/AgentPage/AgentProfile'

const API_KEY_GOOGLE_MAPS = import.meta.env.VITE_GOOGLE_MAP_API_KEY
function App() {
  return (
    <Routes>
      {/* redirect route */}
      <Route path="/" element={
        <Navigate to="/home" replace={true} />
      } />

      <Route path="/home" element={<HomePage />} />
      <Route path="/verify-account" element={<VerifyAccountPage />} />
      <Route path="/properties/:propertyId" element={<PropertyPage />} />

      <Route path="/listing/grid" element={<PropertyPages />} />
      <Route path="/listing/map" element={<PropertiesMap />} />

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

      </Route>

      {/* page not found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App