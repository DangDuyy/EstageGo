import { Navigate, Route, Routes } from 'react-router-dom'
import NotFoundPage from './pages/404'
import DashboardPage from './pages/DashboardPage/DashBoard'
import Post from './pages/DashboardPage/Post'
import Message from './pages/DashboardPage/Message'
import MyProperty from './pages/DashboardPage/MyProperty'
import Profile from './pages/DashboardPage/Profile'
import Wishlist from './pages/DashboardPage/Wishlist'
import HomePage from './pages/HomePage'
import PropertyPage from './pages/PropertyPage'
import DashboardLayout from './layouts/DashboardLayout'
function App() {
  return (
    <Routes>
      {/* redirect route */}
      <Route path="/" element={
        <Navigate to="/home" replace={true} />
      }/>

      <Route path="/home" element={<HomePage/>} />
      <Route path="/properties" element={<PropertyPage/>} />
      <Route path="/dashboard" element={<DashboardLayout/>}>
        <Route index element={<DashboardPage/>} />
        <Route path="users" element={<Profile/>} />
        <Route path="messages" element={<Message/>} />
        <Route path="posts" element={<Post/>} />
        <Route path="properties" element={<MyProperty/>} />
        <Route path="wishlist" element={<Wishlist/>} />
      </Route>

      {/* page not found */}
      <Route path="*" element={<NotFoundPage/>} />
    </Routes>
  )
}

export default App