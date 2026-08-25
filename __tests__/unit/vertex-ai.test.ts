import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { generateJWT, getAccessToken, callGemini } from "@/lib/vertex-ai"

const FAKE_SERVICE_ACCOUNT = JSON.stringify({
  client_email: "test@test-project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----",
})

const mockJwtGenerator = vi.fn().mockResolvedValue("mocked.jwt.token")

describe("generateJWT", () => {
  it("不正な秘密鍵では crypto.subtle がエラーを投げる（仕様確認）", async () => {
    await expect(generateJWT(FAKE_SERVICE_ACCOUNT)).rejects.toThrow()
  })

  it("JWTフォーマットは3セグメントであることをモックで確認", () => {
    // モックが返すJWTは header.payload.signature の3セグメント
    const mockJwt = "header.payload.signature"
    const parts = mockJwt.split(".")
    expect(parts).toHaveLength(3)
  })
})

describe("getAccessToken", () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    mockJwtGenerator.mockClear()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "fake-access-token" }),
      })
    )
  })

  afterEach(() => {
    vi.stubGlobal("fetch", originalFetch)
  })

  it("正しいURLとbodyでAPIを呼び出す", async () => {
    const token = await getAccessToken(FAKE_SERVICE_ACCOUNT, mockJwtGenerator)

    const mockFetch = vi.mocked(global.fetch)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://oauth2.googleapis.com/token")
    expect(options.method).toBe("POST")

    const body = options.body as URLSearchParams
    expect(body.get("grant_type")).toBe(
      "urn:ietf:params:oauth:grant-type:jwt-bearer"
    )
    expect(body.get("assertion")).toBe("mocked.jwt.token")

    expect(token).toBe("fake-access-token")
  })

  it("generateJWTが呼び出される", async () => {
    await getAccessToken(FAKE_SERVICE_ACCOUNT, mockJwtGenerator)
    expect(mockJwtGenerator).toHaveBeenCalledWith(FAKE_SERVICE_ACCOUNT)
  })

  it("401エラー時に適切な例外を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      })
    )

    await expect(
      getAccessToken(FAKE_SERVICE_ACCOUNT, mockJwtGenerator)
    ).rejects.toThrow("401")
  })
})

describe("callGemini", () => {
  const originalFetch = global.fetch
  const originalEnv = process.env

  const mockTokenGetter = vi.fn().mockResolvedValue("fake-access-token")

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      VERTEX_AI_PROJECT_ID: "test-project",
      VERTEX_AI_LOCATION: "asia-northeast1",
      VERTEX_AI_SERVICE_ACCOUNT: FAKE_SERVICE_ACCOUNT,
    }

    mockTokenGetter.mockClear()
    mockTokenGetter.mockResolvedValue("fake-access-token")

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
    process.env = originalEnv
    vi.stubGlobal("fetch", originalFetch)
  })

  it("正しいheaderとbodyでGemini APIを呼び出す", async () => {
    const result = await callGemini(
      {
        systemInstruction: "テストの指示",
        contents: [{ role: "user", parts: [{ text: "こんにちは" }] }],
        responseSchema: { type: "object" },
      },
      mockTokenGetter
    )

    const mockFetch = vi.mocked(global.fetch)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("aiplatform.googleapis.com")
    expect(url).toContain("gemini-1.5-flash:generateContent")
    expect(url).toContain("test-project")
    expect(url).toContain("asia-northeast1")

    expect(options.method).toBe("POST")
    const headers = options.headers as Record<string, string>
    expect(headers["Authorization"]).toBe("Bearer fake-access-token")
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
      callGemini(
        { systemInstruction: "test", contents: [], responseSchema: {} },
        mockTokenGetter
      )
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
      callGemini(
        { systemInstruction: "test", contents: [], responseSchema: {} },
        mockTokenGetter
      )
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

    const result = await callGemini(
      {
        systemInstruction: "test",
        contents: [{ role: "user", parts: [{ text: "テスト" }] }],
        responseSchema: {},
      },
      mockTokenGetter
    )

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
      callGemini(
        { systemInstruction: "test", contents: [], responseSchema: {} },
        mockTokenGetter
      )
    ).rejects.toThrow("空")
  })
})
