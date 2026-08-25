import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { POST } from "@/app/api/result/route"
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
  return new NextRequest("http://localhost/api/result", {
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
  {
    role: "assistant",
    question: "その問題はいつ頃から発生していますか？",
    answerType: "choices",
    choices: ["1週間以内", "1ヶ月以内", "それ以上"],
  },
  {
    role: "user",
    answer: "1ヶ月以内",
  },
]

const BASE_REQUEST = {
  challenge: "チームの生産性が落ちている",
  history: SAMPLE_HISTORY,
  selectedFrameworks: ["5Why"],
}

const VALID_GEMINI_RESPONSE = {
  analyses: [
    {
      framework: {
        name: "5Why",
        description: "なぜなぜ分析で問題の根本原因を追求する手法",
        reason: "業務プロセスの問題には根本原因の特定が重要なため",
        steps: [
          "問題を明確に定義する",
          "なぜ？を5回繰り返す",
          "根本原因を特定する",
          "対策を立案する",
        ],
      },
      actions: [
        {
          id: 1,
          title: "原因の特定",
          description: "生産性低下の根本原因を特定するためのミーティングを実施する",
          priority: "high",
          estimatedTime: "2時間",
        },
        {
          id: 2,
          title: "ワークフローの見直し",
          description: "現在の業務フローを可視化し、ボトルネックを見つける",
          priority: "medium",
          estimatedTime: "1日",
        },
      ],
    },
  ],
}

describe("POST /api/result", () => {
  beforeEach(() => {
    mockCallGeminiStreaming.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("正常: アクション一覧 + フレームワーク情報が返ること", async () => {
    mockCallGeminiStreaming.mockResolvedValueOnce(VALID_GEMINI_RESPONSE)

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("text/event-stream")
    const data = await parseSseResult(res) as typeof VALID_GEMINI_RESPONSE
    expect(data.analyses).toHaveLength(1)
    expect(data.analyses[0].actions).toHaveLength(2)
    expect(data.analyses[0].actions[0].id).toBe(1)
    expect(data.analyses[0].actions[0].priority).toBe("high")
    expect(data.analyses[0].framework.name).toBe("5Why")
    expect(data.analyses[0].framework.steps).toHaveLength(4)
  })

  it("Gemini不正JSON → errorイベントが返ること", async () => {
    mockCallGeminiStreaming.mockResolvedValueOnce({ invalid: "response" })

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await parseSseResult(res) as { message: string }
    expect(data.message).toBeDefined()
  })

  it("Geminiエラー → errorイベントが返ること", async () => {
    mockCallGeminiStreaming.mockRejectedValueOnce(new Error("Gemini API エラー (500): Internal Server Error"))

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await parseSseResult(res) as { message: string }
    expect(data.message).toContain("500")
  })

  it("バリデーション失敗: challenge空文字 → 400が返ること", async () => {
    const req = makeRequest({ ...BASE_REQUEST, challenge: "" })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("バリデーション失敗: 不正なselectedFrameworks → 400が返ること", async () => {
    const req = makeRequest({ ...BASE_REQUEST, selectedFrameworks: ["不明なフレームワーク"] })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("selectedFrameworksがGeminiプロンプトに渡されること", async () => {
    mockCallGeminiStreaming.mockResolvedValueOnce(VALID_GEMINI_RESPONSE)

    const req = makeRequest({ ...BASE_REQUEST, selectedFrameworks: ["PDCAサイクル"] })
    const res = await POST(req)
    await parseSseResult(res)

    expect(mockCallGeminiStreaming).toHaveBeenCalledTimes(1)
    const callArgs = mockCallGeminiStreaming.mock.calls[0][0]
    expect(callArgs.systemInstruction).toContain("PDCAサイクル")
  })
})
