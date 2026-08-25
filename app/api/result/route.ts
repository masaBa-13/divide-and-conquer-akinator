export const runtime = "edge"

import { NextRequest } from "next/server"
import { callGeminiStreaming } from "@/lib/vertex-ai"
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
    visualization: {
      type: "object",
    },
  },
  required: ["actions", "framework"],
} as const

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 })
  }

  const parsed = ResultRequestSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.format() }), { status: 400 })
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

  const encoder = new TextEncoder()
  const stream = new TransformStream<Uint8Array, Uint8Array>()
  const writer = stream.writable.getWriter()

  const send = async (event: string, data: unknown) => {
    await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
  }

  ;(async () => {
    try {
      await send("thinking", {})

      const raw = await callGeminiStreaming(
        {
          systemInstruction: RESULT_SYSTEM_PROMPT(selectedFramework),
          contents,
          responseSchema: RESULT_RESPONSE_SCHEMA,
        },
        async () => { await send("ping", {}) }
      )

      const validated = ResultResponseSchema.safeParse(raw)
      if (!validated.success) {
        await send("error", { message: "Invalid response from AI" })
        return
      }

      await send("result", validated.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await send("error", { message })
    } finally {
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
