# AI Chat

Claudeを使ったエンターテイメント目的のAIチャットWebアプリケーション。

## 技術スタック

- **フロントエンド/バックエンド**: Next.js 16 (App Router)
- **APIレイヤー**: Hono
- **AIエージェント**: Mastra + Claude (claude-sonnet-4-6)
- **ORM**: Prisma 5
- **データベース**: MongoDB Atlas
- **デプロイ**: Google Cloud Run
- **CI/CD**: GitHub Actions

## ローカル開発

### 前提条件

- Node.js 20+
- MongoDB Atlas アカウント
- Anthropic API キー

### セットアップ

```bash
make setup
# .env.local に ANTHROPIC_API_KEY と DATABASE_URL を設定
make dev
```

または手動で：

```bash
npm ci
npx prisma generate
cp .env.example .env.local
# .env.local を編集
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

### 主なコマンド

| コマンド | 内容 |
|---|---|
| `make dev` | 開発サーバー起動 |
| `make build` | 本番ビルド |
| `make test` | テスト実行 |
| `make typecheck` | 型チェック |
| `make deploy` | Cloud Run へ手動デプロイ |

---

## デプロイ（Google Cloud Run）

### 自動デプロイ（GitHub Actions）

`main` ブランチへ push すると自動でテスト → Cloud Run デプロイが実行されます。

**初回セットアップ時に必要な GitHub Secrets：**

| シークレット名 | 内容 |
|---|---|
| `GCP_PROJECT_ID` | GCP プロジェクト ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity プロバイダのリソース名 |
| `GCP_SERVICE_ACCOUNT` | デプロイ用サービスアカウントのメールアドレス |

### 手動デプロイ

```bash
./scripts/deploy.sh <GCP_PROJECT_ID>
# または
make deploy
```

### 初回 GCP セットアップ

```bash
# 必要な API を有効化
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com secretmanager.googleapis.com

# Secret Manager にシークレットを登録
echo -n "sk-ant-..." | gcloud secrets create ANTHROPIC_API_KEY --data-file=-
echo -n "mongodb+srv://..." | gcloud secrets create DATABASE_URL --data-file=-

# Cloud Run サービスアカウントに Secret Manager アクセス権を付与
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:<PROJECT_NUMBER>-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 環境変数

`.env.local` に以下を設定する（`.env.example` を参照）。

| 変数名 | 内容 |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API キー |
| `DATABASE_URL` | MongoDB Atlas 接続文字列 |
| `NEXT_PUBLIC_APP_URL` | アプリの公開 URL |
