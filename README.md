# AI Chat

Claudeを使ったエンターテイメント目的のAIチャットWebアプリケーション。

## 技術スタック

- **フロントエンド/バックエンド**: Next.js 16 (App Router)
- **APIレイヤー**: Hono
- **AIエージェント**: Mastra + Claude (claude-sonnet-4-6)
- **ORM**: Prisma 5
- **データベース**: MongoDB
- **デプロイ**: Google Cloud Run

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

## Google Cloud Runへのデプロイ

### 事前準備

1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクトを作成
2. 必要なAPIを有効化：
   ```bash
   gcloud services enable run.googleapis.com \
     cloudbuild.googleapis.com \
     artifactregistry.googleapis.com \
     secretmanager.googleapis.com
   ```
3. Secret Managerにシークレットを登録：
   ```bash
   echo -n "your-anthropic-api-key" | \
     gcloud secrets create ANTHROPIC_API_KEY --data-file=-
   echo -n "mongodb+srv://..." | \
     gcloud secrets create DATABASE_URL --data-file=-
   ```

### 手動デプロイ

```bash
./scripts/deploy.sh <GCP_PROJECT_ID>
```

### GitHub Actionsによる自動デプロイ

`main` ブランチへのプッシュで自動デプロイされます。

以下のシークレットをGitHubリポジトリに設定してください：

| シークレット名 | 内容 |
|---|---|
| `GCP_PROJECT_ID` | Google CloudプロジェクトID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity ProviderのリソースID |
| `GCP_SERVICE_ACCOUNT` | デプロイ用サービスアカウントのメール |

#### Workload Identity Federation の設定

```bash
PROJECT_ID="your-project-id"
SA_NAME="github-actions-deploy"

# サービスアカウント作成
gcloud iam service-accounts create ${SA_NAME} \
  --display-name="GitHub Actions Deploy"

# 必要な権限を付与
for role in roles/run.admin roles/artifactregistry.writer roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="${role}"
done

# Workload Identity Pool を作成
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Provider を作成
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# バインディングを設定（自分のリポジトリに書き換える）
REPO="your-github-username/ai-chat"
gcloud iam service-accounts add-iam-policy-binding \
  "${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}"
```

## Cloud Run設定

| 項目 | 値 |
|---|---|
| リージョン | asia-northeast1 (東京) |
| 最小インスタンス数 | 1 |
| 最大インスタンス数 | 3 |
| 同時実行数 | 10 |
| メモリ | 512Mi |
| CPU | 1 |
