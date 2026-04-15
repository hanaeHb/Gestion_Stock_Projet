from flask import Flask, request, jsonify
import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    # استلام مبيعات آخر 30 يوم من الـ Database
    history = data.get('sales_history') # مثال: [5, 7, 6, 10, ...]
    lead_time = data.get('lead_time', 3) # شحال كياخد المورد باش يوصل (أيام)

    if not history or len(history) < 5:
        return jsonify({"error": "History too short for AI prediction"}), 400

    # تحويل البيانات لشكل يفهمو الـ IA
    df = pd.DataFrame(history, columns=['sales'])
    df['day'] = range(len(df))

    # تدريب الموديل (Linear Regression) للتنبؤ بالطلب
    X = df[['day']]
    y = df['sales']
    model = LinearRegression().fit(X, y)

    # التوقع لليوم الجاي
    next_day = np.array([[len(df)]])
    daily_forecast = model.predict(next_day)[0]

    # حساب الكمية المثالية (Smart Quantity)
    # المعادلة: (الطلب اليومي المتوقع * وقت التوصيل) + هامش أمان
    recommended_qty = int((daily_forecast * lead_time) * 1.2)

    return jsonify({
        "status": "success",
        "recommended_quantity": max(recommended_qty, 10),
        "reason": "AI Prediction based on sales trends"
    })

if __name__ == '__main__':
    app.run(port=5008, debug=True)