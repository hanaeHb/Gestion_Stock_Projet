import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaBell, FaExclamationTriangle, FaShoppingBag, FaTruck, FaCheckCircle, FaSync } from 'react-icons/fa';
import './AdminNotifications.css';

const AdminNotifications = ({ notifications, refresh, loading, setTotalCount }) => {

    const stockAlerts = notifications.filter(n => n.niveau === 'ERROR' || n.niveau === 'REPLENISHMENT_ORDER');
    const purchaseRequests = notifications.filter(n => n.type === 'NEW_ORDER_REQUEST' || n.type === 'QUOTE_RECEIVED');
    const logistics = notifications.filter(n => n.type === 'WAITING_CONFIRMATION' || n.type === 'AWAITING_RECEPTION' || n.type === 'ORDER_SHIPPED');
    const finalized = notifications.filter(n => n.type === 'CONFIRMED');
    useEffect(() => {
        const total = stockAlerts.length + purchaseRequests.length + logistics.length + finalized.length;
        setTotalCount(total);
    }, [notifications]);
    const renderGroup = (title, icon, data, color) => (
        <section className="admin-notif-group glass-panel">
            <div className="group-header" style={{ borderBottom: `3px solid ${color}` }}>
                <span className="group-icon" style={{ color: color }}>{icon}</span>
                <h3>{title}</h3>
                <span className="count-badge" style={{ background: color }}>{data.length}</span>
            </div>
            <div className="notif-scroll-area">
                {data.length > 0 ? data.map(n => (
                    <div key={n._id} className="admin-notif-item">
                        <div className="notif-content">
                            <p className="msg">{n.message}</p>
                            <div className="meta-tags">
                                {n.productName && <span className="tag product">{n.productName}</span>}
                                {n.quantite && <span className="tag qty">{n.quantite} Qty</span>}
                                {n.total_ligne && <span className="tag price">{n.total_ligne} DH</span>}
                                {n.sName && <span className="tag supplier">👤 {n.sName}</span>}
                            </div>
                        </div>
                        <div className="notif-footer">
                            <span className="status-pill">{n.type || n.niveau}</span>
                            <span className="time">{new Date(n.dateAlerte).toLocaleString()}</span>
                        </div>
                    </div>
                )) : <p className="empty-msg">No activity recorded yet.</p>}
            </div>
        </section>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="admin-notifs-page"
        >
            <div className="admin-notifs-header">
                <div className="title-section">
                    <h1><FaBell className="bell-icon"/> Notifications Center</h1>
                    <p>Monitor all microservices activities in real-time</p>
                </div>
                <button className="refresh-circle-btn" onClick={refresh} disabled={loading}>
                    <FaSync className={loading ? "spin" : ""}/>
                </button>
            </div>

            <div className="admin-notifs-grid">
                {renderGroup("Stock & Inventory", <FaExclamationTriangle/>, stockAlerts, "#ffb3b3")}
                {renderGroup("Purchasing (RFQ)", <FaShoppingBag />, purchaseRequests, "#ffe0b3")}
                {renderGroup("Logistics & Shipping", <FaTruck />, logistics, "#b3e0ff")}
                {renderGroup("Completed Operations", <FaCheckCircle />, finalized, "#c2f0c2")}
            </div>
        </motion.div>
    );
};

export default AdminNotifications;