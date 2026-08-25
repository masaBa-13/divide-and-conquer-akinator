export const runtime = "edge"

import { NextRequest, NextResponse } from "next/server"
import { callGemini } from "@/lib/vertex-ai"
import { ANSWER_SYSTEM_PROMPT } from "@/lib/prompts"
import { AnswerRequestSchema, AnswerResponseSchema } from "@/lib/schemas"
import type { AnswerResponse, ConversationEntry } from "@/lib/types"

const FALLBACK: AnswerResponse = {
  done: false,
  question: "具体的にどのような影響が出ていますか？",
  answerType: "yes_no",
}

const ANSWER_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    done: { type: "boolean" },
    question: { type: "string" },
    answerType: { type: "string", enum: ["yes_no", "choices"] },
    choices: { type: "array", items: { type: "string" } },
  },
  required: ["done"],
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = AnswerRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const { challenge, history, answer } = parsed.data

  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [
    { role: "user", parts: [{ text: challenge }] },
  ]

  for (const entry of history as ConversationEntry[]) {
    if (entry.role === "assistant" && entry.question) {
      contents.push({ role: "model", parts: [{ text: entry.question }] })
    } else if (entry.role === "user" && entry.answer) {
      contents.push({ role: "user", parts: [{ text: entry.answer }] })
    }
  }

  contents.push({ role: "user", parts: [{ text: answer }] })

  try {
    const raw = await callGemini({
      systemInstruction: ANSWER_SYSTEM_PROMPT,
      contents,
      responseSchema: ANSWER_RESPONSE_SCHEMA,
    })

    const validated = AnswerResponseSchema.safeParse(raw)
    if (!validated.success) {
      return NextResponse.json(FALLBACK)
    }

    return NextResponse.json(validated.data)
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
