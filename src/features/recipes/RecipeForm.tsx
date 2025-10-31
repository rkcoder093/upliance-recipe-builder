import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { addRecipe, updateRecipe } from './recipesSlice'
import { v4 as uuidv4 } from 'uuid'
import {
  Box,
  Button,
  TextField,
  Stack,
  MenuItem,
  Paper,
  Typography,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import type { Difficulty, Ingredient, RecipeStep } from './types'
import { useLocation, useNavigate } from 'react-router-dom'

export default function RecipeForm() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const recipes = useAppSelector(s => s.recipes.items)

  const params = new URLSearchParams(location.search)
  const editId = params.get('edit')
  const editingRecipe = recipes.find(r => r.id === editId)

  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [steps, setSteps] = useState<RecipeStep[]>([])

  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false })

  useEffect(() => {
    if (editingRecipe) {
      setTitle(editingRecipe.title)
      setDifficulty(editingRecipe.difficulty)
      setIngredients(editingRecipe.ingredients)
      setSteps(editingRecipe.steps)
    }
  }, [editingRecipe])

  const addIngredient = () =>
    setIngredients(prev => [
      ...prev,
      { id: uuidv4(), name: '', quantity: 1, unit: 'pcs' },
    ])

  const addStep = () =>
    setSteps(prev => [
      ...prev,
      { id: uuidv4(), description: '', type: 'instruction', durationMinutes: 1, ingredientIds: [] },
    ])

  const deleteIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id))
    setSteps(prev =>
      prev.map(s => ({
        ...s,
        ingredientIds: s.ingredientIds?.filter(i => i !== id),
      }))
    )
  }

  const deleteStep = (id: string) =>
    setSteps(prev => prev.filter(s => s.id !== id))

  const moveIngredient = (index: number, direction: 'up' | 'down') => {
    setIngredients(prev => {
      const newList = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newList.length) return prev
      const temp = newList[index]
      newList[index] = newList[targetIndex]
      newList[targetIndex] = temp
      return newList
    })
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setSteps(prev => {
      const newList = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newList.length) return prev
      const temp = newList[index]
      newList[index] = newList[targetIndex]
      newList[targetIndex] = temp
      return newList
    })
  }

  const toggleIngredientForStep = (stepId: string, ingId: string) => {
    setSteps(prev =>
      prev.map(step => {
        if (step.id !== stepId) return step
        const has = step.ingredientIds?.includes(ingId)
        return {
          ...step,
          ingredientIds: has
            ? step.ingredientIds?.filter(id => id !== ingId)
            : [...(step.ingredientIds ?? []), ingId],
        }
      })
    )
  }

  function save() {
    if (title.trim().length < 3) {
      return setSnackbar({ open: true, message: 'Title must be at least 3 characters', severity: 'error' })
    }
    if (ingredients.length < 1) {
      return setSnackbar({ open: true, message: 'Add at least one ingredient', severity: 'error' })
    }
    if (steps.length < 1) {
      return setSnackbar({ open: true, message: 'Add at least one step', severity: 'error' })
    }

    for (const s of steps) {
      if (!s.description.trim())
        return setSnackbar({ open: true, message: 'Fill all step descriptions', severity: 'error' })
      if (!Number.isInteger(s.durationMinutes) || s.durationMinutes <= 0)
        return setSnackbar({ open: true, message: 'Step duration must be > 0', severity: 'error' })
      if (s.type === 'instruction' && (!s.ingredientIds || s.ingredientIds.length === 0))
        return setSnackbar({ open: true, message: 'Instruction steps must reference ingredients', severity: 'error' })
      if (s.type === 'cooking' && !s.cookingSettings)
        return setSnackbar({ open: true, message: 'Cooking steps need settings', severity: 'error' })
      if (
        s.type === 'cooking' &&
        (s.cookingSettings!.temperature < 40 || s.cookingSettings!.temperature > 200)
      )
        return setSnackbar({ open: true, message: 'Temperature should be between 40–200°C', severity: 'error' })
    }

    if (editingRecipe) {
      dispatch(
        updateRecipe({
          ...editingRecipe,
          title,
          difficulty,
          ingredients,
          steps,
          updatedAt: new Date().toISOString(),
        })
      )
      setSnackbar({ open: true, message: 'Recipe updated successfully!', severity: 'success' })
    } else {
      dispatch(addRecipe({ title, difficulty, cuisine: undefined, ingredients, steps }))
      setSnackbar({ open: true, message: 'Recipe created successfully!', severity: 'success' })
    }

    setTimeout(() => navigate('/recipes'), 1000)
  }

  return (
    <Box>
      <Typography variant="h5">
        {editingRecipe ? 'Edit Recipe' : 'Create Recipe'}
      </Typography>
      <Stack spacing={2} mt={2}>
        <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <TextField
          select
          label="Difficulty"
          value={difficulty}
          onChange={e => setDifficulty(e.target.value as Difficulty)}
        >
          <MenuItem value="Easy">Easy</MenuItem>
          <MenuItem value="Medium">Medium</MenuItem>
          <MenuItem value="Hard">Hard</MenuItem>
        </TextField>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography>Ingredients</Typography>
              <Button size="small" onClick={addIngredient}>
                Add Ingredient
              </Button>
            </Stack>

            {ingredients.map((ing, index) => (
              <Stack
                key={ing.id}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ borderBottom: '1px solid #eee', pb: 1 }}
              >
                <TextField
                  placeholder="Name"
                  value={ing.name}
                  onChange={e => {
                    const v = e.target.value
                    setIngredients(prev => prev.map(x => (x.id === ing.id ? { ...x, name: v } : x)))
                  }}
                />
                <TextField
                  type="number"
                  label="Qty"
                  value={ing.quantity}
                  onChange={e => {
                    const v = Number(e.target.value)
                    setIngredients(prev => prev.map(x => (x.id === ing.id ? { ...x, quantity: v } : x)))
                  }}
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Unit"
                  value={ing.unit}
                  onChange={e =>
                    setIngredients(prev => prev.map(x => (x.id === ing.id ? { ...x, unit: e.target.value } : x)))
                  }
                  sx={{ width: 100 }}
                />
                <IconButton color="primary" onClick={() => moveIngredient(index, 'up')}>
                  <ArrowUpwardIcon />
                </IconButton>
                <IconButton color="primary" onClick={() => moveIngredient(index, 'down')}>
                  <ArrowDownwardIcon />
                </IconButton>
                <IconButton color="error" onClick={() => deleteIngredient(ing.id)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </Paper>

        {/* STEPS */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography>Steps</Typography>
              <Button size="small" onClick={addStep}>
                Add Step
              </Button>
            </Stack>

            {steps.map((s, index) => (
              <Stack key={s.id} spacing={1} sx={{ p: 1, border: '1px dashed #ccc', borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">Step #{index + 1}</Typography>
                  <Stack direction="row">
                    <IconButton color="primary" onClick={() => moveStep(index, 'up')}>
                      <ArrowUpwardIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => moveStep(index, 'down')}>
                      <ArrowDownwardIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => deleteStep(s.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Stack>

                <TextField
                  placeholder="Description"
                  value={s.description}
                  onChange={e =>
                    setSteps(prev => prev.map(x => (x.id === s.id ? { ...x, description: e.target.value } : x)))
                  }
                />

                <Stack direction="row" spacing={1}>
                  <TextField
                    select
                    value={s.type}
                    onChange={e =>
                      setSteps(prev =>
                        prev.map(x =>
                          x.id === s.id ? { ...x, type: e.target.value as 'cooking' | 'instruction' } : x
                        )
                      )
                    }
                    sx={{ width: 160 }}
                  >
                    <MenuItem value="instruction">Instruction</MenuItem>
                    <MenuItem value="cooking">Cooking</MenuItem>
                  </TextField>

                  <TextField
                    type="number"
                    label="Minutes"
                    value={s.durationMinutes}
                    onChange={e =>
                      setSteps(prev =>
                        prev.map(x =>
                          x.id === s.id ? { ...x, durationMinutes: Number(e.target.value) } : x
                        )
                      )
                    }
                    sx={{ width: 120 }}
                  />
                </Stack>

                {s.type === 'cooking' && (
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Temp (°C)"
                      type="number"
                      value={s.cookingSettings?.temperature ?? 80}
                      onChange={e =>
                        setSteps(prev =>
                          prev.map(x =>
                            x.id === s.id
                              ? {
                                  ...x,
                                  cookingSettings: {
                                    ...(x.cookingSettings ?? { temperature: 80, speed: 1 }),
                                    temperature: Number(e.target.value),
                                  },
                                }
                              : x
                          )
                        )
                      }
                      sx={{ width: 120 }}
                    />
                    <TextField
                      label="Speed"
                      type="number"
                      value={s.cookingSettings?.speed ?? 1}
                      onChange={e =>
                        setSteps(prev =>
                          prev.map(x =>
                            x.id === s.id
                              ? {
                                  ...x,
                                  cookingSettings: {
                                    ...(x.cookingSettings ?? { temperature: 80, speed: 1 }),
                                    speed: Number(e.target.value),
                                  },
                                }
                              : x
                          )
                        )
                      }
                      sx={{ width: 120 }}
                    />
                  </Stack>
                )}

                {s.type === 'instruction' && (
                  <Stack spacing={1}>
                    <Typography variant="body2">Select ingredients used in this step:</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {ingredients.map(ing => {
                        const checked = s.ingredientIds?.includes(ing.id) ?? false
                        return (
                          <Button
                            key={ing.id}
                            size="small"
                            variant={checked ? 'contained' : 'outlined'}
                            onClick={() => toggleIngredientForStep(s.id, ing.id)}
                          >
                            {ing.name || 'Unnamed'}
                          </Button>
                        )
                      })}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            ))}
          </Stack>
        </Paper>

        <Button variant="contained" onClick={save}>
          {editingRecipe ? 'Update Recipe' : 'Save Recipe'}
        </Button>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}