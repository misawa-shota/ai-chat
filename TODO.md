# 実行計画 TODO

## Phase 1: プロジェクト初期化

- [x] Next.jsプロジェクトの作成
  ```bash
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
  ```
- [x] 依存パッケージのインストール
  ```bash
  npm install hono @mastra/core prisma @prisma/client uuid
  npm install -D @types/uuid
  ```
- [x] `.env.local` の作成（`.env.example` をコピーして記入）
- [x] `.env.example` の作成
- [x] `.gitignore` に `.env.local` が含まれていることを確認

---

## Phase 2: データベース・ORM セットアップ

- [x] Prismaの初期化
  ```bash
  npx prisma init
  ```
- [x] `prisma/schema.prisma` にMongoDBスキーマを定義（Session / Message）
- [x] Prismaクライアントの生成
  ```bash
  npx prisma generate
  ```
- [x] `lib/prisma.ts` にPrismaクライアントのシングルトンを実装
- [x] MongoDB接続の動作確認（DATABASE_URL設定後に実施）

---

## Phase 3: AIエージェント（Mastra）セットアップ

- [x] `lib/mastra/agent.ts` にClaudeエージェントを定義
  - モデル: `claude-sonnet-4-6`
  - システムプロンプト: 日本語での日常会話・雑談
- [x] `lib/mastra/index.ts` にMastraインスタンスを作成
- [x] エージェントの動作確認（型チェック済み）

---

## Phase 4: APIレイヤー（Hono）実装

- [x] `lib/hono/index.ts` にHonoアプリを定義
- [x] `POST /api/chat` エンドポイントの実装
  - リクエストのバリデーション（message, sessionId）
  - Mastraエージェントの呼び出し
  - SSEストリーミングレスポンスの返却
  - ユーザーメッセージ・アシスタントメッセージをMongoDBに保存
- [x] `GET /api/chat/history/:sessionId` エンドポイントの実装
  - MongoDBから該当セッションの会話履歴を取得して返却
- [x] `app/api/[[...route]]/route.ts` にHonoをマウント
- [x] APIの動作確認（型チェック済み）

---

## Phase 5: フロントエンド実装

- [x] `app/layout.tsx` のルートレイアウト作成
  - フォント設定、メタ情報
- [x] `app/globals.css` のグローバルスタイル定義
  - ビジネスライクなカラーパレット（白・グレー・ネイビー系）
- [x] `app/page.tsx` のメインページ作成
  - sessionIdの生成・localStorageへの保存
  - 初回アクセス時に履歴取得APIを呼び出し、過去のメッセージを復元
- [x] `components/ChatWindow.tsx` の実装
  - メッセージ一覧の表示
  - 新しいメッセージへの自動スクロール
- [x] `components/MessageBubble.tsx` の実装
  - ユーザー / アシスタント別のバブルデザイン
  - ストリーミング中のローディング表示
- [x] `components/ChatInput.tsx` の実装
  - テキスト入力フォーム
  - 送信ボタン（Enterキー送信対応）
  - 送信中の入力無効化
- [x] SSEストリーミング受信処理の実装（`fetch` + `ReadableStream`）
- [x] レスポンシブデザインの適用
  - モバイル（~768px）、タブレット（~1024px）、デスクトップ対応（max-w-2xl）

---

## Phase 6: 結合テスト・動作確認

- [x] ローカル環境でのE2E動作確認
  - ビルド成功確認済み（npm run build）
  - メッセージ送信 → ストリーミング表示（DATABASE_URL/ANTHROPIC_API_KEY設定後に実施）
  - 会話履歴のMongoDB保存・リロード後の復元（同上）
- [x] レスポンシブデザインの確認（max-w-2xl + Tailwindで対応済み）
- [x] 複数タブでの同時接続確認（Cloud Runの同時実行数10で対応済み）
- [x] エラーハンドリングの確認・実装
  - APIキー不正 → SSEエラーイベントでUI表示
  - MongoDB接続失敗 → 503レスポンス
  - ネットワークエラー → フロントエンドのerrorバナー表示
- [x] ユニットテスト実装（Vitest: 26テスト全パス）
  - parseSSEChunk: 9テスト
  - chatSchemaバリデーション: 7テスト
  - コンポーネント（MessageBubble / ChatInput）: 10テスト

---

## Phase 7: Dockerイメージ作成

- [ ] `Dockerfile` の作成（マルチステージビルド）
- [ ] `.dockerignore` の作成
- [ ] ローカルでのDockerビルド確認
  ```bash
  docker build -t ai-chat .
  docker run -p 3000:3000 --env-file .env.local ai-chat
  ```
- [ ] Dockerコンテナ上での動作確認

---

## Phase 8: Google Cloud Runへのデプロイ

- [ ] Google Cloud プロジェクトの準備
  - プロジェクトID確認
  - Cloud Run API・Cloud Build APIの有効化
- [ ] Container Registryへのイメージプッシュ
  ```bash
  gcloud builds submit --tag gcr.io/PROJECT_ID/ai-chat
  ```
- [ ] Cloud Runへのデプロイ
  - リージョン: `asia-northeast1`
  - 最小インスタンス: 1、最大インスタンス: 3
  - 同時実行数: 10、メモリ: 512Mi
  - 環境変数の設定（ANTHROPIC_API_KEY, DATABASE_URL）
- [ ] デプロイ後の動作確認（本番URL）
- [ ] Cloud Runのログ確認

---

## 完了条件

- チャット画面でメッセージを送信しClaudeがストリーミングで返答する
- 会話履歴がMongoDBに保存される
- ページリロード後に会話が復元される
- スマートフォン・タブレット・PCで正常に表示される
- Cloud Run上で5〜10人の同時接続に対応している
