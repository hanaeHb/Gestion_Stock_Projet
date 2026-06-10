import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, BarChart, Bar, Cell
} from "recharts";
import { FaRobot, FaTruckMoving, FaBoxes, FaHistory, FaCheckCircle } from "react-icons/fa";
import { FiCpu } from "react-icons/fi";
import "./PredictionDashboard.css";

interface PredictionDashboardProps {
    products: any[];
    categories: any[];
}

const PredictionDashboard: React.FC<PredictionDashboardProps> = ({ products, categories }) => {
    const [selectedProduct, setSelectedProduct] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    const [restockPrediction, setRestockPrediction] = useState<any>(null);
    const [supplierRecommendations, setSupplierRecommendations] = useState<any[]>([]);
    const [loadingProduct, setLoadingProduct] = useState<boolean>(false);
    const [loadingSupplier, setLoadingSupplier] = useState<boolean>(false);
    const [dynamicChartData, setDynamicChartData] = useState<any[]>([]);


    const handleProductChange = async (pId: string) => {
        setSelectedProduct(pId);
        if (!pId) return;
        setLoadingProduct(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:8888/prediction-service/prediction/predict-restock/${pId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRestockPrediction(res.data);

            if (res.data.dynamic_chart) {
                setDynamicChartData(res.data.dynamic_chart);
            }
        } catch (err) {
            console.error("Restock Prediction Error:", err);
            setRestockPrediction(null);
            setDynamicChartData([]);
        } finally {
            setLoadingProduct(false);
        }
    };

    const handleCategoryChange = async (catId: string) => {
        setSelectedCategory(catId);
        if (!catId) return;
        setLoadingSupplier(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:8888/prediction-service/prediction/predict-best-supplier/${catId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSupplierRecommendations(res.data);
        } catch (err) {
            console.error("Supplier Prediction Error:", err);
            setSupplierRecommendations([]);
        } finally {
            setLoadingSupplier(false);
        }
    };

    useEffect(() => {
        if (products && products.length > 0 && !selectedProduct) {
            const firstProductId = products[0].id.toString();
            setSelectedProduct(firstProductId);

            setLoadingProduct(true);
            const token = localStorage.getItem("token");
            axios.get(`http://localhost:8888/prediction-service/prediction/predict-restock/${firstProductId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    setRestockPrediction(res.data);
                    if (res.data && res.data.dynamic_chart) {
                        setDynamicChartData(res.data.dynamic_chart);
                    } else {
                        setDynamicChartData([]);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingProduct(false));
        }
    }, [products]);


    useEffect(() => {
        if (categories && categories.length > 0 && !selectedCategory) {
            const firstCatId = (categories[0].id || categories[0].idCategorie || categories[0]._id)?.toString();
            setSelectedCategory(firstCatId);

            setLoadingSupplier(true);
            const token = localStorage.getItem("token"); //
            axios.get(`http://localhost:8888/prediction-service/prediction/predict-best-supplier/${firstCatId}`, {
                headers: { Authorization: `Bearer ${token}` } // 🛡️
            })
                .then(res => setSupplierRecommendations(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoadingSupplier(false));
        }
    }, [categories]);

    const categoryDistribution = categories.map(cat => {
        const currentCatId = (cat.id || cat.idCategorie || cat._id)?.toString();
        const count = products.filter(p => {
            if (p.categorieId) return p.categorieId.toString() === currentCatId;
            const pCat = (p as any).categorie || (p as any).category;
            if (pCat) return (pCat.id || pCat.idCategorie || pCat._id)?.toString() === currentCatId;
            return false;
        }).length;

        return { name: cat.nom || cat.name, value: count || 0 };
    }).filter(c => c.value > 0);

    return (
        <div className="prediction-container animate-fade-in">
            <div className="prediction-header">
                <div className="header-text">
                    <h1><FaRobot/> AI Algorithmic Forecasting</h1>
                    <p>Linear Regression Stock Projections & Random Forest Supplier Ranker Vectors.</p>
                </div>
                <div className="ai-engine-badge">
                    <FiCpu className="spin-icon"/> AI Engine v1.0 Live
                </div>
            </div>

            <div className="prediction-glass-card chart-full-width">
                <div className="card-header-with-icon">
                    <h3>
                        <FaHistory/> Dynamic Vector Timeline: Last Year vs This Year,
                        {selectedProduct && products.length > 0 && (
                            <span>
                                of ptoduct {products.find(p => p.id.toString() === selectedProduct)?.nom}
                            </span>
                        )}
                    </h3>
                    <div className="custom-chart-legend">
                        <span className="legend-dot last-year"></span> Last Year History (Database Dump)
                        <span className="legend-dot this-year"></span> This Year (Live System Metrics)
                    </div>
                </div>
                <div style={{width: "100%", height: 280, marginTop: "15px"}}>
                    <ResponsiveContainer>
                        <LineChart data={dynamicChartData}>
                            <CartesianGrid stroke="#f8f0ee" vertical={false}/>
                            <XAxis dataKey="month" fontSize={11} tick={{fill: "#e36469"}} axisLine={false}
                                   tickLine={false}/>
                            <YAxis fontSize={11} tick={{fill: "#730d19"}} axisLine={false} tickLine={false}/>
                            <Tooltip contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid #7c3aed",
                                fontFamily: "Berlin Sans FB Demi"
                            }}/>
                            <Line type="monotone" dataKey="LastYear" name="Last Year Units" stroke="#730d19"
                                  strokeWidth={3} strokeDasharray="5 5" dot={{r: 4}}/>
                            <Line type="monotone" dataKey="ThisYear" name="Current Year Live" stroke="#15803d"
                                  strokeWidth={4} dot={{r: 6}} connectNulls/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="prediction-grid">

                <div className="prediction-glass-card">
                    <div className="card-header-with-icon">
                        <h3><FaBoxes/> Algorithmic Demand Forecaster</h3>
                    </div>
                    <div className="input-group">
                        <label>Select Target Product:</label>
                        <select value={selectedProduct} onChange={(e) => handleProductChange(e.target.value)}>
                            <option value="">-- Choose a Product --</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.nom}</option>
                            ))}
                        </select>
                    </div>

                    {loadingProduct && <div className="loader-text">Analyzing database vectors...</div>}

                    {restockPrediction && !loadingProduct && (
                        <div className="prediction-results-box">
                            <div className="metric-row">
                                <span>7-Day Projected Demand:</span>
                                <strong>{restockPrediction.predicted_demand} Units</strong>
                            </div>
                            <div className="metric-row">
                                <span>Current Available Stock:</span>
                                <span className="stock-badge-qty">{restockPrediction.current_stock} Units</span>
                            </div>
                            <div className="metric-row highlight-burgundy">
                                <span>Recommended Restock:</span>
                                <strong
                                    className="big-recommendation">+{restockPrediction.recommended_quantity} Units</strong>
                            </div>
                            {restockPrediction.recommended_quantity > 0 ? (
                                <div className="status-alert-bar active-alert">⚠️ Order triggers needed
                                    immediately.</div>
                            ) : (
                                <div className="status-alert-bar safe-alert">✅ Current stock covers predicted
                                    demand.</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="prediction-glass-card">
                    <div className="card-header-with-icon">
                        <h3><FaTruckMoving/> Random Forest Supplier Matcher</h3>
                    </div>
                    <div className="input-group">
                        <label>Select Category Context:</label>
                        <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
                            <option value="">-- Choose a Category --</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.nom}</option>
                            ))}
                        </select>
                    </div>

                    {loadingSupplier && <div className="loader-text">Running Random Forest Classifier...</div>}

                    {supplierRecommendations.length > 0 && !loadingSupplier && (
                        <div className="suppliers-ranked-list">
                            <label>Ranked AI Recommendations:</label>
                            {supplierRecommendations.map((sup, idx) => (
                                <div key={sup.id_fournisseur}
                                     className={`supplier-rank-card ${idx === 0 ? 'first-pick' : ''}`}>
                                    <div className="sup-info">
                                        <span className="rank-number">#{idx + 1}</span>
                                        <div>
                                            <h4>{sup.name}</h4>
                                            <span className="badge-tag">{sup.recommendation}</span>
                                        </div>
                                    </div>
                                    <div className="sup-score">
                                        <span>AI Score</span>
                                        <strong>{sup.ai_score}%</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionDashboard;