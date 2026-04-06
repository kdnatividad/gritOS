import { create } from 'zustand'

export interface SetEntry {
  id: string
  exerciseId: string
  exerciseName: string
  reps: number
  weight: number
  unit: 'kg' | 'lbs'
  setNumber: number
  notes: string
}

interface WorkoutState {
  sessionId: string | null
  sets: SetEntry[]
  isActive: boolean
  startSession: (sessionId: string) => void
  addSet: (set: SetEntry) => void
  removeSet: (id: string) => void
  updateSet: (id: string, updates: Partial<SetEntry>) => void
  endSession: () => void
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  sessionId: null,
  sets: [],
  isActive: false,
  startSession: (sessionId) => set({ sessionId, isActive: true, sets: [] }),
  addSet: (newSet) => set((state) => ({ sets: [...state.sets, newSet] })),
  removeSet: (id) =>
    set((state) => ({ sets: state.sets.filter((s) => s.id !== id) })),
  updateSet: (id, updates) =>
    set((state) => ({
      sets: state.sets.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  endSession: () => set({ sessionId: null, sets: [], isActive: false }),
}))
