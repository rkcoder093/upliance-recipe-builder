import type { Recipe } from '../features/recipes/types'

const KEY = 'recipes:v1'

export function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (e) {
    console.warn('Failed to load recipes', e)
    return []
  }
}

export function saveRecipes(items: Recipe[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch (e) {
    console.warn('Failed to save recipes', e)
  }
}
