import { configureStore } from '@reduxjs/toolkit'
import authSlice from './authSlice'
import skillSlice from './skillSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    skills: skillSlice,
  },
})
