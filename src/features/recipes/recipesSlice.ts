import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Recipe } from './types'
import { loadRecipes, saveRecipes } from '../../utils/localStorage'
import { nanoid } from 'nanoid'

type RecipesState = { items: Recipe[] }

const initialState: RecipesState = { items: loadRecipes() }

const slice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    addRecipe(state, action: PayloadAction<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>) {
      const id = nanoid()
      const now = new Date().toISOString()
      const r: Recipe = { ...action.payload, id, createdAt: now, updatedAt: now }
      state.items.push(r)
      saveRecipes(state.items)
    },
    updateRecipe(state, action: PayloadAction<Recipe>) {
      const idx = state.items.findIndex(r => r.id === action.payload.id)
      if (idx >= 0) {
        state.items[idx] = { ...action.payload, updatedAt: new Date().toISOString() }
        saveRecipes(state.items)
      }
    },
    toggleFavorite(state, action: PayloadAction<string>) {
      const r = state.items.find(r => r.id === action.payload)
      if (r) {
        r.isFavorite = !r.isFavorite
        saveRecipes(state.items)
      }
    },
    removeRecipe(state, action: PayloadAction<string>) {
      state.items = state.items.filter(r => r.id !== action.payload)
      saveRecipes(state.items)
    },
    loadFromStorage(state) {
      state.items = loadRecipes()
    }
  }
})

export const { addRecipe, updateRecipe, toggleFavorite, removeRecipe, loadFromStorage } = slice.actions
export default slice.reducer
