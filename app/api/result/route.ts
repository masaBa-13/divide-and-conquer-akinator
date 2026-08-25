export const runtime = "edge"

import { NextRequest } from "next/server"
import { callGeminiStreaming } from "@/lib/vertex-ai"
import { RESULT_SYSTEM_PROMPT } from "@/lib/prompts"
import { ResultRequestSchema, ResultResponseSchema, VisualizationDataSchema } from "@/lib/schemas"
import type { ConversationEntry } from "@/lib/types"

function sanitizeAnalyses(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || !("analyses" in raw)) return raw
  const r = raw as { analyses: unknown[] }
  if (!Array.isArray(r.analyses)) return raw
  return {
    ...r,
    analyses: r.analyses.map((a) => {
      if (!a || typeof a !== "object") return a
      const analysis = a as Record<string, unknown>
      const vizResult = VisualizationDataSchema.safeParse(analysis.visualization)
      return { ...analysis, visualization: vizResult.success ? vizResult.data : undefined }
    }),
  }
}

const RESULT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    analyses: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      items: {
        type: "object",
        properties: {
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
          visualization: {
            type: "object",
          },
        },
        required: ["framework", "actions"],
      },
    },
  },
  required: ["analyses"],
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

  const { challenge, history, selectedFrameworks } = parsed.data

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
          systemInstruction: RESULT_SYSTEM_PROMPT(selectedFrameworks),
          contents,
          responseSchema: RESULT_RESPONSE_SCHEMA,
        },
        async () => { await send("ping", {}) }
      )

      const validated = ResultResponseSchema.safeParse(sanitizeAnalyses(raw))
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
