import mysql.connector
import psycopg2
import pandas as pd
from mysql.connector import Error

# --- 1. MySQL Configuration (Stayed exactly as your Spring Boot setup) ---
MYSQL_CONFIG = {
    "host": 'localhost',
    "port": 3306,
    "user": 'root',
    "password": '',
    "database": 'produitstockdb'
}

# --- 2. PostgreSQL Configuration (For our new Supplier AI Data) ---
DB_CONFIG = {
    "dbname": "procurement_system",
    "user": "postgres",
    "password": "hanae",
    "host": "localhost",
    "port": "5432"
}

def get_db_connection():
    """ Connect to MySQL (Original Function) """
    try:
        connection = mysql.connector.connect(**MYSQL_CONFIG)
        return connection
    except Error as e:
        print(f"❌ Error connecting to MySQL: {e}")
        return None

def get_pg_connection():
    """ Connect to PostgreSQL (New Function for AI) """
    try:
        connection = psycopg2.connect(**DB_CONFIG)
        return connection
    except Exception as e:
        print(f"❌ Error connecting to PostgreSQL: {e}")
        return None

# --- 3. Your Original Functions (UNTOUCHED) ---

def get_sales_history(product_id):
    conn = get_db_connection()
    if conn is None: return None
    try:
        query = f"SELECT sale_date, quantity_sold FROM sales_history WHERE product_id = {product_id} ORDER BY sale_date ASC"
        df = pd.read_sql(query, conn)
        return df
    except Exception as e:
        print(f"❌ Error fetching sales: {e}")
        return None
    finally:
        if conn.is_connected(): conn.close()

def get_current_stock(product_id):
    conn = get_db_connection()
    if conn is None: return None
    try:
        query = f"SELECT quantite_disponible, seuil_critique FROM stock WHERE produit_id = {product_id}"
        df = pd.read_sql(query, conn)
        return df.iloc[0] if not df.empty else None
    finally:
        if conn.is_connected(): conn.close()

# --- 4. New Helper Function for Supplier AI ---

def get_supplier_history_df():
    """ Fetches history from Postgres for AI Training """
    conn = get_pg_connection()
    if conn is None: return None
    try:
        # Using the exact columns from your SQL Shell image
        query = """
            SELECT id_fournisseur, id_category, delivery_time_days, unit_price_offered, quality_score 
            FROM supplier_performance_history
        """
        df = pd.read_sql(query, conn)
        return df
    except Exception as e:
        print(f"❌ Error fetching supplier history: {e}")
        return None
    finally:
        conn.close()