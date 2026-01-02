import authorizeAxiosInstance from "@/utils/authorizeAxios"
import { API_ROOT } from "@/utils/constants"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

const initialState = {
  currentActiveProperty: null,
  status: 'idle',
  error: null
}

export const fetchPropertyDetailsAPI = createAsyncThunk(
  'activeProperty/fetchPropertyDetailsAPI',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/${propertyId}`)
      return response.data
    } catch (error) {
      const status = error?.response?.status
      const message = error?.response?.data?.message || 'Failed to fetch property details'
      return rejectWithValue({ status, message })
    }
  }
)

export const activePropertySlice = createSlice({
  name: 'activeProperty',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPropertyDetailsAPI.pending, (state) => {
        state.status = 'loading'
        state.error = null
        state.currentActiveProperty = null
      })
      .addCase(fetchPropertyDetailsAPI.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.error = null
        state.currentActiveProperty = action.payload
      })
      .addCase(fetchPropertyDetailsAPI.rejected, (state, action) => {
        state.status = 'failed'
        state.currentActiveProperty = null
        state.error = action.payload?.message || action.error?.message || 'Failed to fetch property details'
      })
  }
})

export const selectCurrentActiveProperty = (state) => {
  return state.activeProperty.currentActiveProperty
}

export const selectActivePropertyStatus = (state) => state.activeProperty.status
export const selectActivePropertyError = (state) => state.activeProperty.error

export const activePropertyReducer = activePropertySlice.reducer