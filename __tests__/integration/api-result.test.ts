import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { POST } from "@/app/api/result/route"
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
  selectedFramework: "5Why",
}

const VALID_GEMINI_RESPONSE = {
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
}

describe("POST /api/result", () => {
  beforeEach(() => {
    mockCallGemini.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("正常: アクション一覧 + フレームワーク情報が返ること", async () => {
    mockCallGemini.mockResolvedValueOnce(VALID_GEMINI_RESPONSE)

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as typeof VALID_GEMINI_RESPONSE
    expect(data.actions).toHaveLength(2)
    expect(data.actions[0].id).toBe(1)
    expect(data.actions[0].priority).toBe("high")
    expect(data.framework.name).toBe("5Why")
    expect(data.framework.steps).toHaveLength(4)
  })

  it("Gemini不正JSON → 500が返ること", async () => {
    mockCallGemini.mockResolvedValueOnce({ invalid: "response" })

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(500)
  })

  it("Geminiエラー → 500が返ること", async () => {
    mockCallGemini.mockRejectedValueOnce(new Error("Gemini API エラー (500): Internal Server Error"))

    const req = makeRequest(BASE_REQUEST)
    const res = await POST(req)

    expect(res.status).toBe(500)
  })

  it("バリデーション失敗: challenge空文字 → 400が返ること", async () => {
    const req = makeRequest({ ...BASE_REQUEST, challenge: "" })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("バリデーション失敗: 不正なselectedFramework → 400が返ること", async () => {
    const req = makeRequest({ ...BASE_REQUEST, selectedFramework: "不明なフレームワーク" })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("selectedFrameworkがGeminiプロンプトに渡されること", async () => {
    mockCallGemini.mockResolvedValueOnce(VALID_GEMINI_RESPONSE)

    const req = makeRequest({ ...BASE_REQUEST, selectedFramework: "PDCAサイクル" })
    await POST(req)

    expect(mockCallGemini).toHaveBeenCalledTimes(1)
    const callArgs = mockCallGemini.mock.calls[0][0]
    expect(callArgs.systemInstruction).toContain("PDCAサイクル")
  })
})
