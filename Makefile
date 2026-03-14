FRONTEND_DIR := frontend
WORKER_DIR := worker

.PHONY: help install frontend-install worker-install dev frontend-dev worker-dev build frontend-build worker-build

help:
	@echo "Usage:"
	@echo "  make install         # frontend / worker の依存をまとめてインストール"
	@echo "  make frontend-dev    # frontend の開発サーバ起動 (Vite)"
	@echo "  make worker-dev      # Cloudflare Worker を wrangler dev で起動"
	@echo "  make dev             # 上記2つを順に起動 (別ターミナルで使う想定)"
	@echo "  make build           # frontend / worker のビルドコマンド実行(デプロイ前チェック用)"

install: frontend-install worker-install

frontend-install:
	cd $(FRONTEND_DIR) && npm install

worker-install:
	cd $(WORKER_DIR) && npm install

frontend-dev:
	cd $(FRONTEND_DIR) && npm run dev

worker-dev:
	cd $(WORKER_DIR) && npm run dev

dev:
	@echo "別ターミナルで以下を実行してください:"
	@echo "  make worker-dev"
	@echo "  make frontend-dev"

build: frontend-build worker-build

frontend-build:
	cd $(FRONTEND_DIR) && npm run build

worker-build:
	cd $(WORKER_DIR) && npm run build || echo \"worker のビルド/デプロイは wrangler 側の設定に依存します\"

