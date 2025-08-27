import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages'
import NotFoundPage from './pages/404'
function App() {
  return (
    <Routes>
      {/* redirect route */}
      <Route path="/" element={
        <Navigate to="/home" replace={true} />
      }/>

      <Route path="/home" element={<HomePage/>} />
      {/* page not found */}
      <Route path="*" element={<NotFoundPage/>} />
    </Routes>
  )
}

export default App