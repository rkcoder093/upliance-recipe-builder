import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../app/hooks'
import { Box, Paper, Typography, IconButton, Avatar } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import StopIcon from '@mui/icons-material/Stop'
import { pauseSession, resumeSession, endSession, tickSecond, advanceStep, clearSession } from './sessionSlice'

export default function MiniPlayer() {
  const sessionRoot = useAppSelector(s => s.session)
  const recipes = useAppSelector(s => s.recipes.items)
  const activeId = sessionRoot.activeRecipeId
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const interval = setInterval(() => {
      if (!activeId) return
      const s = sessionRoot.byRecipeId[activeId]
      if (!s?.isRunning) return

      dispatch(tickSecond({ recipeId: activeId, deltaSec: 1 }))
      const recipe = recipes.find(r => r.id === activeId)
      if (!recipe) return


      if (s.stepRemainingSec <= 1) {
        const nextIndex = s.currentStepIndex + 1
        const next = recipe.steps[nextIndex]
        if (next) {
          dispatch(
            advanceStep({
              recipeId: activeId,
              nextStepDurationSec: next.durationMinutes * 60,
            })
          )
        } else {
          dispatch(endSession(activeId))
          dispatch(clearSession(activeId))
          navigate('/', { state: { showRecipeComplete: recipe.title } })
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [activeId, dispatch, sessionRoot.byRecipeId, recipes, navigate])

  if (!activeId) return null
  if (location.pathname === `/cook/${activeId}`) return null

  const s = sessionRoot.byRecipeId[activeId]
  if (!s) return null
  const recipe = recipes.find(r => r.id === activeId)
  if (!recipe) return null

  const step = recipe.steps[s.currentStepIndex]
  const stepTotal = step.durationMinutes * 60
  const stepElapsed = Math.max(0, stepTotal - s.stepRemainingSec)
  const percent = Math.min(100, Math.round((stepElapsed / stepTotal) * 100))

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        p: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
      elevation={6}
    >
      <Avatar sx={{ width: 48, height: 48 }}>{recipe.title.slice(0, 1)}</Avatar>
      <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/cook/${activeId}`)}>
        <Typography noWrap>
          {recipe.title} · Step {s.currentStepIndex + 1} of {recipe.steps.length}
        </Typography>
        <Typography variant="caption">
          {percent}% · {Math.floor(s.stepRemainingSec / 60)}:
          {(s.stepRemainingSec % 60).toString().padStart(2, '0')}
        </Typography>
      </Box>
      <IconButton onClick={() => (s.isRunning ? dispatch(pauseSession(activeId)) : dispatch(resumeSession(activeId)))}>
        {s.isRunning ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
      <IconButton onClick={() => dispatch(endSession(activeId))}>
        <StopIcon />
      </IconButton>
    </Paper>
  )
}
