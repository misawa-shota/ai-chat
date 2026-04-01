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

- [x] `Dockerfile` の作成（マルチステージビルド: deps / builder / runner）
- [x] `.dockerignore` の作成
- [x] `next.config.ts` に `output: "standalone"` を追加
- [ ] ローカルでのDockerビルド確認（Docker Desktop起動後に実施）
  ```bash
  docker build -t ai-chat .
  docker run -p 3000:3000 --env-file .env.local ai-chat
  ```
- [ ] Dockerコンテナ上での動作確認（同上）

---

## Phase 8: Google Cloud Runへのデプロイ

- [x] Google Cloud プロジェクトの準備（手順をREADMEに記載）
  - 必要API: Cloud Run / Cloud Build / Artifact Registry / Secret Manager
  - Secret Managerへのシークレット登録手順を記載
- [x] デプロイ設定ファイルの作成
  - `cloudbuild.yaml`: Cloud Buildによる自動ビルド&デプロイ設定
  - `.github/workflows/deploy.yml`: mainブランチpush時の自動デプロイ（Workload Identity Federation）
  - `scripts/deploy.sh`: 手動デプロイスクリプト
- [x] Cloud Runデプロイ設定
  - リージョン: `asia-northeast1`、最小インスタンス: 1、最大インスタンス: 3
  - 同時実行数: 10、メモリ: 512Mi
  - 環境変数はSecret Manager経由で注入
- [ ] デプロイ後の動作確認（GCPプロジェクト設定後に実施）
- [ ] Cloud Runのログ確認（同上）

---

---

## Phase 9: Cloud Runデプロイ・CI/CD構築

- [x] MongoDB Atlas Network Accessに `0.0.0.0/0` を追加
- [x] Cloud Run へのデプロイ完了（`ai-chat-491714` / `asia-northeast1`）
- [x] Prisma binaryTargets に `linux-musl-openssl-3.0.x` を追加（Alpine + OpenSSL 3対応）
- [x] GitHub Actions による自動デプロイ実装（Workload Identity Federation）
- [x] Vercel GitHub連携を解除（Cloud Runに一本化）
- [x] README.md をCloud Run構成に更新

---

## Phase 10: 不足機能・品質改善

### UX改善
- [x] 「新しい会話」ボタンの追加
  - localStorage の sessionId をリセットし、新規 UUID を生成する
  - MongoDB の履歴は削除せず、新セッションとして開始
- [x] ストリーミング中断時の部分メッセージ保持
  - `reader.done = true` になったとき、"done" SSEイベントを受信せずに終了した場合でも `accumulated` が空でなければメッセージリストに追加する
- [x] AIのMarkdownレスポンスのレンダリング
  - `react-markdown` を使用して、コードブロック・箇条書き・太字などを適切に表示する

### セキュリティ・バリデーション
- [x] メッセージ長の上限バリデーション追加
  - Zodスキーマに `z.string().min(1).max(2000)` を追加
- [ ] APIレート制限の実装（Vercel無料プランではステートレスのため外部ストア要）
  - Upstash Redis など外部ストアを利用して実装予定

### コード品質
- [x] `ChatWindow.tsx` のメッセージkeyをindexから安定したIDに変更
  - `Message` 型に `id` フィールドを追加（`crypto.randomUUID()` を使用）
  - `key={i}` → `key={msg.id}` に変更

### データ管理
- [x] `DELETE /api/chat/history/:sessionId` エンドポイントの追加
- [ ] 古いセッションのクリーンアップ機能
  - 一定期間（例: 30日）アクセスのないセッション・メッセージをMongoDBから削除するバッチ処理

### テスト追加
- [x] `ChatWindow` コンポーネントのテスト追加（4テスト）
  - メッセージ一覧の表示確認
  - ストリーミング中のローディングドット表示確認
  - 空状態のプレースホルダー表示確認
  - ストリーミングコンテンツの表示確認（計30テスト全パス）

---

## 完了条件

- チャット画面でメッセージを送信しClaudeがストリーミングで返答する
- 会話履歴がMongoDBに保存される
- ページリロード後に会話が復元される
- スマートフォン・タブレット・PCで正常に表示される
- Vercel上で正常に動作している
