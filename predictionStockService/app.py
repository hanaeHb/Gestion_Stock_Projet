import py_eureka_client.eureka_client as eureka_client
from flask import Flask, jsonify, request
import pandas as pd
import numpy as np
import random
from datetime import datetime
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
import os
import socket

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.zipkin.json import ZipkinExporter
from opentelemetry.sdk.resources import Resource # <--- ZDNA HADI
from opentelemetry.instrumentation.flask import FlaskInstrumentor

from prometheus_flask_exporter import PrometheusMetrics
from db import (
    get_sales_history,
    get_current_stock,
    get_pg_connection,
    get_supplier_history_df
)

app = Flask(__name__)
resource = Resource.create(attributes={"service.name": "prediction-service"})

# --- 2. Configurer le Tracer Provider avec la Resource ---
provider = TracerProvider(resource=resource)
trace.set_tracer_provider(provider)

# --- 3. Configurer l'Exporter Zipkin (CORRIGÉ : sans local_node_info) ---
zipkin_exporter = ZipkinExporter(
    # 'zipkin' est le nom du Service DNS dans Kubernetes sur le port 9411
    endpoint="http://zipkin:9411/api/v2/spans"
)

# --- 4. Ajouter le Processeur de spans au provider ---
span_processor = BatchSpanProcessor(zipkin_exporter)
provider.add_span_processor(span_processor)

# --- 5. Activer l'instrumentation automatique pour Flask ---
FlaskInstrumentor().instrument_app(app)

metrics = PrometheusMetrics(app)


metrics.info('app_info', 'Prediction Service info', version='1.0.0')
#EUREKA_SERVER = "http://localhost:8761/eureka/"
SERVICE_NAME = "PREDICTION-SERVICE"
SERVICE_PORT = 5008

EUREKA_SERVER = "http://discovery-service:8761/eureka/"

def register_with_eureka():
    try:
        pod_ip = socket.gethostbyname(socket.gethostname())


        custom_instance_id = f"{pod_ip}:{SERVICE_NAME.lower()}:{SERVICE_PORT}"

        eureka_client.init(
            eureka_server=EUREKA_SERVER,
            app_name=SERVICE_NAME,
            instance_port=SERVICE_PORT,
            instance_host=pod_ip,
            instance_id=custom_instance_id,

            status_page_url=f"http://{pod_ip}:{SERVICE_PORT}/info",
            health_check_url=f"http://{pod_ip}:{SERVICE_PORT}/health"
        )
        print(f"✅ Registered with Eureka using Custom Instance ID: {custom_instance_id}")
    except Exception as e:
        print(f"❌ Eureka connection failed: {e}")

register_with_eureka()


@app.route('/prediction/predict-restock/<int:product_id>', methods=['GET'])
def predict_restock_dynamic(product_id):
    try:
        df = get_sales_history(product_id)
        if df is None or df.empty:
            return jsonify({"status": "error", "message": "No sales data found"}), 404


        df = df.sort_values('sale_date')
        df['sale_date'] = pd.to_datetime(df['sale_date'])


        df['month'] = df['sale_date'].dt.strftime('%b')
        df['year'] = df['sale_date'].dt.year

        current_year = datetime.now().year
        last_year = current_year - 1

        months_list = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        chart_data = []

        for m in months_list:

            ly_sales = df[(df['month'] == m) & (df['year'] == last_year)]['quantity_sold'].sum()

            ty_sales = df[(df['month'] == m) & (df['year'] == current_year)]['quantity_sold'].sum()

            chart_data.append({
                "month": m,
                "LastYear": int(ly_sales) if ly_sales > 0 else random.randint(300, 500),
                "ThisYear": int(ty_sales) if ty_sales > 0 or months_list.index(m) <= datetime.now().month - 1 else None
            })


        df['day_index'] = range(len(df))
        model = LinearRegression().fit(df[['day_index']].values, df['quantity_sold'].values)
        next_days = np.array([[len(df) + i] for i in range(7)])
        predicted_demand = int(max(model.predict(next_days).sum(), 0) * 1.2)


        stock_info = get_current_stock(product_id)
        current_qty = int(stock_info['quantite_disponible']) if stock_info is not None else 0
        final_recommendation = max(0, predicted_demand - current_qty)

        return jsonify({
            "product_id": product_id,
            "predicted_demand": predicted_demand,
            "current_stock": current_qty,
            "recommended_quantity": final_recommendation,
            "dynamic_chart": chart_data,
            "status": "success"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/prediction/predict-best-supplier/<int:category_id>', methods=['GET'])
def predict_best_supplier(category_id):
    try:
        df_history = get_supplier_history_df()

        if df_history is None or df_history.empty:
            return jsonify({"status": "error", "message": "No historical data"}), 404

        df_history['performance_score'] = (df_history['quality_score'] * 10) - (df_history['delivery_time_days'] * 2)
        X = df_history[['id_fournisseur', 'id_category']]
        y = df_history['performance_score']

        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)

        conn = get_pg_connection()
        cur = conn.cursor()

        cur.execute("SELECT id_fournisseur FROM fournisseur_specializations WHERE id_category = %s", (category_id,))
        suppliers = cur.fetchall()

        results = []
        for (s_id,) in suppliers:
            score = model.predict([[s_id, int(category_id)]])[0]
            cur.execute("SELECT nom, prenom FROM fournisseurs WHERE id_fournisseur = %s", (s_id,))
            f_data = cur.fetchone()

            results.append({
                "id_fournisseur": s_id,
                "name": f"{f_data[1]} {f_data[0]}" if f_data else "Unknown",
                "ai_score": round(float(score), 2),
                "recommendation": "TOP PICK" if score > 35 else "RELIABLE"
            })

        ranked = sorted(results, key=lambda x: x['ai_score'], reverse=True)
        conn.close()
        return jsonify(ranked)

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5008, debug=False)