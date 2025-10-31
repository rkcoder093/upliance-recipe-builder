import { configureStore } from '@reduxjs/toolkit'
import recipesReducer from '../features/recipes/recipesSlice'
import sessionReducer from '../features/session/sessionSlice'

export const store = configureStore({
  reducer: {
    recipes: recipesReducer,
    session: sessionReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
