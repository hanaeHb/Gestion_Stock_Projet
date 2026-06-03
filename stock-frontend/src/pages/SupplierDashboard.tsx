import React, { useEffect, useState } from 'react';
import { FaPlus, FaFileAlt, FaExclamationTriangle, FaTags, FaBrain, FaAward, FaChartBar, FaUserShield } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';
import "./SupplierDashboard.css";

interface AICategoryRank {
    categoryName: string;
    categoryId: number;
    aiScore: number;
    recommendation: string;
    rank: number;
}

const SupplierDashboard = ({ profile, notifications, onNavigate }: any) => {
    const [aiInsights, setAiInsights] = useState<AICategoryRank[]>([]);
    const [loadingAI, setLoadingAI] = useState<boolean>(true);

    const relevantActivities = notifications.filter((n: any) =>
        (n.niveau === "RFQ" || (n.type === "QUOTE_FINALIZED" && n.niveau === "SUCCESS")) &&
        n.fournisseurId?.toString() === profile?.idFournisseur?.toString()
    );

    const rfqCount = relevantActivities.filter((n: any) => n.niveau === "RFQ").length;
    const approvalCount = relevantActivities.filter((n: any) => n.type === "QUOTE_FINALIZED").length;

    useEffect(() => {
        const fetchAIScores = async () => {
            if (!profile?.idFournisseur) return;
            try {
                setLoadingAI(true);
                const token = localStorage.getItem("token");

                const specsRes = await axios.get(
                    `http://localhost:8888/service-fournisseur/api/fournisseurs/${profile.idFournisseur}/specializations`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                const categoryIds: number[] = specsRes.data || [];
                const fetchedRanks: AICategoryRank[] = [];

                for (const catId of categoryIds) {
                    try {
                        const predRes = await axios.get(
                            `http://localhost:8888/prediction-service/prediction/predict-best-supplier/${catId}`,
                            {
                                headers: { Authorization: `Bearer ${token}` }
                            }
                        );

                        const rankedList = predRes.data || [];

                        const myIndex = rankedList.findIndex(
                            (s: any) => s.id_fournisseur?.toString() === profile.idFournisseur?.toString()
                        );

                        if (myIndex !== -1) {
                            fetchedRanks.push({
                                categoryName: `Category #${catId}`,
                                categoryId: catId,
                                aiScore: rankedList[myIndex].ai_score,
                                recommendation: rankedList[myIndex].recommendation,
                                rank: myIndex + 1
                            });
                        } else {
                            fetchedRanks.push({
                                categoryName: `Category #${catId}`,
                                categoryId: catId,
                                aiScore: 0,
                                recommendation: "RELIABLE",
                                rank: rankedList.length + 1
                            });
                        }
                    } catch (err) {
                        console.error(`Error fetching AI prediction for category ${catId}:`, err);
                    }
                }
                setAiInsights(fetchedRanks);

            } catch (error) {
                console.error("❌ Failed to resolve AI Telemetry:", error);
            } finally {
                setLoadingAI(false);
            }
        };

        fetchAIScores();
    }, [profile]);

    return (
        <div className="dashboard-container">
            <header className="workspace-header">
                <div className="dashboard-welcome">
                    <h2>Welcome back, {profile?.prenom || "Supplier"}! 👋</h2>
                    <p>Here’s your predictive market standing and operational overview.</p>
                </div>
            </header>

            <div className="action-grid">
                <button className="main-action-card" onClick={() => onNavigate("orders")}>
                    <div className="icon-box purple"><FaPlus/></div>
                    <span>Create New Quote</span>
                    <small style={{color: '#94a3b8'}}>Answer pending RFQs</small>
                </button>

                <button className="main-action-card" onClick={() => onNavigate("specialization")}>
                    <div className="icon-box blue"><FaTags/></div>
                    <span>My Specializations</span>
                    <small style={{color: '#94a3b8'}}>Update categories</small>
                </button>

                <button className="main-action-card" onClick={() => onNavigate("approved")}>
                    <div className="icon-box green"><FaFileAlt/></div>
                    <span>Approved Quotes</span>
                    {approvalCount > 0 && <span className="action-badge success">{approvalCount}</span>}
                </button>
            </div>

            <div className="dashboard-content-layout">

                <div className="ai-insights-panel">
                    <div className="card-header-v3">
                        <div className="ai-title-wrapper">
                            <FaBrain className="brain-pulse-icon" />
                            <div>
                                <h3>AI Algorithmic Competitive Matrix</h3>
                                <p>RandomForest regression matrix focused on your individual account profile.</p>
                            </div>
                        </div>
                    </div>

                    {loadingAI ? (
                        <div className="ai-loading-box">
                            <div className="mini-spinner-purple"></div>
                            <p>Running ML Regression Models...</p>
                        </div>
                    ) : aiInsights.length > 0 ? (
                        <div className="ai-cards-grid">
                            {aiInsights.map((insight, idx) => (
                                <motion.div
                                    key={idx}
                                    className="ai-ranking-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div className="ai-card-top">
                                        <span className="ai-cat-badge">{insight.categoryName}</span>
                                        <span className={`ai-rec-pill ${insight.recommendation === 'TOP PICK' ? 'gold' : 'silver'}`}>
                                            <FaAward /> {insight.recommendation}
                                        </span>
                                    </div>

                                    <div className="ai-score-display">
                                        <div className="big-score">
                                            <h4>{insight.aiScore}</h4>
                                            <small>AI Rating Score</small>
                                        </div>
                                        <div className="rank-badge">
                                            <span>Rank</span>
                                            <strong>#{insight.rank}</strong>
                                        </div>
                                    </div>

                                    <div className="ai-progress-section">
                                        <div className="progressbar-meta">
                                            <span>Algorithmic Performance</span>
                                            <span>{Math.min(Math.max(insight.aiScore, 0), 100)}%</span>
                                        </div>
                                        <div className="ai-progress-bar-bg">
                                            <div
                                                className="ai-progress-bar-fill"
                                                style={{ width: `${Math.min(Math.max(insight.aiScore, 5), 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="ai-empty-state">
                            <p>No predictive ranking available. Setup your specializations to activate AI matrix insights.</p>
                        </div>
                    )}
                </div>

                <div className="alerts-side-card">
                    <h3>Quick Status</h3>
                    <div className="status-item-mini">
                        <FaUserShield color="#10b981"/>
                        <span>Profile Registry: <strong>{profile?.status || "Active"}</strong></span>
                    </div>
                    <div className="status-item-mini">
                        <FaExclamationTriangle color="#f59e0b"/>
                        <span>Pending Requests: <strong>{rfqCount}</strong></span>
                    </div>

                    <div className="ai-efficiency-pills" style={{ marginTop: '25px' }}>
                        <h4 style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '12px' }}>METRIC SHIELD</h4>
                        <div className="efficiency-padd">
                            <FaChartBar /> <span>Live Sync With Eureka Cluster</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SupplierDashboard;