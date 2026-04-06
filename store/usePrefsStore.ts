import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PrefsState {
  unit: 'kg' | 'lbs'
  increment: 1 | 5
  toggleUnit: () => void
  setIncrement: (val: 1 | 5) => void
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      unit: 'kg',
      increment: 5,
      toggleUnit: () =>
        set((state) => ({ unit: state.unit === 'kg' ? 'lbs' : 'kg' })),
      setIncrement: (val) => set({ increment: val }),
    }),
    { name: 'gritos-prefs' }
  )
)