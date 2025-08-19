import { configureStore } from '@reduxjs/toolkit'
import authSlice from './authSlice'
import skillSlice from './skillSlice'
import chatSlice from './chatSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    skills: skillSlice,
    chat: chatSlice,
  },
})
