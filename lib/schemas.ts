import { z } from "zod"

const AnswerTypeSchema = z.enum(["yes_no", "choices"])
const PrioritySchema = z.enum(["high", "medium", "low"])
const FrameworkNameSchema = z.enum([
  "5Why",
  "ロジックツリー",
  "How Tree",
  "OODAループ",
  "PDCAサイクル",
  "ジョブ理論",
])

const ConversationEntrySchema = z.object({
  role: z.enum(["assistant", "user"]),
  question: z.string().optional(),
  answerType: AnswerTypeSchema.optional(),
  choices: z.array(z.string()).optional(),
  answer: z.string().optional(),
})

export const StartRequestSchema = z.object({
  challenge: z.string().min(1),
})

export const StartResponseSchema = z.object({
  question: z.string(),
  answerType: AnswerTypeSchema,
  choices: z.array(z.string()).optional(),
  frameworkCandidates: z.array(FrameworkNameSchema).min(1).max(2),
})

export const AnswerRequestSchema = z.object({
  challenge: z.string().min(1),
  history: z.array(ConversationEntrySchema),
  answer: z.string().min(1),
  selectedFrameworks: z.array(FrameworkNameSchema).min(1).max(2),
})

export const AnswerResponseSchema = z.object({
  done: z.boolean(),
  question: z.string().optional(),
  answerType: AnswerTypeSchema.optional(),
  choices: z.array(z.string()).optional(),
})

export const ResultRequestSchema = z.object({
  challenge: z.string().min(1),
  history: z.array(ConversationEntrySchema),
  selectedFrameworks: z.array(FrameworkNameSchema).min(1).max(2),
})

const ActionSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  priority: PrioritySchema,
  estimatedTime: z.string().optional(),
})

const FrameworkInfoSchema = z.object({
  name: FrameworkNameSchema,
  description: z.string(),
  reason: z.string(),
  steps: z.array(z.string()),
})

const VisualizationNodeSchema: z.ZodType<import("./types").VisualizationNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    children: z.array(VisualizationNodeSchema).optional(),
  })
)

const VisualizationDataSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("tree"),
    root: VisualizationNodeSchema,
  }),
  z.object({
    type: z.literal("why_chain"),
    steps: z.array(z.string()),
  }),
  z.object({
    type: z.literal("cycle"),
    phases: z.array(z.object({ name: z.string(), items: z.array(z.string()) })),
  }),
  z.object({
    type: z.literal("job_theory"),
    job: z.string(),
    gains: z.array(z.string()),
    pains: z.array(z.string()),
  }),
])

const FrameworkAnalysisSchema = z.object({
  framework: FrameworkInfoSchema,
  actions: z.array(ActionSchema),
  visualization: VisualizationDataSchema.optional(),
})

export const ResultResponseSchema = z.object({
  analyses: z.array(FrameworkAnalysisSchema).min(1).max(2),
})

export const GeminiResponseSchema = z.object({
  candidates: z.array(
    z.object({
      content: z.object({
        parts: z.array(
          z.object({
            text: z.string(),
          })
        ),
        role: z.string().optional(),
      }),
      finishReason: z.string().optional(),
    })
  ),
  usageMetadata: z
    .object({
      promptTokenCount: z.number().optional(),
      candidatesTokenCount: z.number().optional(),
      totalTokenCount: z.number().optional(),
    })
    .optional(),
})
