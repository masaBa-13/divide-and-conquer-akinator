import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { callGemini } from "@/lib/vertex-ai"

vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(() => ({
    GEMINI_API_KEY: "test-api-key",
  })),
}))

describe("callGemini", () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '{"result": "ok"}' }],
                role: "model",
              },
              finishReason: "STOP",
            },
          ],
        }),
      })
    )
  })

  afterEach(() => {
    vi.stubGlobal("fetch", originalFetch)
    vi.clearAllMocks()
  })

  it("正しいURLとbodyでGemini APIを呼び出す", async () => {
    const result = await callGemini({
      systemInstruction: "テストの指示",
      contents: [{ role: "user", parts: [{ text: "こんにちは" }] }],
      responseSchema: { type: "object" },
    })

    const mockFetch = vi.mocked(global.fetch)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("generativelanguage.googleapis.com")
    expect(url).toContain("generateContent")
    expect(url).toContain("test-api-key")

    expect(options.method).toBe("POST")
    const headers = options.headers as Record<string, string>
    expect(headers["Content-Type"]).toBe("application/json")

    const body = JSON.parse(options.body as string) as {
      systemInstruction: { parts: Array<{ text: string }> }
      generationConfig: { responseMimeType: string }
    }
    expect(body.systemInstruction.parts[0].text).toBe("テストの指示")
    expect(body.generationConfig.responseMimeType).toBe("application/json")

    expect(result).toEqual({ result: "ok" })
  })

  it("APIエラー時（429）に適切な例外を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      })
    )

    await expect(
      callGemini({ systemInstruction: "test", contents: [], responseSchema: {} })
    ).rejects.toThrow("429")
  })

  it("APIエラー時（500）に適切な例外を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      })
    )

    await expect(
      callGemini({ systemInstruction: "test", contents: [], responseSchema: {} })
    ).rejects.toThrow("500")
  })

  it("レスポンスのJSONパースが正しく行われる", async () => {
    const expectedData = {
      question: "テスト質問",
      answerType: "yes_no",
      frameworkCandidate: "5Why",
    }

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(expectedData) }],
                role: "model",
              },
            },
          ],
        }),
      })
    )

    const result = await callGemini({
      systemInstruction: "test",
      contents: [{ role: "user", parts: [{ text: "テスト" }] }],
      responseSchema: {},
    })

    expect(result).toEqual(expectedData)
  })

  it("候補が空の場合に例外を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [],
        }),
      })
    )

    await expect(
      callGemini({ systemInstruction: "test", contents: [], responseSchema: {} })
    ).rejects.toThrow("空")
  })
})
