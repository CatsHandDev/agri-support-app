# 必要なモジュールをインポート
from django.db import migrations  # type: ignore
import json
from pathlib import Path
from django.conf import settings  # type: ignore
from django.contrib.auth import get_user_model  # type: ignore

# User モデルを取得 (カスタムユーザーモデル対応)
# User = get_user_model()


# --- データ投入処理を行う関数 ---
def load_product_data(apps, schema_editor):
    # マイグレーション実行時点での Product モデルを取得
    Product = apps.get_model("products", "Product")
    # ★★★ マイグレーション時点の User モデルを取得 ★★★
    User = apps.get_model(
        settings.AUTH_USER_MODEL.split(".")[0], settings.AUTH_USER_MODEL.split(".")[1]
    )
    # JSON ファイルへのパスを構築 (backend/initial_data/products.json を想定)
    json_file_path = Path(settings.BASE_DIR) / "app" / "initial_data" / "products.json"

    # ユーザーをキャッシュするための辞書
    user_cache = {}

    print(f"\n--- Running load_product_data from {json_file_path} ---")

    # JSON ファイルの読み込み (エラーハンドリング付き)
    try:
        with open(json_file_path, "r", encoding="utf-8") as f:
            products_data = json.load(f)
        print(f"Successfully loaded {len(products_data)} records from JSON.")
    except FileNotFoundError:
        print(
            f"!!! ERROR: JSON file not found at {json_file_path}. Skipping data load."
        )
        return  # ファイルがなければ処理終了
    except json.JSONDecodeError as e:
        print(
            f"!!! ERROR: Error decoding JSON file at {json_file_path}: {e}. Skipping data load."
        )
        return  # JSON パースエラーなら処理終了

    # データ投入結果のカウンター
    created_count = 0
    updated_count = 0
    skipped_count = 0

    # JSON データ一件ずつ処理
    for product_data in products_data:
        product_name = product_data.get("name", "N/A")
        producer_username = product_data.get("producer_username")
        producer = None

        # --- 生産者ユーザーを取得 ---
        if producer_username:
            if producer_username in user_cache:  # キャッシュにあれば使う
                producer = user_cache[producer_username]
            else:  # キャッシュになければDB検索
                try:
                    producer = User.objects.get(username=producer_username)
                    user_cache[producer_username] = producer  # キャッシュに保存
                    print(f"Found producer: {producer_username}")
                except User.DoesNotExist:
                    print(
                        f"!!! WARNING: Producer user '{producer_username}' not found for product '{product_name}'. Skipping this product."
                    )
                    skipped_count += 1
                    continue  # 次の商品へ
        else:  # producer_username が JSON にない場合
            print(
                f"!!! WARNING: Producer username missing for product '{product_name}'. Skipping."
            )
            skipped_count += 1
            continue

        # --- 商品の作成または更新 ---
        product_id = product_data.get("id")
        if not product_id:  # JSON に ID がなければスキップ (必須とする)
            print(
                f"!!! WARNING: Product ID missing for product '{product_name}'. Skipping."
            )
            skipped_count += 1
            continue

        try:
            # id をキーにして検索し、存在すれば defaults の内容で更新、なければ新規作成
            product_instance, created = Product.objects.update_or_create(
                id=product_id,
                defaults={
                    "producer": producer,
                    "name": product_data.get("name", ""),
                    "description": product_data.get("description", ""),
                    "category": product_data.get("category"),
                    "price": product_data.get(
                        "price", 0
                    ),  # DecimalField に適切に変換される
                    "quantity": product_data.get("quantity", 0),  # DecimalField
                    "unit": product_data.get("unit", ""),
                    "standard": product_data.get("standard"),
                    "cultivation_method": product_data.get("cultivation_method"),
                    "harvest_時期": product_data.get("harvest_時期"),
                    "shipping_available_時期": product_data.get(
                        "shipping_available_時期"
                    ),
                    "allergy_info": product_data.get("allergy_info"),
                    "storage_method": product_data.get("storage_method"),
                    "status": product_data.get("status", "draft"),
                    # 'image' はここでは設定しない
                },
            )
            if created:
                print(
                    f"    -> Created Product ID {product_instance.id}: {product_instance.name}"
                )
                created_count += 1
            else:
                print(
                    f"    -> Updated Product ID {product_instance.id}: {product_instance.name}"
                )
                updated_count += 1
        except Exception as e:
            # 作成/更新中に他のエラーが発生した場合 (例: DB制約違反など)
            print(
                f"!!! ERROR: Failed to update/create product ID {product_id} ('{product_name}'): {e}"
            )
            skipped_count += 1

    print(f"--- Finished load_product_data ---")
    print(
        f"Summary: Created={created_count}, Updated={updated_count}, Skipped={skipped_count}"
    )


# --- データ削除処理 (マイグレーションを戻すときに呼ばれる) ---
# (必要であれば、投入したデータを削除するロジックを記述)
def unload_product_data(apps, schema_editor):
    print("\nRunning unload_product_data...")
    # ここでは単純に何もしない例
    pass


# --- Migrationクラス ---
class Migration(migrations.Migration):

    # このマイグレーションが依存するマイグレーションを指定
    # ★★★ ここはあなたの環境に合わせて修正してください ★★★
    # 例: 先行するマイグレーションが '0004_merge_...' の場合
    dependencies = [
        ("products", "0004_merge_20250426_1025"),  # ←★ 実際のファイル名に合わせる
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    # 実行する操作をリストで指定
    operations = [
        migrations.RunPython(load_product_data, reverse_code=unload_product_data),
    ]
