import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../app/hooks'
import { toggleFavorite, removeRecipe } from './recipesSlice'
import {
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

export default function RecipeList() {
  const recipes = useAppSelector(s => s.recipes.items)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [showFavorites, setShowFavorites] = useState('All')
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    let out = recipes.slice()
    if (difficultyFilter !== 'All') out = out.filter(r => r.difficulty === difficultyFilter)
    if (showFavorites === 'Favorites') out = out.filter(r => r.isFavorite)
    out.sort((a, b) => {
      const ta = a.steps.reduce((s, st) => s + st.durationMinutes, 0)
      const tb = b.steps.reduce((s, st) => s + st.durationMinutes, 0)
      return sortAsc ? ta - tb : tb - ta
    })
    return out
  }, [recipes, difficultyFilter, showFavorites, sortAsc])

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Recipes</Typography>
        <Stack direction="row" spacing={1}>
          <FormControl size="small">
            <InputLabel>Difficulty</InputLabel>
            <Select value={difficultyFilter} label="Difficulty" onChange={e => setDifficultyFilter(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Easy">Easy</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Hard">Hard</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Show</InputLabel>
            <Select value={showFavorites} label="Show" onChange={e => setShowFavorites(e.target.value)}>
              <MenuItem value="All">All Recipes</MenuItem>
              <MenuItem value="Favorites">Favorites</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => setSortAsc(!sortAsc)}>
            {sortAsc ? 'Time ↑' : 'Time ↓'}
          </Button>
          <Button variant="contained" onClick={() => navigate('/create')}>
            Create Recipe
          </Button>
        </Stack>
      </Stack>

      <List>
        {filtered.map(r => (
          <ListItem
            key={r.id}
            component="div"
            onClick={() => navigate(`/cook/${r.id}`)}
            sx={{ cursor: 'pointer' }}
            secondaryAction={
              <>
                <Tooltip title="Favorite">
                  <IconButton
                    onClick={e => {
                      e.stopPropagation()
                      dispatch(toggleFavorite(r.id))
                    }}
                    edge="end"
                  >
                    {r.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Edit Recipe">
                  <IconButton
                    onClick={e => {
                      e.stopPropagation()
                      navigate(`/create?edit=${r.id}`)
                    }}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete Recipe">
                  <IconButton
                    onClick={e => {
                      e.stopPropagation()
                      dispatch(removeRecipe(r.id))
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </>
            }
          >
            <ListItemText
              primary={r.title}
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={r.difficulty} size="small" />
                  <Typography variant="body2">
                    Total {r.steps.reduce((s, st) => s + st.durationMinutes, 0)} min ·{' '}
                    {r.ingredients.length} ingredients
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {filtered.length === 0 && <Typography>No recipes found</Typography>}
    </Box>
  )
}
