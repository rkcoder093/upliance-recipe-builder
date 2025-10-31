export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
}

export interface CookingSettings {
  temperature: number
  speed: number
}

export interface RecipeStep {
  id: string
  description: string
  type: 'instruction' | 'cooking'
  durationMinutes: number
  ingredientIds?: string[]
  cookingSettings?: CookingSettings
}

export interface Recipe {
  id: string
  title: string
  difficulty: Difficulty
  cuisine?: string
  ingredients: Ingredient[]
  steps: RecipeStep[]
  isFavorite?: boolean
  createdAt?: string
  updatedAt?: string
}
