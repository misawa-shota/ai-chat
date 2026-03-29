.PHONY: install setup dev build start test lint deploy

# 依存パッケージのインストール + Prismaクライアント生成
install:
	npm ci
	npx prisma generate

# 初回セットアップ（.env.localの作成も案内）
setup:
	cp -n .env.example .env.local || true
	npm ci
	npx prisma generate
	@echo ""
	@echo "セットアップ完了。.env.local に ANTHROPIC_API_KEY と DATABASE_URL を設定してください。"

# 開発サーバー起動
dev:
	npm run dev

# 本番ビルド
build:
	npm run build

# 本番サーバー起動（ビルド済みが前提）
start:
	npm run start

# テスト実行
test:
	npm test

# テスト（ウォッチモード）
test-watch:
	npm run test:watch

# 型チェック
typecheck:
	npx tsc --noEmit

# Lint
lint:
	npm run lint

# Vercelへデプロイ（Vercel CLIが必要: npm i -g vercel）
deploy:
	vercel --prod

# Vercelへプレビューデプロイ
deploy-preview:
	vercel
