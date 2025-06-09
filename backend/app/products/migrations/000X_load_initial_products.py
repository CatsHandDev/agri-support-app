from django.db import migrations
import json
from pathlib import Path
from django.conf import settings  # User モデル取得のため
from django.contrib.auth import get_user_model  # User モデル取得

# ★ settings.AUTH_USER_MODEL を使って User モデルを取得
User = get_user_model()


# ★ データ投入処理を記述する関数
def load_product_data(apps, schema_editor):
    Product = apps.get_model(
        "products", "Product"
    )  # マイグレーション実行時の Product モデルを取得
    # ★ JSON ファイルのパス (settings.py から見たパスに合わせて調整)
    #    BASE_DIR が /app を指すなら、backend/initial_data/ は /app/initial_data/
    json_file_path = Path(settings.BASE_DIR) / "initial_data" / "products.json"

    # ユーザーキャッシュ (毎回DB問い合わせしないように)
    user_cache = {}

    try:
        with open(json_file_path, "r", encoding="utf-8") as f:
            products_data = json.load(f)
    except FileNotFoundError:
        print(
            f"\nWarning: JSON file not found at {json_file_path}, skipping data load."
        )
        return
    except json.JSONDecodeError:
        print(
            f"\nWarning: Error decoding JSON file at {json_file_path}, skipping data load."
        )
        return

    for product_data in products_data:
        # 生産者ユーザーを取得または作成 (ここでは取得のみを試みる)
        producer_username = product_data.get("producer_username")
        producer = None
        if producer_username:
            if producer_username in user_cache:
                producer = user_cache[producer_username]
            else:
                try:
                    # ★ 実際の User モデルを使って検索
                    producer = User.objects.get(username=producer_username)
                    user_cache[producer_username] = producer
                except User.DoesNotExist:
                    print(
                        f"\nWarning: Producer user '{producer_username}' not found for product '{product_data.get('name')}'. Skipping this product."
                    )
                    continue  # 生産者が見つからない場合はスキップ

        if not producer:  # 生産者が特定できない場合もスキップ
            print(
                f"\nWarning: Producer could not be determined for product '{product_data.get('name')}'. Skipping."
            )
            continue

        # 既存の Product を検索 (ID で上書きやスキップを判断)
        product_id = product_data.get("id")
        product_instance, created = Product.objects.update_or_create(
            id=product_id,  # ID をキーとして検索・作成
            defaults={  # ここに設定したいフィールドと値を記述
                "producer": producer,
                "name": product_data.get("name", ""),
                "description": product_data.get("description", ""),
                "category": product_data.get("category"),
                "price": product_data.get("price", 0),  # DecimalFieldは文字列でも可
                "quantity": product_data.get("quantity", 0),  # DecimalField
                "unit": product_data.get("unit", ""),
                # 'image': product_data.get('image'), # 画像パスはマイグレーションでの設定が難しいので一旦除外
                "standard": product_data.get("standard"),
                "cultivation_method": product_data.get("cultivation_method"),
                "harvest_時期": product_data.get("harvest_時期"),
                "shipping_available_時期": product_data.get("shipping_available_時期"),
                "allergy_info": product_data.get("allergy_info"),
                "storage_method": product_data.get("storage_method"),
                "status": product_data.get("status", "draft"),  # status を読み込む
                # created_at, updated_at は自動で設定される
            },
        )
        if created:
            print(f"Created Product: {product_instance.name}")
        else:
            print(f"Updated Product: {product_instance.name}")


# ★ データ削除処理 (マイグレーションを戻すときに実行される、任意)
def unload_product_data(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    # ここで投入したデータを削除するロジックを書く (ID ベースで削除など)
    # 例: 投入したデータのIDリストを保持しておき、それらを削除する
    # Product.objects.filter(id__in=[1, 2, 3, 4, 5, ...]).delete()
    # 簡単にするため、ここでは何もしない
    print("\nProduct data unloading not implemented.")
    pass


class Migration(migrations.Migration):

    # ★ このマイグレーションが依存する前のマイグレーションを指定
    #    例: 0001_initial の後に実行する場合
    dependencies = [
        ("products", "0001_initial"),  # 自分のアプリの前のマイグレーション
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),  # User モデルに依存
    ]

    operations = [
        # ★ データ投入関数と削除関数を登録
        migrations.RunPython(load_product_data, reverse_code=unload_product_data),
    ]
