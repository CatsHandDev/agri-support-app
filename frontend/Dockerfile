# Node.js のベースイメージを指定
FROM node:20-alpine AS development

# 作業ディレクトリを設定
WORKDIR /app

# package.json とロックファイル (package-lock.json または yarn.lock) を先にコピー
COPY package*.json ./

# 依存関係をインストール
# npm を使用する場合:
RUN npm install

# プロジェクトコード全体を作業ディレクトリにコピー
# .dockerignore ファイルを作成しておくと、不要なファイル (node_modulesなど) のコピーを防げます
COPY . .

# Next.js アプリケーションのデフォルトポート 3000 を公開
EXPOSE 3000

# 開発サーバーを起動するコマンド
# package.json の "scripts" で定義されている dev コマンドを実行します
CMD ["npm", "run", "dev"]

# --- 本番環境用のビルドステージ (参考として記載) ---
# 本番環境では、より最適化されたイメージを作成するためにマルチステージビルドを使います。
# FROM node:18-alpine AS build
# WORKDIR /app
# COPY --from=development /app/node_modules ./node_modules
# COPY . .
# # 環境変数を設定して本番ビルドを実行
# ENV NODE_ENV production
# RUN npm run build
# # RUN yarn build

# FROM node:18-alpine AS production
# WORKDIR /app
# ENV NODE_ENV production
# # ビルド成果物のみをコピー (Next.js の Standalone Output を利用する場合)
# # next.config.mjs で output: 'standalone' を設定する必要があります
# COPY --from=build /app/public ./public
# COPY --from=build /app/.next/standalone ./
# COPY --from=build /app/.next/static ./.next/static
# EXPOSE 3000
# CMD ["node", "server.js"]