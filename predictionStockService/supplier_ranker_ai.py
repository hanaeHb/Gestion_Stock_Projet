import psycopg2
import random
from datetime import datetime, timedelta

DB_CONFIG = {
    "dbname": "procurement_system",
    "user": "postgres",
    "password": "hanae",
    "host": "localhost",
    "port": "5432"
}

def populate_supplier_history():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        cur.execute("SELECT id_fournisseur, id_category FROM fournisseur_specializations")
        specs = cur.fetchall()

        if not specs:
            print("❌ No data found in fournisseur_specializations.")
            return

        print(f"Generating fake history for {len(specs)} specialization links...")

        for _ in range(300):
            spec = random.choice(specs)
            f_id, cat_id = spec[0], spec[1]

            days = random.randint(1, 10)
            price = round(random.uniform(20.0, 900.0), 2)
            quality = random.randint(1, 5)
            o_date = datetime.now() - timedelta(days=random.randint(1, 365))
            is_late = days > 5

            cur.execute("""
                INSERT INTO supplier_performance_history 
                (id_fournisseur, id_category, delivery_time_days, unit_price_offered, quality_score, order_date, late_delivery)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (f_id, cat_id, days, price, quality, o_date.date(), is_late))

        conn.commit()
        print("✅ Success! 300 rows inserted into supplier_performance_history.")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    populate_supplier_history()