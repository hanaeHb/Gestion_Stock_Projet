import React from 'react';
import { FaPlus, FaInbox, FaFileAlt, FaClock, FaCheckCircle, FaExclamationTriangle, FaTags } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';
import "./SupplierDashboard.css"
const SupplierDashboard = ({ profile, notifications, onNavigate }: any) => {

    const relevantActivities = notifications.filter((n: any) =>
        (n.niveau === "RFQ" || (n.type === "QUOTE_FINALIZED" && n.niveau === "SUCCESS")) &&
        n.fournisseurId?.toString() === profile?.idFournisseur?.toString()
    ).sort((a: any, b: any) => new Date(b.dateAlerte).getTime() - new Date(a.dateAlerte).getTime());

    const recentActivities = relevantActivities.slice(0, 5);

    const rfqCount = relevantActivities.filter((n: any) => n.niveau === "RFQ").length;
    const approvalCount = relevantActivities.filter((n: any) => n.type === "QUOTE_FINALIZED").length;
    return (
        <div className="dashboard-container">
            <header className="workspace-header">
                <div className="dashboard-welcome">
                    <h2>Welcome back, {profile?.prenom || "Supplier"}! 👋</h2>
                    <p>Here’s what's happening with your business today.</p>
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

                    <button className="main-action-card">
                        <div className="icon-box green"><FaFileAlt/></div>
                        <span>Approved Quotes</span>
                        {approvalCount > 0 && <span className="action-badge success">{approvalCount}</span>}
                    </button>
                </div>

                <div className="dashboard-content-layout">
                    <div className="recent-quotes-card">
                        <div className="card-header">
                            <h3>Recent Activity</h3>
                            <button className="btn-view-all" onClick={() => onNavigate("bell")}>View All</button>
                        </div>
                        <table className="dashboard-table">
                            <thead>
                            <tr>
                                <th>Activity</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {recentActivities.length > 0 ? (
                                recentActivities.map((notif: any) => (
                                    <tr key={notif._id}>
                                        <td style={{maxWidth: '350px', fontSize: '0.85rem', fontWeight: '500'}}>
                                            {notif.message}
                                        </td>
                                        <td style={{color: '#64748b'}}>
                                            {new Date(notif.dateAlerte).toLocaleDateString()}
                                        </td>
                                        <td>
                                    <span className={`badge ${notif.niveau === 'RFQ' ? 'pending' : 'accepted'}`}>
                                        {notif.niveau === 'RFQ' ? 'New Request' : 'Approved'}
                                    </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
                                        No relevant activities found for your account.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="alerts-side-card">
                        <h3>Quick Status</h3>
                        <div className="status-item-mini">
                            <FaCheckCircle color="#10b981"/>
                            <span>Profile: <strong>{profile?.status || "Active"}</strong></span>
                        </div>
                        <div className="status-item-mini">
                            <FaExclamationTriangle color="#f59e0b"/>
                            <span>Pending RFQs: <strong>{rfqCount}</strong></span>
                        </div>

                        <div className="mini-notification-list" style={{marginTop: '20px'}}>
                            <h4 style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px'}}>LATEST ALERT</h4>
                            {recentActivities[0] ? (
                                <div className="alert-item">
                                    <FaClock className="alert-icon"/>
                                    <p>{recentActivities[0].message}</p>
                                </div>
                            ) : (
                                <p style={{fontSize: '0.85rem', color: '#cbd5e1'}}>No alerts yet.</p>
                            )}
                        </div>
                    </div>
                </div>
        </div>
);
};

export default SupplierDashboard;