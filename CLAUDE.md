# AI Chat Application

## プロジェクト概要

エンターテイメント目的のAIチャットWebアプリケーション。
Claudeを活用した日常会話・雑談を提供するシンプルなチャットボット。
認証不要で誰でも即座に利用でき、ストリーミングによるリアルタイム応答を提供する。

---

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 14+ (App Router) |
| APIレイヤー | Hono |
| AIエージェントフレームワーク | Mastra |
| AIモデル | Claude (Anthropic) |
| ORM | Prisma |
| データベース | MongoDB |
| デプロイ | Google Cloud Run |

---

## アーキテクチャ

```
Browser
  │
  │ HTTPS
  ▼
Next.js App Router (Cloud Run)
  ├── /app             ← フロントエンド (React)
  └── /app/api/[...]   ← Hono API Routes
        │
        ▼
      Mastra Agent
        │
        ▼
      Claude API (Anthropic)

MongoDB (会話履歴を永続化)
```

### ポイント
- Next.jsのRoute Handler内でHonoをマウントする構成
- MastraでClaudeエージェントを管理し、セッション内の会話コンテキストを保持
- ストリーミングはServer-Sent Events (SSE) で実装
- 会話履歴はMongoDBに永続化し、セッションIDをキーに管理する

---

## 機能要件

### 必須機能
- [x] テキストによる対話（雑談・日常会話）
- [x] ストリーミング表示（Claudeの回答をリアルタイムで1文字ずつ表示）
- [x] セッション内の会話コンテキスト保持
- [x] 会話履歴のMongoDBへの永続化（セッションIDをキーに保存）
- [x] レスポンシブデザイン（PC / タブレット / スマートフォン対応）

### 対象外（実装しない）
- ユーザー認証・アカウント管理
- 多言語対応
- 画像認識・音声入力
- チャットボットのキャラクター設定UI

---

## 非機能要件

| 項目 | 要件 |
|---|---|
| 同時接続数 | 5〜10ユーザーを想定 |
| レスポンス | ストリーミング開始まで2秒以内を目標 |
| デプロイ環境 | Google Cloud Run |
| スケーリング | Cloud Runの自動スケーリングを活用（最小インスタンス1） |

---

## UI/UX仕様

### デザイン方針
- **テーマ**: ビジネスライク（白・グレー・ネイビー系のカラーパレット）
- **フォント**: システムフォントを使用（sans-serif）
- **レイアウト**: チャットUI（上部にメッセージ一覧、下部に入力欄）

### 画面構成

```
┌─────────────────────────────────┐
│  Header: アプリ名               │
├─────────────────────────────────┤
│                                 │
│  メッセージ一覧エリア           │
│  （スクロール可能）             │
│                                 │
│  [User]: こんにちは            │
│  [AI]:   こんにちは！...       │
│                                 │
├─────────────────────────────────┤
│  [ 入力フィールド    ] [送信]   │
└─────────────────────────────────┘
```

### レスポンシブブレークポイント
- **モバイル**: ~768px（全幅レイアウト）
- **タブレット**: 768px~1024px
- **デスクトップ**: 1024px~（最大幅 800px 程度でセンタリング）

---

## ディレクトリ構成

```
/
├── app/
│   ├── layout.tsx              # ルートレイアウト
│   ├── page.tsx                # チャット画面（メインページ）
│   ├── globals.css             # グローバルスタイル
│   └── api/
│       └── [...route]/
│           └── route.ts        # Hono APIマウントポイント
│
├── components/
│   ├── ChatWindow.tsx          # メッセージ一覧表示
│   ├── MessageBubble.tsx       # 個別メッセージバブル
│   └── ChatInput.tsx           # 入力フォーム
│
├── lib/
│   ├── mastra/
│   │   ├── index.ts            # Mastraインスタンス
│   │   └── agent.ts            # Claudeエージェント定義
│   ├── hono/
│   │   └── index.ts            # Honoアプリ定義・ルーティング
│   └── prisma.ts               # Prismaクライアント
│
├── prisma/
│   └── schema.prisma           # MongoDBスキーマ定義
│
├── .env.local                  # ローカル環境変数（gitignore）
├── .env.example                # 環境変数テンプレート
├── Dockerfile                  # Cloud Run用Dockerイメージ
└── package.json
```

