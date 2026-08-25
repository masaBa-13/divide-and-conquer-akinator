export type AnswerType = "yes_no" | "choices"
export type Priority = "high" | "medium" | "low"
export type Phase = "start" | "questioning" | "loading" | "result" | "error"
export type FrameworkName = "5Why" | "ロジックツリー" | "How Tree" | "OODAループ" | "PDCAサイクル" | "ジョブ理論"
export type CharacterState = "idle" | "thinking" | "eureka"

export interface ConversationEntry {
  role: "assistant" | "user"
  question?: string
  answerType?: AnswerType
  choices?: string[]
  answer?: string
}

export interface StartRequest { challenge: string }
export interface StartResponse {
  question: string
  answerType: AnswerType
  choices?: string[]
  frameworkCandidate: FrameworkName
}

export interface AnswerRequest {
  challenge: string
  history: ConversationEntry[]
  answer: string
  selectedFramework: FrameworkName
}
export interface AnswerResponse {
  done: boolean
  question?: string
  answerType?: AnswerType
  choices?: string[]
}

export interface ResultRequest {
  challenge: string
  history: ConversationEntry[]
  selectedFramework: FrameworkName
}
export interface Action {
  id: number
  title: string
  description: string
  priority: Priority
  estimatedTime?: string
}
export interface FrameworkInfo {
  name: FrameworkName
  description: string
  reason: string
  steps: string[]
}
export interface VisualizationNode {
  id: string
  label: string
  children?: VisualizationNode[]
}

export type VisualizationData =
  | { type: "tree"; root: VisualizationNode }
  | { type: "why_chain"; steps: string[] }
  | { type: "cycle"; phases: { name: string; items: string[] }[] }
  | { type: "job_theory"; job: string; gains: string[]; pains: string[] }

export interface ResultResponse {
  actions: Action[]
  framework: FrameworkInfo
  visualization?: VisualizationData
}
