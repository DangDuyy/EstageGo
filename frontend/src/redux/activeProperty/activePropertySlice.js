import authorizeAxiosInstance from "@/utils/authorizeAxios"
import { API_ROOT } from "@/utils/constants"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

const initialState = {
  currentActiveProperty: null
}

export const fetchPropertyDetailsAPI = createAsyncThunk(
  'activeProperty/fetchPropertyDetailsAPI',
  async (propertyId) => {
    const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/${propertyId}`)
    return response.data
  }
)

export const activePropertySlice = createSlice({
  name: 'activeProperty',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchPropertyDetailsAPI.fulfilled, (state, action) => {
      state.currentActiveProperty = action.payload
    })
  }
})

export const selectCurrentActiveProperty = (state) => {
  return state.activeProperty.currentActiveProperty
}

export const activePropertyReducer = activePropertySlice.reducer