---

## API設計

### POST /api/chat

チャットメッセージを送信し、ストリーミングレスポンスを受け取る。
送受信したメッセージはMongoDBに保存される。

**Request**
```json
{
  "message": "こんにちは！",
  "sessionId": "uuid-v4-string"
}
```

**Response**
`Content-Type: text/event-stream`（SSEストリーミング）

```
data: {"type": "delta", "content": "こん"}
data: {"type": "delta", "content": "にちは"}
data: {"type": "done"}
```

**エラーレスポンス**
```json
{
  "error": "エラーメッセージ"
}
```

---

### GET /api/chat/history/:sessionId

指定セッションの会話履歴を取得する。

**Response**
```json
{
  "sessionId": "uuid-v4-string",
  "messages": [
    { "role": "user", "content": "こんにちは！", "createdAt": "2026-03-22T00:00:00Z" },
    { "role": "assistant", "content": "こんにちは！", "createdAt": "2026-03-22T00:00:01Z" }
  ]
}
```

---

## データモデル（Prisma Schema）

```prisma
// prisma/schema.prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Session {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  sessionId String    @unique
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [sessionId])
  role      String   // "user" | "assistant"
  content   String
  createdAt DateTime @default(now())
}
```

### データ設計のポイント
- `sessionId` はクライアント側でUUID v4を生成してブラウザのlocalStorageに保持
- ページリロード後も同じ `sessionId` を使うことで会話履歴を復元できる
- `role` は `"user"` または `"assistant"` の2値

---

## 環境変数

`.env.local` に以下を設定する。

```env
# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# MongoDB
DATABASE_URL="mongodb+srv://..."

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`.env.example` をリポジトリに含め、実際の値は含めない。

---

## Mastraエージェント設定

```typescript
// lib/mastra/agent.ts
export const chatAgent = new Agent({
  name: "chat-agent",
  model: {
    provider: "ANTHROPIC",
    name: "claude-sonnet-4-6",  // 使用モデル
  },
  instructions: `
    あなたはフレンドリーなAIアシスタントです。
    ユーザーとの日常会話・雑談を楽しんでください。
    自然で親しみやすい日本語で応答してください。
  `,
});
```

---

## デプロイ（Google Cloud Run）

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### Cloud Run設定
- **リージョン**: asia-northeast1 (東京) 推奨
- **最小インスタンス数**: 1（コールドスタート防止）
- **最大インスタンス数**: 3
- **同時実行数**: 10
- **メモリ**: 512Mi
- **CPU**: 1

### デプロイコマンド

```bash
# Dockerイメージをビルド & プッシュ
gcloud builds submit --tag gcr.io/PROJECT_ID/ai-chat

# Cloud Runへデプロイ
gcloud run deploy ai-chat \
  --image gcr.io/PROJECT_ID/ai-chat \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=xxx,DATABASE_URL=xxx \
  --min-instances 1 \
  --max-instances 3 \
  --concurrency 10 \
  --memory 512Mi
```

---

## 開発ガイドライン

### コーディング規約
- TypeScriptを使用し、型定義を明示する
- コンポーネントはFunction Componentで統一
- Hooksは `use` プレフィックスを使用
- ファイル名はPascalCase（コンポーネント）またはcamelCase（ユーティリティ）

### 禁止事項
- `any` 型の使用（やむを得ない場合は `// eslint-disable` コメントと理由を記載）
- `console.log` の本番コードへの残留
- 環境変数のハードコーディング

### コミットメッセージ
```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
style: スタイル変更
docs: ドキュメント更新
chore: 設定・依存関係の変更
```

### ローカル開発

```bash
# 依存関係インストール
npm install

# Prismaクライアント生成
npx prisma generate

# 開発サーバー起動
npm run dev
```
