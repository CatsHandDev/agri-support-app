# frontend/Dockerfile

# Node.js のベースイメージを指定 (プロジェクトで使用するバージョンに合わせる)
FROM node:18-alpine AS development

# 作業ディレクトリを設定
WORKDIR /app

# package.json とロックファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# プロジェクトコードをコピー
COPY . .

# Next.js アプリケーションのデフォルトポート
EXPOSE 3000

# 開発サーバーを起動するコマンド
CMD ["npm", "run", "dev"]

# --- 本番環境用のビルドステージ (参考) ---
# FROM node:18-alpine AS build
# WORKDIR /app
# COPY --from=development /app/node_modules ./node_modules
# COPY . .
# RUN npm run build

# FROM node:18-alpine AS production
# WORKDIR /app
# ENV NODE_ENV production
# COPY --from=build /app/public ./public
# COPY --from=build /app/.next/standalone ./
# COPY --from=build /app/.next/static ./.next/static
# EXPOSE 3000
# CMD ["node", "server.js"]