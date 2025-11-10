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

export const userSlice = createSlice({
  name: 'user',
  initialState,
  //func dong bo
  reducers: {
    updateUser: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload }
    }
  },
  //func bat dong bo
  extraReducers: (builder) => {
    builder.addCase(loginUserAPI.fulfilled, (state, action) => {
      state.currentUser = action.payload
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

// Export actions
export const { updateUser } = userSlice.actions

//store nay chua co du lieu dong bo nen chua can dung
export const userReducer = userSlice.reducer