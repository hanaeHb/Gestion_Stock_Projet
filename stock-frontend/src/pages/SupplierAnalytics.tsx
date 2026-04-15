import React, { useEffect, useState } from 'react';
import { FaMoneyBillWave, FaChartPie, FaCheckCircle, FaBoxes } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';
import "./SupplierAnalytics.css"

const SupplierAnalytics = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const profileRes = await axios.get("http://localhost:8888/service-fournisseur/api/fournisseurs/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const supplierId = profileRes.data.fournisseur.userId;

                const statsRes = await axios.get(`http://localhost:8888/quotation-service/api/quotations/stats/${supplierId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setStats(statsRes.data);
            } catch (err) {
                console.error("Error fetching analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="loader">Calculating Performance...</div>;
    if (!stats) return <p className="empty">No data available for analytics.</p>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="analytics-wrapper"
        >
            <header className="workspace-header">
                <div className="header-glass">
                    <h2><FaChartPie className="icon-pulse" /> Performance Analytics</h2>
                    <p>Real-time insights into your supply chain efficiency.</p>
                </div>
            </header>

            <div className="stats-grid-premium">
                {[
                    { label: "Total Revenue", val: `${stats.totalRevenue?.toLocaleString()} DH`, icon: <FaMoneyBillWave />, class: "revenue" },
                    { label: "Acceptance Rate", val: `${stats.acceptanceRate}%`, icon: <FaChartPie />, class: "rate" },
                    { label: "Accepted Quotes", val: stats.acceptedQuotes, icon: <FaCheckCircle />, class: "success" },
                    { label: "Total Requests", val: stats.totalQuotes, icon: <FaBoxes />, class: "requests" }
                ].map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`stat-card-modern ${item.class}`}
                    >
                        <div className="card-glass-effect"></div>
                        <div className="stat-icon-circle">{item.icon}</div>
                        <div className="stat-content">
                            <span className="stat-label">{item.label}</span>
                            <h3 className="stat-value">{item.val}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="detailed-analytics-row"
            >
                <div className="chart-preview-card">
                    <div className="chart-header">
                        <h3>Conversion Overview</h3>
                        <span className="live-badge">LIVE</span>
                    </div>
                    <div className="custom-progress-container">
                        <div className="progress-labels">
                            <span>Success Rate</span>
                            <span>{stats.acceptanceRate}%</span>
                        </div>
                        <div className="modern-progress-bar">
                            <motion.div
                                className="progress-fill-gradient"
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.acceptanceRate}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                    <div className="stats-legend-modern">
                        <div className="legend-item">
                            <span className="dot success"></span>
                            <div className="legend-text">
                                <strong>{stats.acceptedQuotes}</strong>
                                <small>Accepted</small>
                            </div>
                        </div>
                        <div className="legend-item">
                            <span className="dot refused"></span>
                            <div className="legend-text">
                                <strong>{stats.refusedQuotes}</strong>
                                <small>Refused</small>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SupplierAnalytics;