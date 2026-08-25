import { getEnv } from "./env"

interface GeminiContent {
  role: "user" | "model"
  parts: Array<{ text: string }>
}

export interface GeminiParams {
  systemInstruction: string
  contents: GeminiContent[]
  responseSchema?: Record<string, unknown>
}

export async function callGeminiStreaming(
  params: GeminiParams,
  onHeartbeat: () => void
): Promise<unknown> {
  const env = getEnv()

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?key=${env.GEMINI_API_KEY}&alt=sse`

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: params.contents,
      systemInstruction: {
        parts: [{ text: params.systemInstruction }],
      },
      generationConfig: {
        responseMimeType: "application/json",
        ...(params.responseSchema ? { responseSchema: params.responseSchema } : {}),
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API エラー (${response.status}): ${text}`)
  }

  if (!response.body) {
    throw new Error("Gemini API からのストリームが空です")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let accumulatedText = ""

  const heartbeatInterval = setInterval(() => {
    onHeartbeat()
  }, 5000)

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const jsonStr = line.slice(6).trim()
        if (!jsonStr) continue

        let chunk: unknown
        try {
          chunk = JSON.parse(jsonStr)
        } catch {
          continue
        }

        const candidates = (chunk as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates
        if (!candidates || candidates.length === 0) continue
        const parts = candidates[0]?.content?.parts
        if (!parts || parts.length === 0) continue
        const text = parts[0]?.text
        if (typeof text === "string") {
          accumulatedText += text
        }
      }
    }
  } finally {
    clearInterval(heartbeatInterval)
  }

  if (!accumulatedText) {
    throw new Error("Gemini API からの応答が空です")
  }

  return JSON.parse(accumulatedText) as unknown
}

export async function callGemini(params: GeminiParams): Promise<unknown> {
  const env = getEnv()

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${env.GEMINI_API_KEY}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 55000)

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: params.contents,
        systemInstruction: {
          parts: [{ text: params.systemInstruction }],
        },
        generationConfig: {
          responseMimeType: "application/json",
          ...(params.responseSchema ? { responseSchema: params.responseSchema } : {}),
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Gemini API エラー (${response.status}): ${text}`)
    }

    const data = (await response.json()) as {
      candidates: Array<{
        content: { parts: Array<{ text: string }> }
      }>
    }

    const text = data.candidates[0]?.content?.parts[0]?.text
    if (!text) {
      throw new Error("Gemini API からの応答が空です")
    }

    return JSON.parse(text) as unknown
  } finally {
    clearTimeout(timeoutId)
  }
}
