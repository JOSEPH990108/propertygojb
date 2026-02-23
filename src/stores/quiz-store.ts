// src\stores\quiz-store.ts
import { create } from 'zustand';

export type QuizState = {
  type: 'Landed' | 'High Rise' | 'Any' | null;
  budget: number;
  goal: 'Own Stay' | 'Investment' | null;
  rooms: number | null;
  balcony: boolean | null;
  vibe: 'Nature' | 'Shopping' | 'Quiet' | 'City' | null;
  tenant: 'Long Term' | 'Short Term' | null;
  location: 'RTS/CIQ' | 'Anywhere' | null;
};

interface QuizStore {
  // State
  step: number;
  answers: QuizState;
  status: 'idle' | 'searching' | 'completed';

  // Actions
  setAnswer: <K extends keyof QuizState>(key: K, value: QuizState[K]) => void;
  nextStep: (totalSteps: number) => void;
  prevStep: () => void;
  setStatus: (status: 'idle' | 'searching' | 'completed') => void;
  resetQuiz: () => void;
}

const INITIAL_STATE: QuizState = {
  type: null,
  budget: 1000000,
  goal: null,
  rooms: null,
  balcony: null,
  vibe: null,
  tenant: null,
  location: null,
};

export const useQuizStore = create<QuizStore>((set) => ({
  step: 0,
  answers: INITIAL_STATE,
  status: 'idle',

  setAnswer: (key, value) => 
    set((state) => ({ answers: { ...state.answers, [key]: value } })),

  nextStep: (totalSteps) => 
    set((state) => {
      if (state.step < totalSteps - 1) return { step: state.step + 1 };
      return { step: state.step }; // Don't exceed max
    }),

  prevStep: () => 
    set((state) => ({ step: Math.max(0, state.step - 1) })),

  setStatus: (status) => set({ status }),

  resetQuiz: () => set({ step: 0, answers: INITIAL_STATE, status: 'idle' }),
}));