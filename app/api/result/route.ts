export const runtime = "edge"

import { NextRequest, NextResponse } from "next/server"
import { callGemini } from "@/lib/vertex-ai"
import { RESULT_SYSTEM_PROMPT } from "@/lib/prompts"
import { ResultRequestSchema, ResultResponseSchema } from "@/lib/schemas"
import type { ConversationEntry } from "@/lib/types"

const RESULT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          estimatedTime: { type: "string" },
        },
        required: ["id", "title", "description", "priority"],
      },
    },
    framework: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        reason: { type: "string" },
        steps: { type: "array", items: { type: "string" } },
      },
      required: ["name", "description", "reason", "steps"],
    },
  },
  required: ["actions", "framework"],
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = ResultRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const { challenge, history, selectedFramework } = parsed.data

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

  try {
    const raw = await callGemini({
      systemInstruction: RESULT_SYSTEM_PROMPT(selectedFramework),
      contents,
      responseSchema: RESULT_RESPONSE_SCHEMA,
    })

    const validated = ResultResponseSchema.safeParse(raw)
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid response from AI" }, { status: 500 })
    }

    return NextResponse.json(validated.data)
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
