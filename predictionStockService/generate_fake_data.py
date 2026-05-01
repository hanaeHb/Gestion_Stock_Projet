import mysql.connector
import random
from datetime import datetime, timedelta

def generate_history_for_all():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            port=3306,
            user='root',
            password='',
            database='produitstockdb'
        )
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM produit")
        rows = cursor.fetchall()
        product_ids = [row[0] for row in rows]

        if not product_ids:
            print("⚠️ No products found in 'produit' table!")
            return

        print(f"🚀 Found {len(product_ids)} products. Starting generation...")

        cursor.execute("TRUNCATE TABLE sales_history")

        for p_id in product_ids:
            print(f"📦 Generating data for Product ID: {p_id}")
            sales_entries = []

            for i in range(365):
                sale_date = datetime.now() - timedelta(days=i)
                qty = random.randint(0, 10)
                if sale_date.weekday() >= 5: qty += random.randint(2, 5)
                if sale_date.month in [11, 12]: qty += random.randint(3, 8)

                sales_entries.append((p_id, qty, sale_date.date()))
            query = "INSERT INTO sales_history (product_id, quantity_sold, sale_date) VALUES (%s, %s, %s)"
            cursor.executemany(query, sales_entries)

        conn.commit()
        print(f"✅ Finished! Generated history for {len(product_ids)} products.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    generate_history_for_all()