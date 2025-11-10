import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizeAxiosInstance from '@/utils/authorizeAxios'
import { API_ROOT } from '@/utils/constants'

const initialState = {
  currentUser: null,
  loading: false,
  error: null
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
  reducers: {},
  //func bat dong bo
  extraReducers: (builder) => {
    builder
      // Register - không lưu user
      .addCase(registerUserAPI.fulfilled, () => {
      })
      // Login - lưu user vào state
      .addCase(loginUserAPI.fulfilled, (state, action) => {
        state.currentUser = action.payload
      })
      // Logout - xóa user
      .addCase(logoutUserAPI.fulfilled, (state) => {
        state.currentUser = null
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

//store nay chua co du lieu dong bo nen chua can dung
export const userReducer = userSlice.reducer