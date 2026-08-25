import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { POST } from "@/app/api/start/route"
import { NextRequest } from "next/server"

const FAKE_SERVICE_ACCOUNT = JSON.stringify({
  client_email: "test@test-project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----",
})

const mockTokenGetter = vi.fn().mockResolvedValue("fake-access-token")

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
  return new NextRequest("http://localhost/api/start", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

const VALID_GEMINI_RESPONSE = {
  question: "その課題は業務プロセスに関するものですか？",
  answerType: "yes_no",
  frameworkCandidates: ["5Why"],
}

describe("POST /api/start", () => {
  beforeEach(() => {
    mockCallGemini.mockClear()
    mockTokenGetter.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("正常: 課題テキスト → 正しい構造のレスポンスが返ること", async () => {
    mockCallGemini.mockResolvedValueOnce(VALID_GEMINI_RESPONSE)

    const req = makeRequest({ challenge: "チームの生産性が落ちている" })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as typeof VALID_GEMINI_RESPONSE
    expect(data.question).toBe(VALID_GEMINI_RESPONSE.question)
    expect(data.answerType).toBe("yes_no")
    expect((data as { frameworkCandidates: string[] }).frameworkCandidates).toContain("5Why")
  })

  it("異常: 空文字列 → 400が返ること", async () => {
    const req = makeRequest({ challenge: "" })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("異常: challengeなし → 400が返ること", async () => {
    const req = makeRequest({})
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("異常: Gemini不正JSON → フォールバックレスポンスが返ること", async () => {
    mockCallGemini.mockResolvedValueOnce({ invalid: "response" })

    const req = makeRequest({ challenge: "課題テキスト" })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as { question: string; answerType: string; frameworkCandidates: string[] }
    expect(data.question).toBe("その課題は技術的な問題ですか？")
    expect(data.answerType).toBe("yes_no")
    expect(data.frameworkCandidates).toContain("ロジックツリー")
  })

  it("異常: Gemini 500エラー → 500が返ること", async () => {
    mockCallGemini.mockRejectedValueOnce(new Error("Gemini API エラー (500): Internal Server Error"))

    const req = makeRequest({ challenge: "課題テキスト" })
    const res = await POST(req)

    expect(res.status).toBe(500)
  })

  it("choices形式のレスポンスも正しく返ること", async () => {
    const choicesResponse = {
      question: "課題の種類を選んでください",
      answerType: "choices",
      choices: ["技術的な問題", "人間関係の問題", "プロセスの問題"],
      frameworkCandidates: ["ロジックツリー"],
    }
    mockCallGemini.mockResolvedValueOnce(choicesResponse)

    const req = makeRequest({ challenge: "会議が多すぎる" })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as typeof choicesResponse
    expect(data.choices).toHaveLength(3)
    expect(data.answerType).toBe("choices")
  })
})
