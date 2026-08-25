import { getEnv } from "./env"

interface ServiceAccountJson {
  client_email: string
  private_key: string
}

interface GeminiContent {
  role: "user" | "model"
  parts: Array<{ text: string }>
}

export interface GeminiParams {
  systemInstruction: string
  contents: GeminiContent[]
  responseSchema: Record<string, unknown>
}

function base64urlEncode(data: string | ArrayBuffer): string {
  let bytes: Uint8Array
  if (typeof data === "string") {
    bytes = new TextEncoder().encode(data)
  } else {
    bytes = new Uint8Array(data)
  }
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "")
  const binary = atob(pemContents)
  const buffer = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i)
  }
  return buffer
}

export async function generateJWT(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson) as ServiceAccountJson
  const now = Math.floor(Date.now() / 1000)

  const header = {
    alg: "RS256",
    typ: "JWT",
  }

  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  }

  const encodedHeader = base64urlEncode(JSON.stringify(header))
  const encodedPayload = base64urlEncode(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const keyBuffer = pemToArrayBuffer(sa.private_key)
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign"]
  )

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  const encodedSignature = base64urlEncode(signatureBuffer)
  return `${signingInput}.${encodedSignature}`
}

export async function getAccessToken(
  serviceAccountJson: string,
  jwtGenerator: (sa: string) => Promise<string> = generateJWT
): Promise<string> {
  const jwt = await jwtGenerator(serviceAccountJson)

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `アクセストークンの取得に失敗しました (${response.status}): ${text}`
    )
  }

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

export async function callGemini(
  params: GeminiParams,
  tokenGetter: (
    sa: string,
    jwtGen?: (s: string) => Promise<string>
  ) => Promise<string> = getAccessToken
): Promise<unknown> {
  const env = getEnv()
  const accessToken = await tokenGetter(env.VERTEX_AI_SERVICE_ACCOUNT)

  const endpoint = `https://${env.VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.VERTEX_AI_PROJECT_ID}/locations/${env.VERTEX_AI_LOCATION}/publishers/google/models/gemini-1.5-flash:generateContent`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: params.contents,
        systemInstruction: {
          parts: [{ text: params.systemInstruction }],
        },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: params.responseSchema,
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
