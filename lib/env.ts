export interface EnvConfig {
  VERTEX_AI_PROJECT_ID: string
  VERTEX_AI_LOCATION: string
  VERTEX_AI_SERVICE_ACCOUNT: string
}

export function getEnv(): EnvConfig {
  const projectId = process.env.VERTEX_AI_PROJECT_ID
  const location = process.env.VERTEX_AI_LOCATION ?? "asia-northeast1"
  const serviceAccount = process.env.VERTEX_AI_SERVICE_ACCOUNT

  if (!projectId) {
    throw new Error(
      "環境変数 VERTEX_AI_PROJECT_ID が設定されていません。" +
        "Google Cloud プロジェクト ID を設定してください。"
    )
  }

  if (!serviceAccount) {
    throw new Error(
      "環境変数 VERTEX_AI_SERVICE_ACCOUNT が設定されていません。" +
        "サービスアカウントの JSON 文字列を設定してください。"
    )
  }

  return {
    VERTEX_AI_PROJECT_ID: projectId,
    VERTEX_AI_LOCATION: location,
    VERTEX_AI_SERVICE_ACCOUNT: serviceAccount,
  }
}
