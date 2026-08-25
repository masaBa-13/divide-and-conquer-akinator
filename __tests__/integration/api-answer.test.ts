import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { POST } from "@/app/api/answer/route"
import { NextRequest } from "next/server"
import type { ConversationEntry } from "@/lib/types"

vi.mock("@/lib/vertex-ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/vertex-ai")>()
  return {
    ...actual,
    callGeminiStreaming: vi.fn(),
  }
})

vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(() => ({
    GEMINI_API_KEY: "test-api-key",
  })),
}))

import { callGeminiStreaming } from "@/lib/vertex-ai"

const mockCallGeminiStreaming = vi.mocked(callGeminiStreaming)

async function parseSseResult(res: Response): Promise<unknown> {
  const text = await res.text()
  const lines = text.split("\n")
  let currentEvent = ""
  for (const line of lines) {
    if (line.startsWith("event: ")) {
      currentEvent = line.slice(7).trim()
    } else if (line.startsWith("data: ")) {
      const data: unknown = JSON.parse(line.slice(6))
      if (currentEvent === "result" || currentEvent === "error") {
        return data
      }
      currentEvent = ""
    }
  }
  return null
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/answer", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

const SAMPLE_HISTORY: ConversationEntry[] = [
  {
    role: "assistant",
    question: "その課題は業務プロセスに関するものですか？",
    answerType: "yes_no",
  },
  {
    role: "user",
    answer: "はい",
  },
]

const BASE_REQUEST = {
  challenge: "チームの生産性が落ちている",
  history: SAMPLE_HISTORY,
  answer: "はい、プロセスの問題です",
  selectedFramework: "5Why",
}

describe("POST /api/answer", () => {
  beforeEach(() => {
    mockCallGeminiStreaming.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("done=falseのケース: 次の質問が返ること", async () => {
    mockCallGeminiStreaming.mockResolvedValueOnce({
      done: false,
      question: "その問題はいつ頃から発生していますか？",
      answerType: "choices",
      choices: ["1週間以内", "1ヶ月以内", "それ以上"],
    })

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("text/event-stream")
    const data = await parseSseResult(res) as { done: boolean; question: string; answerType: string; choices: string[] }
    expect(data.done).toBe(false)
    expect(data.question).toBe("その問題はいつ頃から発生していますか？")
    expect(data.answerType).toBe("choices")
    expect(data.choices).toHaveLength(3)
  })

  it("done=trueのケース: 終了フラグが返ること", async () => {
    mockCallGeminiStreaming.mockResolvedValueOnce({
      done: true,
    })

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await parseSseResult(res) as { done: boolean }
    expect(data.done).toBe(true)
  })

  it("バリデーション失敗: challenge空文字 → 400が返ること", async () => {
    const req = makeRequest({ ...BASE_REQUEST, challenge: "" })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("バリデーション失敗: answer空文字 → 400が返ること", async () => {
    const req = makeRequest({ ...BASE_REQUEST, answer: "" })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("バリデーション失敗: 不正なselectedFramework → 400が返ること", async () => {
    const req = makeRequest({ ...BASE_REQUEST, selectedFramework: "不明なフレームワーク" })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("Gemini不正JSONレスポンス → フォールバックが返ること", async () => {
    mockCallGeminiStreaming.mockResolvedValueOnce({ invalid: "data" })

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await parseSseResult(res) as { done: boolean; question: string; answerType: string }
    expect(data.done).toBe(false)
    expect(data.question).toBeDefined()
  })

  it("Geminiエラー → エラーイベントが返ること", async () => {
    mockCallGeminiStreaming.mockRejectedValueOnce(new Error("Network error"))

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await parseSseResult(res) as { message: string }
    expect(data.message).toBeDefined()
  })
})
