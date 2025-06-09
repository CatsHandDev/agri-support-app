import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import timedelta

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

BASE_DIR = Path(__file__).resolve().parent.parent
# .env ファイルを読み込む (docker-compose.yml と同じ場所にある .env を想定)
# Dockerコンテナ内からはホストの .env は直接見えないので、
# 環境変数は docker-compose.yml の environment で渡すのが一般的
# この load_dotenv はローカルで直接 `python manage.py` を実行する場合に有効
dotenv_path = os.path.join(BASE_DIR, "../../.env")  # ルートの .env を指すように調整
load_dotenv(dotenv_path=dotenv_path)

# SECURITY WARNING: keep the secret key used in production secret!
# .env から読み込むか、直接記述 (開発用なら簡易なものでも良いが、gitignoreすること)
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "django-insecure-fallback-key-local")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"  # 環境変数から読み込む

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "backend",
    "0.0.0.0",
    "192.168.3.2",
    "172.25.80.1",
]  # コンテナ名やDockerネットワーク内からのアクセスを許可

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # --- Third Party ---
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "django_extensions",
    # --- Local Apps ---
    "app.accounts",
    "app.core",
    "app.products",
    "app.orders",
    "app.profiles",
    "app.reviews",
    "app.messaging",
    "app.payments",
    "app.favorites",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"  # urls.pyの場所

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            os.path.join(BASE_DIR, "../templates")
        ],  # プロジェクト直下のtemplatesディレクトリを参照
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# https://docs.djangoproject.com/en/stable/ref/settings/#databases
# 環境変数からデータベース接続情報を取得
POSTGRES_DB = os.environ.get("POSTGRES_DB")
POSTGRES_USER = os.environ.get("POSTGRES_USER")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD")
POSTGRES_HOST = os.environ.get("POSTGRES_HOST")
POSTGRES_PORT = os.environ.get("POSTGRES_PORT")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": POSTGRES_DB,
        "USER": POSTGRES_USER,
        "PASSWORD": POSTGRES_PASSWORD,
        "HOST": POSTGRES_HOST,  # docker-compose.yml で定義したサービス名
        "PORT": POSTGRES_PORT,  # PostgreSQLのデフォルトポート
    }
}


# Password validation
# ... (既存のパスワードバリデータ設定)

# Internationalization
# ... (既存の言語・タイムゾーン設定)
LANGUAGE_CODE = "ja"
TIME_ZONE = "Asia/Tokyo"
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/stable/howto/static-files/
STATIC_URL = "/static/"
# `python manage.py collectstatic` で集められるディレクトリ
STATIC_ROOT = os.path.join(BASE_DIR, "../staticfiles")

# Media files (User uploaded files)
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")  # docker-compose.yml の volume と合わせる

# Default primary key field type
# https://docs.djangoproject.com/en/stable/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework Settings (例)
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",  # 開発初期は AllowAny にしておくと楽
        # 'rest_framework.permissions.IsAuthenticated', # 認証必須の場合
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        # JWT認証をデフォルトに設定
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        # 必要に応じてTokenAuthenticationなどを追加
        "rest_framework.authentication.SessionAuthentication",
    ],
    # 必要に応じて他の設定を追加 (Pagination, Filtering, etc.)
}

# CORS設定 (フロントエンドからのアクセスを許可するため)
# pip install django-cors-headers が必要
# INSTALLED_APPS に 'corsheaders' を追加
# MIDDLEWARE に 'corsheaders.middleware.CorsMiddleware' を追加 (CommonMiddleware の後が良い)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js の開発サーバー
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True  # 必要に応じて

from corsheaders.defaults import default_headers  # type: ignore

CORS_ALLOW_HEADERS = list(default_headers) + [
    "cache-control",
    "pragma",
    "expires",
]

# Email Backend (開発用 - コンソールに出力)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# --- Simple JWT の設定 ---
from datetime import timedelta

SIMPLE_JWT = {
    # アクセストークンの有効期間 (例: 15分)
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=1440),
    # リフレッシュトークンの有効期間 (例: 1日)
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    # リフレッシュトークンをローテーションさせるか (セキュリティ向上)
    "ROTATE_REFRESH_TOKENS": False,
    # 古いリフレッシュトークンをブラックリストに入れるか (ローテーション時)
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": False,  # 最終ログイン日時を更新するか
    "ALGORITHM": "HS256",  # 署名アルゴリズム
    # SECRET_KEY は settings.SECRET_KEY がデフォルトで使われる
    # "SIGNING_KEY": settings.SECRET_KEY,
    "VERIFYING_KEY": "",
    "AUDIENCE": None,
    "ISSUER": None,
    "JSON_ENCODER": None,
    "JWK_URL": None,
    "LEEWAY": 0,
    "AUTH_HEADER_TYPES": (
        "Bearer",
    ),  # リクエストヘッダーの形式 (Authorization: Bearer <token>)
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    "JTI_CLAIM": "jti",
    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    # スライディングトークンの有効期間 (アクセス毎に更新されるトークン)
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=5),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),
    # デフォルトのシリアライザ (必要に応じてカスタム可)
    # "TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainPairSerializer",
    # "TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSerializer",
    # "TOKEN_VERIFY_SERIALIZER": "rest_framework_simplejwt.serializers.TokenVerifySerializer",
    # "TOKEN_BLACKLIST_SERIALIZER": "rest_framework_simplejwt.serializers.TokenBlacklistSerializer",
    # "SLIDING_TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainSlidingSerializer",
    # "SLIDING_TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSlidingSerializer",
}

# (オプション) カスタムユーザーモデルを使用する場合 (将来的に推奨)
# AUTH_USER_MODEL = 'accounts.User' # settings.py の上部あたりに記述
