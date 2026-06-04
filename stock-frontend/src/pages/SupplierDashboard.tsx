import React, { useEffect, useState } from 'react';
import {
    FaPlus,
    FaFileAlt,
    FaExclamationTriangle,
    FaTags,
    FaBrain,
    FaAward,
    FaChartBar,
    FaUserShield,
    FaChevronRight,
    FaCheckCircle
} from 'react-icons/fa';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import "./SupplierDashboard.css";
import ApprovedQuotesPage from './ApprovedQuotesPage';

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
    const [showApprovedPage, setShowApprovedPage] = useState(false);
    const acceptedQuotes = notifications.filter((n: any) =>
        n.type === "QUOTE_FINALIZED" &&
        n.niveau === "SUCCESS" &&
        n.fournisseurId?.toString() === profile?.idFournisseur?.toString()
    );
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
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const categoryIds: number[] = specsRes.data || [];

                let allCategories: any[] = [];
                try {
                    const allCatsRes = await axios.get(`http://localhost:8888/produit-stock-service/v1/categories`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    allCategories = allCatsRes.data || [];
                } catch (err) {
                    console.error("⚠️ Failed to load category names, falling back to IDs:", err);
                }

                const fetchedRanks: AICategoryRank[] = [];

                for (const catId of categoryIds) {
                    try {
                        const predRes = await axios.get(
                            `http://localhost:8888/prediction-service/prediction/predict-best-supplier/${catId}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        const rankedList = predRes.data || [];
                        const myIndex = rankedList.findIndex(
                            (s: any) => s.id_fournisseur?.toString() === profile.idFournisseur?.toString()
                        );


                        const matchedCat = allCategories.find((c: any) => (c.idCategory === catId || c.id === catId));
                        const currentCategoryName = matchedCat?.nomCategory || matchedCat?.nom || `Category #${catId}`;

                        if (myIndex !== -1) {
                            fetchedRanks.push({
                                categoryName: currentCategoryName,
                                categoryId: catId,
                                aiScore: rankedList[myIndex].ai_score,
                                recommendation: rankedList[myIndex].recommendation,
                                rank: myIndex + 1
                            });
                        } else {
                            fetchedRanks.push({
                                categoryName: currentCategoryName,
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

                const sortedInsights = fetchedRanks.sort((a, b) => b.aiScore - a.aiScore);

                const finalComputedRanks = sortedInsights.map((item, index) => ({
                    ...item,
                    rank: index + 1
                }));

                setAiInsights(finalComputedRanks);

            } catch (error) {
                console.error("❌ Failed to resolve AI Telemetry:", error);
            } finally {
                setLoadingAI(false);
            }
        };

        fetchAIScores();
    }, [profile]);
    if (showApprovedPage) {
        return <ApprovedQuotesPage profile={profile} onBack={() => setShowApprovedPage(false)} />;
    }
    return (
        <div className="dashboard-container">
            <header className="workspace-header">
                <div className="dashboard-welcome">
                    <h2>Welcome back, {profile?.prenom || "Supplier"}! 👋</h2>
                    <p>Here’s your predictive market standing and operational overview.</p>
                </div>
            </header>

            {/* Action Grid */}
            <div className="action-grid">
                <button className="main-action-card" onClick={() => onNavigate("orders")}>
                    <div className="icon-box purple"><FaPlus/></div>
                    <span>Create New Quote</span>

                    <button className="stat-link-btn">Answer pending RFQs →</button>
                </button>

                <button className="main-action-card" onClick={() => onNavigate("specialization")}>
                    <div className="icon-box blue"><FaTags/></div>
                    <span>My Specializations</span>

                    <button className="stat-link-btn">Update categories →</button>
                </button>

                <div className="stat-card-premium" onClick={() => setShowApprovedPage(true)}>
                    <div className="stat-icon-bg" style={{background: 'linear-gradient(135deg, #ff9a9e20, #730d1908)'}}>
                        <FaCheckCircle style={{color: '#730d19'}}/>
                    </div>
                    <div className="stat-info">
                        <h3>{acceptedQuotes.length}</h3>
                        <p>Approved Quotes</p>
                    </div>
                    <button className="stat-link-btn">View →</button>
                </div>
            </div>

            <div className="dashboard-content-layout">

                <div className="ai-insights-panel">
                    <div className="card-header-v3">
                        <div className="ai-title-wrapper">
                            <div>
                                <h3><FaBrain className="brain-pulse-icon"/> AI Competitive Performance Standings</h3>
                                <p>
                                Live RandomForest regression tracking. Automatically sorted by your strongest
                                    category,
                                    calculated based on your 🚀 <strong>Delivery Speed</strong> and 💰 <strong>Pricing
                                    Performance</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {loadingAI ? (
                        <div className="ai-loading-box">
                            <div className="mini-spinner-purple"></div>
                            <p>Running ML Regression Models...</p>
                        </div>
                    ) : aiInsights.length > 0 ? (

                        <div className="ai-modern-rows-container">
                        <AnimatePresence>
                                {aiInsights.map((insight, idx) => (
                                    <motion.div
                                        key={insight.categoryId}
                                        layout
                                        className="ai-modern-row-card"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 120,
                                            damping: 14,
                                            delay: idx * 0.05
                                        }}
                                        whileHover={{ x: 5, backgroundColor: "rgba(243, 232, 255, 0.4)" }}
                                    >

                                        <div className="row-rank-badge">
                                            <span>#{insight.rank}</span>
                                        </div>

                                        <div className="row-main-info">
                                            <h4>{insight.categoryName}</h4>
                                            <span className={`ai-modern-pill ${insight.recommendation === 'TOP PICK' ? 'gold' : 'silver'}`}>
                                                <FaAward /> {insight.recommendation}
                                            </span>
                                        </div>


                                        <div className="row-metrics-section">
                                            <div className="row-score-meta">
                                                <span className="score-number">{insight.aiScore}%</span>
                                                <small>Score</small>
                                            </div>
                                            <div className="modern-progress-wrapper">
                                                <div className="modern-progress-bg">
                                                    <motion.div
                                                        className="modern-progress-fill"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(Math.max(insight.aiScore, 5), 100)}%` }}
                                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row-arrow-indicator">
                                            <FaChevronRight />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
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