"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type {
  AnswerType,
  ConversationEntry,
  FrameworkName,
  Phase,
  ResultResponse,
  StartResponse,
  AnswerResponse,
} from "@/lib/types"

interface SessionState {
  challenge: string
  history: ConversationEntry[]
  currentQuestion: string | null
  currentAnswerType: AnswerType
  currentChoices: string[]
  selectedFrameworks: FrameworkName[]
  result: ResultResponse | null
  phase: Phase
  questionCount: number
  error: string | null
  setChallenge: (challenge: string) => void
  startSession: (response: StartResponse) => void
  addQA: (
    question: string,
    answerType: AnswerType,
    choices: string[],
    answer: string
  ) => void
  setNextQuestion: (response: AnswerResponse) => void
  setResult: (result: ResultResponse) => void
  setPhase: (phase: Phase) => void
  setError: (error: string) => void
  reset: () => void
}

const initialState = {
  challenge: "",
  history: [] as ConversationEntry[],
  currentQuestion: null,
  currentAnswerType: "yes_no" as AnswerType,
  currentChoices: [] as string[],
  selectedFrameworks: [] as FrameworkName[],
  result: null,
  phase: "start" as Phase,
  questionCount: 0,
  error: null,
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      setChallenge: (challenge: string) => set({ challenge }),

      startSession: (response: StartResponse) =>
        set({
          currentQuestion: response.question,
          currentAnswerType: response.answerType,
          currentChoices: response.choices ?? [],
          selectedFrameworks: response.frameworkCandidates,
          phase: "questioning",
          questionCount: 1,
          history: [],
          result: null,
          error: null,
        }),

      addQA: (
        question: string,
        answerType: AnswerType,
        choices: string[],
        answer: string
      ) =>
        set((state) => ({
          history: [
            ...state.history,
            {
              role: "assistant" as const,
              question,
              answerType,
              choices,
            },
            {
              role: "user" as const,
              answer,
            },
          ],
        })),

      setNextQuestion: (response: AnswerResponse) => {
        if (response.done) {
          set({ phase: "loading" })
        } else {
          set((state) => ({
            currentQuestion: response.question ?? null,
            currentAnswerType: response.answerType ?? "yes_no",
            currentChoices: response.choices ?? [],
            questionCount: state.questionCount + 1,
          }))
        }
      },

      setResult: (result: ResultResponse) =>
        set({ result, phase: "result" }),

      setPhase: (phase: Phase) => set({ phase }),

      setError: (error: string) => set({ error, phase: "error" }),

      reset: () => set(initialState),
    }),
    {
      name: "akinator-session",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    }
  )
)
