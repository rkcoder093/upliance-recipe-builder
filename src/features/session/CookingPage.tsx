import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import {
    Box,
    Button,
    Typography,
    CircularProgress,
    Stack,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    DialogContentText,
    Chip,
} from '@mui/material'


import {
    startSession,
    pauseSession,
    resumeSession,
    tickSecond,
    advanceStep,
    endSession,
    stopStep,
    clearSession,
} from './sessionSlice'

function formatSec(s: number) {
    const mm = Math.floor(s / 60)
        .toString()
        .padStart(2, '0')
    const ss = Math.floor(s % 60)
        .toString()
        .padStart(2, '0')
    return `${mm}:${ss}`
}

export default function CookingPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const recipe = useAppSelector(s => s.recipes.items.find(r => r.id === id))
    const session = useAppSelector(s => (id ? s.session.byRecipeId[id] : undefined))
    const [showSuccessDialog, setShowSuccessDialog] = useState(false)
    const [started, setStarted] = useState(false)
    const tickTimer = useRef<number | null>(null)
    const isRunning = session?.isRunning ?? false
    const stepRemainingSec = session?.stepRemainingSec ?? 0
    const currentStepIndex = session?.currentStepIndex ?? 0

    const handleStop = () => {
        if (!recipe || !session) return

        const nextIndex = session.currentStepIndex + 1
        if (nextIndex < recipe.steps.length) {
            const nextDur = recipe.steps[nextIndex].durationMinutes * 60
            dispatch(stopStep({ recipeId: recipe.id, nextStepDurationSec: nextDur }))
        } else {
            dispatch(stopStep({ recipeId: recipe.id }))
            setShowSuccessDialog(true)
        }
    }
    
    useEffect(() => {
        if (!id || !recipe || !isRunning) {
            if (tickTimer.current) {
                clearInterval(tickTimer.current)
                tickTimer.current = null
            }
            return
        }

        tickTimer.current = window.setInterval(() => {
            dispatch(tickSecond({ recipeId: id, deltaSec: 1 }))
        }, 1000)

        return () => {
            if (tickTimer.current) {
                clearInterval(tickTimer.current)
                tickTimer.current = null
            }
        }
    }, [id, recipe, isRunning, dispatch])

    
    useEffect(() => {
        if (!id || !recipe || !isRunning) return

        if (stepRemainingSec <= 0) {
            const nextIndex = currentStepIndex + 1

            if (nextIndex < recipe.steps.length) {
                const nextDur = recipe.steps[nextIndex].durationMinutes * 60
                dispatch(advanceStep({ recipeId: id, nextStepDurationSec: nextDur }))
            } else {
                dispatch(endSession(recipe.id))
                setShowSuccessDialog(true)
            }
        }
    }, [stepRemainingSec, currentStepIndex, id, recipe, isRunning, dispatch])

    if (!recipe) return <Typography>Recipe not found</Typography>
    useEffect(() => {
        if (recipe && !session && !started) {
            
            dispatch(clearSession(recipe.id))

            const total = recipe.steps.reduce((sum, s) => sum + s.durationMinutes * 60, 0)
            const first = (recipe.steps[0]?.durationMinutes ?? 0) * 60
            dispatch(
                startSession({
                    recipeId: recipe.id,
                    stepDurationSec: first,
                    overallRemainingSec: total,
                })
            )
            setStarted(true)
        }
    }, [recipe, session, started, dispatch])


    if (!session && showSuccessDialog) {
        return (
            <Dialog open={showSuccessDialog} onClose={() => { }}>
                <DialogTitle>🎉 Successfully Completed!</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Congratulations! You have successfully completed cooking {recipe.title}.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setShowSuccessDialog(false)
                            navigate('/')
                        }}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }

    if (!session) return <Typography>Preparing session...</Typography>

    const step = recipe.steps[session.currentStepIndex]
    const stepTotal = step.durationMinutes * 60
    const stepElapsed = Math.max(0, stepTotal - session.stepRemainingSec)
    const stepPercent = Math.round((stepElapsed / stepTotal) * 100)
    const totalSec = recipe.steps.reduce((sum, s) => sum + s.durationMinutes * 60, 0)
    const overallElapsed = totalSec - session.overallRemainingSec
    const overallPercent = Math.round((overallElapsed / totalSec) * 100)

    const timeline = recipe.steps.map((s, i) => {
        if (i < session.currentStepIndex) return { status: 'Completed', step: s }
        if (i === session.currentStepIndex) return { status: 'Current', step: s }
        return { status: 'Upcoming', step: s }
    })

    return (
        <Box>
            <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5">{recipe.title}</Typography>
                    <Chip label={recipe.difficulty} color="primary" />
                </Stack>

                <Stack direction="row" spacing={3} alignItems="center">
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress variant="determinate" value={stepPercent} size={100} />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography>{formatSec(session.stepRemainingSec)}</Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Typography>
                            Step {session.currentStepIndex + 1} of {recipe.steps.length}
                        </Typography>
                        <Typography>{step.description}</Typography>

                        {step.type === 'cooking' && (
                            <Stack direction="row" spacing={1} mt={1}>
                                <Chip label={`Temp: ${step.cookingSettings?.temperature}°C`} />
                                <Chip label={`Speed: ${step.cookingSettings?.speed}`} />
                            </Stack>
                        )}

                        {step.type === 'instruction' && step.ingredientIds?.length ? (
                            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                                {step.ingredientIds.map(iid => {
                                    const ing = recipe.ingredients.find(ing => ing.id === iid)
                                    return (
                                        <Chip
                                            key={iid}
                                            label={ing ? ing.name : 'Ingredient'}
                                            size="small"
                                        />
                                    )
                                })}
                            </Stack>
                        ) : null}
                    </Box>
                </Stack>

                <Stack direction="row" spacing={2}>
                    {!session.isRunning ? (
                        <Button variant="contained" onClick={() => dispatch(resumeSession(recipe.id))}>
                            Resume
                        </Button>
                    ) : (
                        <Button variant="outlined" onClick={() => dispatch(pauseSession(recipe.id))}>
                            Pause
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleStop}
                    >
                        STOP
                    </Button>
                </Stack>

                <Box>
                    <Typography variant="subtitle1" mb={1}>
                        Timeline
                    </Typography>
                    {timeline.map((t, i) => (
                        <Stack
                            key={i}
                            direction="row"
                            justifyContent="space-between"
                            sx={{
                                opacity:
                                    t.status === 'Completed'
                                        ? 0.5
                                        : t.status === 'Current'
                                            ? 1
                                            : 0.7,
                                mb: 0.5,
                            }}
                        >
                            <Typography>
                                {i + 1}. {t.step.description.slice(0, 40)}
                            </Typography>
                            <Typography>
                                {t.step.durationMinutes} min ({t.status})
                            </Typography>
                        </Stack>
                    ))}
                </Box>

                <Box>
                    <Typography>Overall Progress</Typography>
                    <LinearProgress variant="determinate" value={overallPercent} />
                    <Typography>
                        {overallPercent}% · Remaining: {formatSec(session.overallRemainingSec)}
                    </Typography>
                </Box>
            </Stack>


            <Dialog open={showSuccessDialog} onClose={() => { }}>
                <DialogTitle>🎉 Successfully Completed!</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Congratulations! You have successfully completed cooking {recipe.title}.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setShowSuccessDialog(false)
                            navigate('/')
                        }}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}