export const runtime = "edge"

import { NextRequest, NextResponse } from "next/server"
import { callGemini } from "@/lib/vertex-ai"
import { START_SYSTEM_PROMPT } from "@/lib/prompts"
import { StartRequestSchema, StartResponseSchema } from "@/lib/schemas"
import type { StartResponse } from "@/lib/types"

const FALLBACK: StartResponse = {
  question: "その課題は技術的な問題ですか？",
  answerType: "yes_no",
  frameworkCandidate: "ロジックツリー",
}

const START_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    question: { type: "string" },
    answerType: { type: "string", enum: ["yes_no", "choices"] },
    choices: { type: "array", items: { type: "string" } },
    frameworkCandidate: {
      type: "string",
      enum: ["5Why", "ロジックツリー", "How Tree", "OODAループ", "PDCAサイクル", "ジョブ理論"],
    },
  },
  required: ["question", "answerType", "frameworkCandidate"],
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = StartRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const { challenge } = parsed.data

  try {
    const raw = await callGemini({
      systemInstruction: START_SYSTEM_PROMPT,
      contents: [{ role: "user", parts: [{ text: challenge }] }],
      responseSchema: START_RESPONSE_SCHEMA,
    })

    const validated = StartResponseSchema.safeParse(raw)
    if (!validated.success) {
      return NextResponse.json(FALLBACK)
    }

    return NextResponse.json(validated.data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[/api/start] error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
