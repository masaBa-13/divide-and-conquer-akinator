import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { POST } from "@/app/api/answer/route"
import { NextRequest } from "next/server"
import type { ConversationEntry } from "@/lib/types"

const FAKE_SERVICE_ACCOUNT = JSON.stringify({
  client_email: "test@test-project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----",
})

vi.mock("@/lib/vertex-ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/vertex-ai")>()
  return {
    ...actual,
    callGemini: vi.fn(),
  }
})

vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(() => ({
    VERTEX_AI_PROJECT_ID: "test-project",
    VERTEX_AI_LOCATION: "asia-northeast1",
    VERTEX_AI_SERVICE_ACCOUNT: FAKE_SERVICE_ACCOUNT,
  })),
}))

import { callGemini } from "@/lib/vertex-ai"

const mockCallGemini = vi.mocked(callGemini)

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
    mockCallGemini.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("done=falseのケース: 次の質問が返ること", async () => {
    mockCallGemini.mockResolvedValueOnce({
      done: false,
      question: "その問題はいつ頃から発生していますか？",
      answerType: "choices",
      choices: ["1週間以内", "1ヶ月以内", "それ以上"],
    })

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as { done: boolean; question: string; answerType: string; choices: string[] }
    expect(data.done).toBe(false)
    expect(data.question).toBe("その問題はいつ頃から発生していますか？")
    expect(data.answerType).toBe("choices")
    expect(data.choices).toHaveLength(3)
  })

  it("done=trueのケース: 終了フラグが返ること", async () => {
    mockCallGemini.mockResolvedValueOnce({
      done: true,
    })

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as { done: boolean }
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
    mockCallGemini.mockResolvedValueOnce({ invalid: "data" })

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as { done: boolean; question: string; answerType: string }
    expect(data.done).toBe(false)
    expect(data.question).toBe("具体的にどのような影響が出ていますか？")
    expect(data.answerType).toBe("yes_no")
  })

  it("Geminiエラー → フォールバックが返ること", async () => {
    mockCallGemini.mockRejectedValueOnce(new Error("Network error"))

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as { done: boolean }
    expect(data.done).toBe(false)
  })
})
