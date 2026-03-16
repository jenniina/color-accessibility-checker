import { configureStore } from '@reduxjs/toolkit'
import notificationReducer from './reducers/notificationReducer'
import userReducer from './reducers/usersReducer'
import authReducer from './reducers/authReducer'

export const createAppStore = () =>
  configureStore({
    reducer: {
      users: userReducer,
      auth: authReducer,
      notification: notificationReducer,
    },
  })

export type AppStore = ReturnType<typeof createAppStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
