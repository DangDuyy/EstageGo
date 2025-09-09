import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { persistStore } from 'redux-persist'
import persistReducer from 'redux-persist/es/persistReducer'
import storage from 'redux-persist/lib/storage'
import { userReducer } from './user/userSlice'
import { activePropertyReducer } from './activeProperty/activePropertySlice'

//cau hinh persist
const rootPersistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'] // must be an array
}

//combine cac reducer vao 1 bien
const reducers = combineReducers({
  user: userReducer,
  activeProperty: activePropertyReducer
})

//thuc hien persist reducer
const persistedReducer = persistReducer(rootPersistConfig, reducers)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleWare) => getDefaultMiddleWare({ serializableCheck: false })
})

export const persistor = persistStore(store)