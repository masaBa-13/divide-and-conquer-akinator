export interface EnvConfig {
  GEMINI_API_KEY: string
}

export function getEnv(): EnvConfig {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error(
      "環境変数 GEMINI_API_KEY が設定されていません。"
    )
  }

  return { GEMINI_API_KEY: apiKey }
}
