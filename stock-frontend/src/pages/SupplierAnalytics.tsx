import React, { useEffect, useState } from 'react';
import { FaMoneyBillWave, FaChartPie, FaCheckCircle, FaBoxes, FaExclamationTriangle, FaStar, FaChartLine } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import "./SupplierAnalytics.css";

interface ProductStat {
    productName: string;
    percentage: number;
    count: number;
}

const SupplierAnalytics = () => {
    const [stats, setStats] = useState<any>(null);
    const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>("");
    const [priceHistory, setPriceHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setError(null);
                const token = localStorage.getItem("token");

                if (!token) {
                    setError("No authentication token found. Please log in again.");
                    setLoading(false);
                    return;
                }

                const profileRes = await axios.get("http://localhost:8888/service-fournisseur/api/fournisseurs/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const supplierId = profileRes.data?.fournisseur?.idFournisseur || profileRes.data?.idFournisseur;

                if (!supplierId) {
                    setError("Could not resolve Supplier ID from profile registry.");
                    setLoading(false);
                    return;
                }

                const statsRes = await axios.get(`http://localhost:8888/quotation-service/api/quotations/stats/${supplierId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(statsRes.data);

                const prodsRes = await axios.get(`http://localhost:8888/quotation-service/api/quotations/stats/${supplierId}/products`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const productsData = prodsRes.data || [];
                setTopProducts(productsData);

                if (productsData.length > 0) {
                    setSelectedProduct(productsData[0].productName);
                }

            } catch (err: any) {
                console.error("❌ Error fetching premium analytics:", err);
                setError(err.response?.data?.message || "Failed to establish secure connection with microservices analytics module.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    useEffect(() => {
        const fetchPriceHistory = async () => {
            if (!selectedProduct) return;
            try {
                const token = localStorage.getItem("token");
                const profileRes = await axios.get("http://localhost:8888/service-fournisseur/api/fournisseurs/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const supplierId = profileRes.data?.fournisseur?.idFournisseur || profileRes.data?.idFournisseur;

                const res = await axios.get(`http://localhost:8888/quotation-service/api/quotations/stats/${supplierId}/price-evolution`, {
                    params: { productName: selectedProduct },
                    headers: { Authorization: `Bearer ${token}` }
                });

                // هنا كياخد الداتا ديناميكياً كيفما جات من الـ API تماماً بلا إضافات
                if (res.data && res.data.length > 0) {
                    setPriceHistory(res.data);
                } else {
                    setPriceHistory([]);
                }
            } catch (err) {
                console.error("⚠️ Error fetching price history:", err);
                setPriceHistory([]); // إيلا وقع خطأ أو مكانتش الداتا كيتصفر المبيان ديناميكياً
            }
        };

        fetchPriceHistory();
    }, [selectedProduct]);

    // Custom Tooltip ديناميكي كيقرا البيانات الحقيقية فقط
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="custom-forecasting-tooltip">
                    <p className="tooltip-month">{data.fullDate || data.name}</p>
                    <p className="tooltip-value">
                        <span className="bullet-green">●</span> Price Offered : <strong>{data.price} DH</strong>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="loader-container"><div className="modern-spinner"></div><p>Analyzing Supply Chain Pipeline...</p></div>;
    if (error) return <div className="error-panel-modern"><FaExclamationTriangle size={42} /><h3>Analytics Pipeline Offline</h3><p>{error}</p></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="analytics-wrapper-modern">

            {/* Header */}
            <header className="workspace-header-premium">
                <div className="header-glass-card">
                    <div className="header-text">
                        <h2><FaChartPie className="icon-pulse-purple" /> Business Intelligence</h2>
                        <p>Real-time telemetry and operational metrics for your products dashboard.</p>
                    </div>
                    <div className="live-pill"><span className="ping-dot"></span>LIVE SYNC</div>
                </div>
            </header>

            {/* Grid Cards */}
            <div className="stats-grid-v2">
                {[
                    { label: "Total Revenue", val: `${(stats?.totalRevenue || 0).toLocaleString()} DH`, icon: <FaMoneyBillWave />, class: "card-revenue" },
                    { label: "Acceptance Rate", val: `${stats?.acceptanceRate || 0}%`, icon: <FaChartPie />, class: "card-rate" },
                    { label: "Accepted Quotes", val: stats?.acceptedQuotes || 0, icon: <FaCheckCircle />, class: "card-success" },
                    { label: "Total Requests (RFQ)", val: stats?.totalQuotes || 0, icon: <FaBoxes />, class: "card-requests" }
                ].map((item, index) => (
                    <div key={index} className={`stat-card-v2 ${item.class}`}>
                        <div className="icon-wrapper-v2">{item.icon}</div>
                        <div className="content-v2">
                            <span className="label-v2">{item.label}</span>
                            <h3 className="value-v2">{item.val}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 1 */}
            <div className="analytics-double-row">
                <div className="chart-card-v2">
                    <div className="panel-header-v2">
                        <h3>Conversion Overview</h3>
                        <span className="badge-purple">Success Metrics</span>
                    </div>
                    <div className="progress-section-v2">
                        <div className="progress-labels-v2"><span>Global Acceptance Rate</span><span className="percentage-bold">{stats?.acceptanceRate || 0}%</span></div>
                        <div className="progressbar-container-v2"><motion.div className="progressbar-fill-v2" initial={{ width: 0 }} animate={{ width: `${stats?.acceptanceRate || 0}%` }} transition={{ duration: 1.2 }} /></div>
                    </div>
                    <div className="legend-grid-v2">
                        <div className="legend-box-v2"><span className="indicator-dot green"></span><div><h4>{stats?.acceptedQuotes || 0}</h4><small>Accepted</small></div></div>
                        <div className="legend-box-v2"><span className="indicator-dot red"></span><div><h4>{stats?.refusedQuotes || 0}</h4><small>Refused</small></div></div>
                    </div>
                </div>

                <div className="chart-card-v2">
                    <div className="panel-header-v2">
                        <h3>Top Demanded Products</h3>
                        <span className="badge-orange"><FaStar /> Hot Requests</span>
                    </div>
                    <div className="categories-list-v2">
                        {topProducts.map((prod, idx) => (
                            <div key={idx} className="category-item-v2">
                                <div className="cat-info-v2"><span className="cat-name">{prod.productName}</span><span className="cat-count">{prod.count} RFQs</span></div>
                                <div className="cat-bar-bg"><motion.div className="cat-bar-fill" initial={{ width: 0 }} animate={{ width: `${prod.percentage}%` }} transition={{ duration: 1 }} /></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 📈 الـ Row ديال المبيان الديناميكي بالكامل */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="chart-card-v2 price-evolution-card">
                <div className="panel-header-v2 price-header-flex">
                    <div className="title-with-icon">
                        <FaChartLine style={{ color: '#800020', fontSize: '1.3rem' }} />
                        <h3 style={{ color: '#800020', fontWeight: 'bold' }}>
                            Dynamic Price Track: {selectedProduct || "Product"}
                        </h3>
                    </div>

                    <select
                        className="modern-select-product"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                        {topProducts.map((prod, index) => (
                            <option key={index} value={prod.productName}>{prod.productName}</option>
                        ))}
                    </select>
                </div>

                <div className="recharts-wrapper-fix" style={{ width: '100%', height: 350, marginTop: '20px' }}>
                    {priceHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={priceHistory} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                                <CartesianGrid stroke="rgba(0,0,0,0.03)" vertical={false} />
                                <XAxis dataKey="name" stroke="#95a5a6" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#95a5a6" fontSize={12} tickLine={false} axisLine={false} unit=" DH" />

                                <Tooltip content={<CustomTooltip />} />

                                <Line
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#800020"
                                    strokeWidth={2.5}
                                    strokeDasharray="5 5"
                                    dot={{ r: 5, fill: '#800020', stroke: '#800020', strokeWidth: 1 }}
                                    activeDot={{ r: 7, fill: '#1abc9c', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="empty">No pricing trends available for this product yet.</p>
                    )}
                </div>
            </motion.div>

        </motion.div>
    );
};

export default SupplierAnalytics;