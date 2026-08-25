export const runtime = "edge"

import { NextRequest } from "next/server"
import { callGeminiStreaming } from "@/lib/vertex-ai"
import { ANSWER_SYSTEM_PROMPT } from "@/lib/prompts"
import { AnswerRequestSchema, AnswerResponseSchema } from "@/lib/schemas"
import type { AnswerResponse, ConversationEntry } from "@/lib/types"

const FALLBACK: AnswerResponse = {
  done: false,
  question: "その課題はいつ頃から発生していますか？",
  answerType: "choices",
  choices: ["最近（1ヶ月以内）", "数ヶ月前から", "1年以上前から", "ずっと以前から"],
}

// "具体的に""どのような"等を含む質問がyes_noになっている場合にchoicesへ補正する
const CHOICES_TRIGGERS = ["具体的に", "どのような", "どれくらい", "なぜ", "どちら", "どの程度", "何が", "どのくらい"]

function fixAnswerType(res: AnswerResponse): AnswerResponse {
  if (
    !res.done &&
    res.answerType === "yes_no" &&
    res.question &&
    CHOICES_TRIGGERS.some((t) => res.question!.includes(t))
  ) {
    return {
      ...res,
      answerType: "choices",
      choices: ["はい、そうです", "どちらかというとそう", "あまりそうではない", "いいえ、違います"],
    }
  }
  return res
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 })
  }

  const parsed = AnswerRequestSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.format() }), { status: 400 })
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
        { systemInstruction: ANSWER_SYSTEM_PROMPT, contents },
        async () => { await send("ping", {}) }
      )

      const validated = AnswerResponseSchema.safeParse(raw)
      const result = validated.success ? fixAnswerType(validated.data) : FALLBACK
      await send("result", result)
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
