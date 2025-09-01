import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/404'
import PropertyPage from './pages/PropertyPage'
import { Sidebar } from './components/common/SidebarMenu/sidebar'
function App() {
  return (
    <Routes>
      {/* redirect route */}
      <Route path="/" element={
        <Navigate to="/home" replace={true} />
      }/>

      <Route path="/home" element={<HomePage/>} />
      <Route path="/properties" element={<PropertyPage/>} />
      <Route path="/dashboard" element={<Sidebar/>} />

      {/* page not found */}
      <Route path="*" element={<NotFoundPage/>} />
    </Routes>
  )
}

export default App