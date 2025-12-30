import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizeAxiosInstance from '@/utils/authorizeAxios'
import { API_ROOT } from '@/utils/constants'
import { connectSocket, disconnectSocket } from '@/lib/socket'

const initialState = {
  currentUser: null,
  loading: false,
  error: null,
  usersStatus: {} // userId -> { isOnline, lastActiveAt }
}

export const registerUserAPI = createAsyncThunk(
  'user/register',
  async (data) => {
    const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/register`, data)
    return response
  }
)

export const verifyUserAPI = createAsyncThunk(
  'user/verify',
  async (data) => {
    const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/users/verify`, data)
    return response.data
  }
)

export const loginUserAPI = createAsyncThunk(
  'users/loginUserAPI',
  async (data) => {
    const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/login`, data)
    return response.data
  }
)

export const loginWithGoogleAPI = createAsyncThunk(
  'users/loginWithGoogleAPI',
  async (googleToken) => {
    const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/login/google`, { googleToken })
    console.log('✅ Google Login response:', response.data)
    return response.data
  }
)

export const logoutUserAPI = createAsyncThunk(
  'users/logoutUserAPI',
  async () => {
    const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/users/logout`)
    return response.data
  }
)

export const userSlice = createSlice({
  name: 'user',
  initialState,
  //func dong bo
  reducers: {
    updateUser: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload }
    },
    updatePresenceStatus: (state, action) => {
      const { userId, isOnline, lastActiveAt } = action.payload
      if (!state.usersStatus) state.usersStatus = {}
      state.usersStatus[userId] = { isOnline, lastActiveAt }
    }
  },
  //func bat dong bo
  extraReducers: (builder) => {
    builder
      // Register - không lưu user
      .addCase(registerUserAPI.fulfilled, () => {
      })
      // Login - lưu user vào state và kết nối socket
      .addCase(loginUserAPI.fulfilled, (state, action) => {
        state.currentUser = action.payload
        
        // Save tokens to localStorage as backup (cookies might not work in some browsers)
        if (action.payload.accessToken) {
          localStorage.setItem('accessToken', action.payload.accessToken)
        }
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken)
        }
        
        // Try to get token from cookies first, fallback to localStorage
        const getCookie = (name) => {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop().split(';').shift()
        }
        
        let accessToken = getCookie('accessToken')
        if (!accessToken) {
          accessToken = localStorage.getItem('accessToken')
        }
        
        if (accessToken) {
          connectSocket(accessToken)
        }
      })
      .addCase(loginWithGoogleAPI.fulfilled, (state, action) => {
        state.currentUser = action.payload
        // Save tokens to localStorage as backup (cookies might not work in some browsers)
        if (action.payload.accessToken) {
          localStorage.setItem('accessToken', action.payload.accessToken)
        }
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken)
        }
        // Try to get token from cookies first, fallback to localStorage
        const getCookie = (name) => {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop().split(';').shift()
        }
        let accessToken = getCookie('accessToken')
        if (!accessToken) {
          accessToken = localStorage.getItem('accessToken')
        }
        if (accessToken) {
          connectSocket(accessToken)
        }
      })
      // Logout - xóa user và ngắt socket
      .addCase(logoutUserAPI.fulfilled, (state) => {
        state.currentUser = null
        
        // Clear tokens from localStorage
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        
        disconnectSocket()
      })
      // Verify - không lưu user, chỉ verify
      .addCase(verifyUserAPI.fulfilled, () => {
      })
      .addCase(verifyUserAPI.rejected, (state, action) => {
        state.error = action.error.message
      })
  }
})

export const selectCurrentUser = (state) => {
  return state.user.currentUser
}

export const selectUsersStatus = (state) => {
  return state.user.usersStatus || {}
}

// Export actions
export const { updateUser, updatePresenceStatus } = userSlice.actions

//store nay chua co du lieu dong bo nen chua can dung
export const userReducer = userSlice.reducer