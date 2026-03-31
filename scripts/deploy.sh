#!/bin/bash
# Cloud Runへの手動デプロイスクリプト
# 使用方法: ./scripts/deploy.sh <GCP_PROJECT_ID>

set -euo pipefail

PROJECT_ID="${1:-}"
if [[ -z "$PROJECT_ID" ]]; then
  echo "Error: GCP_PROJECT_IDを引数で指定してください"
  echo "Usage: $0 <GCP_PROJECT_ID>"
  exit 1
fi

REGION="asia-northeast1"
SERVICE="ai-chat"
REGISTRY="asia-northeast1-docker.pkg.dev"
IMAGE="${REGISTRY}/${PROJECT_ID}/${SERVICE}/${SERVICE}"
TAG=$(git rev-parse --short HEAD)

echo "=== AI Chat デプロイ開始 ==="
echo "Project: ${PROJECT_ID}"
echo "Image:   ${IMAGE}:${TAG}"
echo ""

# 1. Artifact Registry リポジトリ作成（初回のみ）
echo ">>> Artifact Registry リポジトリ確認..."
gcloud artifacts repositories describe "${SERVICE}" \
  --project="${PROJECT_ID}" \
  --location="${REGION}" 2>/dev/null || \
gcloud artifacts repositories create "${SERVICE}" \
  --project="${PROJECT_ID}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="AI Chat Docker images"

# 2. Docker認証
echo ">>> Docker認証..."
gcloud auth configure-docker "${REGISTRY}" --quiet

# 3. ビルド & プッシュ
echo ">>> Dockerイメージをビルド中..."
docker build -t "${IMAGE}:${TAG}" -t "${IMAGE}:latest" .

echo ">>> Artifact Registryへプッシュ中..."
docker push --all-tags "${IMAGE}"

# 4. Cloud Runへデプロイ
echo ">>> Cloud Runへデプロイ中..."
gcloud run deploy "${SERVICE}" \
  --project="${PROJECT_ID}" \
  --image="${IMAGE}:${TAG}" \
  --platform=managed \
  --region="${REGION}" \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=3 \
  --concurrency=10 \
  --memory=512Mi \
  --cpu=1 \
  --set-secrets="ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,DATABASE_URL=DATABASE_URL:latest"

# 5. デプロイ結果を表示
URL=$(gcloud run services describe "${SERVICE}" \
  --project="${PROJECT_ID}" \
  --platform=managed \
  --region="${REGION}" \
  --format='value(status.url)')

echo ""
echo "=== デプロイ完了 ==="
echo "URL: ${URL}"
