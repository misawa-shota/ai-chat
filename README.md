# AI Chat

Claudeを使ったエンターテイメント目的のAIチャットWebアプリケーション。

## 技術スタック

- **フロントエンド/バックエンド**: Next.js 16 (App Router)
- **APIレイヤー**: Hono
- **AIエージェント**: Mastra + Claude (claude-sonnet-4-6)
- **ORM**: Prisma 5
- **データベース**: MongoDB
- **デプロイ**: Vercel

## ローカル開発

### 前提条件

- Node.js 20+
- MongoDB (Atlas等)
- Anthropic APIキー

### セットアップ

```bash
# 依存関係インストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集して ANTHROPIC_API_KEY と DATABASE_URL を設定

# Prismaクライアント生成
npx prisma generate

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

### テスト

```bash
npm test
```

---

## Vercelへのデプロイ（推奨・無料）

### 方法A：GitHubと連携（最も簡単）

1. [vercel.com](https://vercel.com) にサインアップ / ログイン
2. **Add New Project** → GitHubリポジトリ `ai-chat` を選択して **Import**
3. **Environment Variables** に以下を入力：

   | 変数名 | 値 |
   |---|---|
   | `ANTHROPIC_API_KEY` | `sk-ant-xxxx...` |
   | `DATABASE_URL` | `mongodb+srv://...` |

4. **Deploy** をクリック

以降は `main` ブランチへのpushで自動デプロイされます。

---

### 方法B：Vercel CLI

```bash
# Vercel CLIをインストール
npm i -g vercel

# デプロイ（初回はブラウザで認証・プロジェクト設定）
vercel

# 本番環境へデプロイ
vercel --prod
```

---

### 方法C：GitHub Actionsによる自動デプロイ

`main` ブランチへのpushでテスト→デプロイが自動実行されます。

以下のシークレットをGitHubリポジトリの **Settings → Secrets and variables → Actions** に登録してください：

| シークレット名 | 取得場所 |
|---|---|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General → Project ID |

---

## Google Cloud Runへのデプロイ（代替）

Cloud Runを使う場合は `scripts/deploy.sh` と `cloudbuild.yaml` を参照してください。

```bash
./scripts/deploy.sh <GCP_PROJECT_ID>
```
