#!/bin/sh
if [ "$DJANGO_DEBUG" = "True" ] ; then
    echo "Waiting for postgres..."

    # DB_HOST と DB_PORT が docker-compose.yml から渡されることを想定
    # nc (netcat) を使ってDBが起動するまで待つ
    while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started"

    # マイグレーションの実行 (必要に応じて有効化)
    # echo "Applying database migrations..."
    # python manage.py migrate --noinput
fi

# Django開発サーバーを起動 (本番環境では Gunicorn を使用)
# docker-compose.yml の command を上書きしない場合はこちらで起動コマンドを指定
# 例: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
# 開発時は manage.py runserver が便利
echo "Starting Django develop server..."
exec python manage.py runserver 0.0.0.0:8000