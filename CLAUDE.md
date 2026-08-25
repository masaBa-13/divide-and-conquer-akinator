# 課題分解アキネーター — CLAUDE.md

## プロジェクト概要
アキネーター風UIで課題を1問1答形式で深掘りし、小さなアクションに分解するNext.js製Webアプリ。
チームの会議・ミーティングでリアルタイム利用を想定。

## ハーネスエンジニアリング ワークフロー

### 役割分離（厳守）
| 役割 | 担当 | 禁止事項 |
|---|---|---|
| **メインセッション（Opus）** | 計画・統括・意思決定・commit指示 | ファイル編集・テスト実行 |
| **implementer（Sonnet SA）** | worktree内のファイル編集・テスト実行・コードレビュー | アーキテクチャ変更の独自判断 |
| **ユーザー** | push / PR作成 / merge | — |

### タスクライフサイクル（ステップ0〜9）
```
0. clarify     — 不明点の洗い出しと仕様確定（Q&Aで完了済み）
1. worktree    — EnterWorktree でフィーチャーブランチを分離
2. implement   — implementer SA が worktree内で編集
3. test        — SA がテストを全パス確認（vitest / playwright）
4. code-review — SA が2回レビュー（1回目フル→修正→2回目確認のみ）
5. commit      — メインセッションが日本語+プレフィックスでcommit
6. push + PR   — ユーザーが実行（Claudeは gh コマンドを提示するだけ）
7. CI監視      — メインセッションが gh run watch で確認
8. merge       — ユーザーが確認後に実行
9. cleanup     — worktree削除（ブランチは保持）
```

### implementerへの指示ルール
- 常に実装前に対象ファイルをReadする
- シグネチャ変更時はgrep等で参照元を全確認してから変更
- 型エラー・lintエラーをゼロにしてからSAを終了する
- テストが通らない状態でworktreeを出ない

---

## 技術スタック

| 項目 | 採用技術 |
|---|---|
| フレームワーク | Next.js 15 (App Router) |
| スタイル | Tailwind CSS v4 |
| 状態管理 | Zustand + zustand/middleware (persist → sessionStorage) |
| AI API | Vertex AI — Gemini 1.5 Flash |
| デプロイ | Cloudflare Pages + Workers (OpenNext) |
| テスト | Vitest + React Testing Library + Playwright |
| 言語 | TypeScript strict mode |

---

## アーキテクチャ決定事項

### State永続化戦略
- Zustandストアは`sessionStorage`にpersist（タブ内限定、リロード対応）
- ページ間遷移は`router.push()`のクライアントサイドナビゲーション
- `/result`ページを直接URLアクセスした場合は`/`にリダイレクト

### Vertex AI認証（Edge Runtime）
- サービスアカウントの秘密鍵はCloudflare Secret（環境変数）で管理
- JWT生成は`Web Crypto API`（`crypto.subtle`）でRS256署名
- アクセストークンはリクエストごとに取得（Workersはステートレスのためキャッシュしない）

### フレームワーク状態の引き継ぎ
- `/api/start`レスポンスで`frameworkCandidate`を返す
- Zustandストアに`selectedFramework`として保存
- 以降の全APIリクエストに`selectedFramework`を含めてサーバーに送る

### Geminiへのリクエスト構造
```
POST https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/
     locations/{LOCATION}/publishers/google/models/gemini-1.5-flash:generateContent

{
  "contents": [...会話履歴をrole:user/modelで交互に],
  "systemInstruction": { "parts": [{ "text": "システムプロンプト" }] },
  "generationConfig": {
    "responseMimeType": "application/json",
    "responseSchema": { ...Zoスキーマ相当のJSON Schema }
  }
}
```

### エラーハンドリング
- Gemini出力が不正JSONの場合: Zodバリデーション失敗 → フォールバック質問を返す
- APIタイムアウト（10秒）: エラー画面表示 + 「もう一度試す」ボタン
- ユーザーの誤回答対策: 問答画面に「前の質問に戻る」ボタンを設置

---

## ディレクトリ構成

```
app/
  layout.tsx
  page.tsx                    # スタート画面
  session/page.tsx            # 問答画面（Client Component）
  result/page.tsx             # 結果画面
  api/
    start/route.ts
    answer/route.ts
    result/route.ts
components/
  akinator/
    Character.tsx             # SVGキャラクター + アニメーション状態管理
    SpeechBubble.tsx          # タイプライター効果付き吹き出し
    DesertBackground.tsx      # 砂漠背景SVG
  ui/
    Button.tsx
    ChoiceButton.tsx
    ProgressIndicator.tsx
    ErrorBanner.tsx
  StartForm.tsx
  QuestionPanel.tsx
  ResultPanel.tsx
  FrameworkExplanation.tsx
lib/
  vertex-ai.ts                # Web Crypto API JWT生成 + Gemini API呼び出し
  prompts.ts                  # 全プロンプト定義
  schemas.ts                  # Zodスキーマ（API入出力バリデーション）
  frameworks.ts               # 6フレームワークのメタデータ
  types.ts                    # 共有型定義
stores/
  session-store.ts            # Zustand + sessionStorage persist
__tests__/
  unit/
  integration/
  e2e/
wrangler.jsonc
next.config.ts
tailwind.config.ts
vitest.config.ts
```

---

## コーディング規約

- `any`型禁止。`unknown`を使いZodでナローイングする
- APIルートのリクエスト/レスポンスは必ずZodでバリデーション
- コンポーネントは`'use client'`を必要な箇所だけに限定
- Tailwindクラスは`cn()`ユーティリティで条件分岐
- 環境変数は`lib/env.ts`で一元管理し、起動時に存在チェック

## 実装フェーズ

| Phase | 内容 |
|---|---|
| 1 | プロジェクト初期化・型定義・Vertex AIクライアント・Zodスキーマ |
| 2 | APIルート3本（start / answer / result） |
| 3 | Zustandストア・スタート画面・問答画面・結果画面 |
| 4 | アキネーターキャラクターSVG・アニメーション |
| 5 | E2Eテスト・Cloudflareデプロイ設定 |
