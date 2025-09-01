import { Navigate, Route, Routes } from 'react-router-dom'
import NotFoundPage from './pages/404'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import PropertyPage from './pages/PropertyPage'
function App() {
  return (
    <Routes>
      {/* redirect route */}
      <Route path="/" element={
        <Navigate to="/home" replace={true} />
      }/>

      <Route path="/home" element={<HomePage/>} />
      <Route path="/properties" element={<PropertyPage/>} />
      <Route path="/dashboard" element={<DashboardPage/>} />

      {/* page not found */}
      <Route path="*" element={<NotFoundPage/>} />
    </Routes>
  )
}

export default App