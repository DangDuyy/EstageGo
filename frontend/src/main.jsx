import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store, persistor } from './redux/store.js'
import { PersistGate } from 'redux-persist/integration/react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { WishlistProvider } from './contexts/WishlistContext'
import WishlistSidebar from './components/common/Wishlist/WishlistSidebar'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename='/'>
      <Provider store={store} >
        <PersistGate loading={null} persistor={persistor}>
          <WishlistProvider>
            <App />
            <WishlistSidebar />
            <ToastContainer
              position="bottom-left"
              autoClose={3500}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </WishlistProvider>
        </PersistGate>
      </Provider>
    </BrowserRouter>
  </StrictMode>,
)
