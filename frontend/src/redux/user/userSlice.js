import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { toast } from 'react-toastify'
import authorizeAxiosInstance from '@/utils/authorizeAxios'
import { API_ROOT } from '@/utils/constants'

const initialState = {
  currentUser: null
}

export const loginUserAPI = createAsyncThunk(
  'users/loginUserAPI',
  async (data) => {
    const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/login`, data)
    return response.data
  }
)

export const logoutUserAPI = createAsyncThunk(
  'users/logoutUserAPI',
  async (showSuccessMessage = true) => {
    const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/users/logout`)
    if (showSuccessMessage)
      toast.success('Logged out successfully')
    return response.data
  }
)

export const registerUserAPI = createAsyncThunk(
  'users/registerUserAPI',
  async (data) => {
    const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/register`, data)
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
    builder.addCase(loginUserAPI.fulfilled, (state, action) => {
      state.currentUser = action.payload
    }),
    builder.addCase(registerUserAPI.fulfilled, (state, action) => {
      // tuỳ API: nếu API trả về user sau khi register thì lưu, nếu không bỏ qua
      state.currentUser = action.payload || state.currentUser
    }),
    // eslint-disable-next-line no-unused-vars
    builder.addCase(logoutUserAPI.fulfilled, (state, action) => {
      state.currentUser = null
    })
  }
})

export const selectCurrentUser = (state) => {
  return state.user.currentUser
}

//store nay chua co du lieu dong bo nen chua can dung
export const userReducer = userSlice.reducer