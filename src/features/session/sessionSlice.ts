import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'


type ByRecipe = {
  currentStepIndex: number
  isRunning: boolean
  stepRemainingSec: number
  overallRemainingSec: number
  lastTickTs?: number
}

type SessionState = {
  activeRecipeId: string | null
  byRecipeId: Record<string, ByRecipe>
}

const initialState: SessionState = { activeRecipeId: null, byRecipeId: {} }

const slice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    startSession(
      state,
      action: PayloadAction<{
        recipeId: string
        stepDurationSec: number
        overallRemainingSec: number
      }>
    ) {
      const { recipeId, stepDurationSec, overallRemainingSec } = action.payload
      if (state.activeRecipeId && state.activeRecipeId !== recipeId) return
      state.activeRecipeId = recipeId
      state.byRecipeId[recipeId] = {
        currentStepIndex: 0,
        isRunning: true,
        stepRemainingSec: stepDurationSec,
        overallRemainingSec,
        lastTickTs: Date.now(),
      }
    },

    pauseSession(state, action: PayloadAction<string>) {
      const s = state.byRecipeId[action.payload]
      if (s) s.isRunning = false
    },

    resumeSession(state, action: PayloadAction<string>) {
      const s = state.byRecipeId[action.payload]
      if (s) {
        s.isRunning = true
        s.lastTickTs = Date.now()
      }
    },

    tickSecond(state, action: PayloadAction<{ recipeId: string; deltaSec: number }>) {
      const { recipeId, deltaSec } = action.payload
      const s = state.byRecipeId[recipeId]
      if (!s || !s.isRunning) return
      s.stepRemainingSec = Math.max(0, s.stepRemainingSec - deltaSec)
      s.overallRemainingSec = Math.max(0, s.overallRemainingSec - deltaSec)
      s.lastTickTs = Date.now()
    },

    advanceStep(state, action: PayloadAction<{ recipeId: string; nextStepDurationSec: number }>) {
      const { recipeId, nextStepDurationSec } = action.payload
      const s = state.byRecipeId[recipeId]
      if (!s) return
      s.currentStepIndex += 1
      s.stepRemainingSec = nextStepDurationSec
      s.lastTickTs = Date.now()
      s.isRunning = true
    },

    stopStep(
      state,
      action: PayloadAction<{
        recipeId: string
        nextStepDurationSec?: number
      }>
    ) {
      const { recipeId, nextStepDurationSec } = action.payload
      const s = state.byRecipeId[recipeId]
      if (!s) return

      const toSubtract = s.stepRemainingSec
      s.overallRemainingSec = Math.max(0, s.overallRemainingSec - toSubtract)
      if (typeof nextStepDurationSec === 'number') {
        s.currentStepIndex += 1
        s.stepRemainingSec = nextStepDurationSec
        s.lastTickTs = Date.now()
        s.isRunning = true
      } else {
        delete state.byRecipeId[recipeId]
        if (state.activeRecipeId === recipeId) state.activeRecipeId = null
      }
    },
    endSession(state, action: PayloadAction<string>) {
      const id = action.payload
      delete state.byRecipeId[id]
      if (state.activeRecipeId === id) state.activeRecipeId = null
    },
    clearSession: (state, action) => {
      const recipeId = action.payload
      delete state.byRecipeId[recipeId]
      if (state.activeRecipeId === recipeId) {
        state.activeRecipeId = null
      }
    },
  },
})

export const { startSession, pauseSession, resumeSession, tickSecond, advanceStep, stopStep, endSession, clearSession  } =
  slice.actions
export default slice.reducer
