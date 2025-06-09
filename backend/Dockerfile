# Pythonのベースイメージを指定
FROM python:3.11-slim

# 環境変数を設定
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 作業ディレクトリを設定
WORKDIR /app

# 必要なシステムパッケージをインストール
# psycopg2-binaryに必要なライブラリをインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gettext \
    netcat-traditional \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# requirementsファイルをコピーして依存関係をインストール
# まずはbase.txtとlocal.txt（開発用）をインストール
COPY requirements/base.txt requirements/local.txt /app/requirements/
RUN pip install --upgrade pip && \
    pip install -r requirements/local.txt

# entrypointスクリプトをコピーして実行権限を付与
COPY ./entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# プロジェクトコードをコピー
COPY . /app/

# ポートを公開（docker-compose.ymlでexposeしているので必須ではないが明示的に）
EXPOSE 8000

# コンテナ起動時に実行するコマンド
ENTRYPOINT ["/app/entrypoint.sh"]