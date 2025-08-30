import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/404'
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
      {/* page not found */}
      <Route path="*" element={<NotFoundPage/>} />
    </Routes>
  )
}

export default App