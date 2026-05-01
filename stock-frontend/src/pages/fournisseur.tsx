import React, { useState, useEffect, ChangeEvent } from "react";
import "./fournisseur.css";
import {
    FaBell,
    FaChartBar,
    FaFolder,
    FaCog,
    FaUser,
    FaSignOutAlt,
    FaBoxes,
    FaUserTie,
    FaTags,
    FaTasks, FaCheckCircle, FaSyncAlt, FaCheck, FaBoxOpen, FaPlus
} from "react-icons/fa";
import { FaCamera, FaEnvelope, FaPhone, FaIdCard, FaBriefcase, FaCalendarAlt, FaStore } from "react-icons/fa";
import { FiGrid } from "react-icons/fi";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import SupplierAnalytics from "./SupplierAnalytics";
import SupplierDashboard from './SupplierDashboard';
interface Profile {
    userId?: number;
    idFournisseur?: number;
    nom?: string;
    prenom?: string;
    phone?: string;
    email?: string;
    cin?: string;
    status?: string;
    metierRole?: string;
    createdAt?: string;
    image?: string | null;
}
interface FournisseurResponse {
    message: string;
    fournisseur: Profile;
}
const OrderItemCard = ({ order, profile }: { order: any, profile: any }) => {
    const [decision, setDecision] = useState<"pending" | "accepted" | "refused">("pending");
    const [reason, setReason] = useState("");
    const [price, setPrice] = useState("");
    const [loading, setLoading] = useState(false);
    const handleSendQuote = async () => {
        if (!price || parseFloat(price) <= 0) {
            alert("Please enter a valid price");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            const payload = {
                id_commande: order.orderId || order._id,
                id_produit: order.productId ,
                pName: order.productName,
                id_supplier: profile?.userId?.toString(),
                sName: `${profile?.prenom} ${profile?.nom}`,
                supplierEmail: profile?.email,
                quantite: order.requestedQty || 1,
                prix_unitaire: parseFloat(price)
            };

            const res = await axios.post("http://localhost:8888/quotation-service/api/quotations", payload, {
                headers: {Authorization: `Bearer ${token}`}
            });

            if (res.status === 201) {
                alert("🚀 Quote submitted successfully!");
                setDecision("pending");
                setPrice("");
            }
        } catch (err: any) {
            console.error("Error:", err.message || err.response?.data);
            alert("Error sending quote. Check backend logs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div layout className={`order-stepper-card ${decision}`}>
            <div className="order-main-info">
                <div className="order-header-flex">
                    <h3>{order.productName || "Product Request"}</h3>
                    <span className="qty-badge">
                         {order.requestedQty || "0"} <small>UNITS</small>
                    </span>
                </div>
                <div className="order-sub-details">
                    <span className="order-id-tag">ID: #{order.productId?.toString().slice(-5)}</span>
                    <p className="manager-note">
                        <span
                            className="note-label">Note:</span> {order.message || "No specific instructions provided."}
                    </p>
                </div>
            </div>

            <div className="decision-bar">
                <button
                    className={`btn-choice accept ${decision === 'accepted' ? 'active' : ''}`}
                    onClick={() => setDecision("accepted")}
                    disabled={loading}
                >
                ✔ I have the stock
                </button>
                <button
                    className={`btn-choice refuse ${decision === 'refused' ? 'active' : ''}`}
                    onClick={() => setDecision("refused")}
                    disabled={loading}
                >
                    ✖ Out of stock
                </button>
            </div>

            <AnimatePresence mode="wait">
                {decision === "refused" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="action-sub-panel refuse-panel">
                        <textarea
                            placeholder="Why? (e.g. Stock finished)"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                        <button className="btn-send-refusal" onClick={() => alert("Refusal sent")}>Send Refusal</button>
                    </motion.div>
                )}
                {decision === "accepted" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="action-sub-panel accept-panel">
                        <div className="price-reveal-group">
                            <input
                                type="number"
                                placeholder="Price (DH)"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                            <button
                                className="btne-final-submit"
                                onClick={handleSendQuote}
                                disabled={loading}
                            >
                                {loading ? "Sending..." : "Submit Quote"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
export default function Fournisseur() {
    const [activeSection, setActiveSection] = useState<string>("dashboard");
    const [profile, setProfile] = useState<Profile | null>(null);
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await axios.get<FournisseurResponse>(
                    "http://localhost:8888/service-fournisseur/api/fournisseurs/me",
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log("API RESPONSE =>", res.data);
                setProfile(res.data.fournisseur);

            } catch (err: any) {
                console.error("ERROR =>", err.response?.data || err.message);
            }
        };
        fetchProfile();
    }, []);

    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        const token = localStorage.getItem("token");

        try {
            const res = await axios.put(
                "http://localhost:8888/service-fournisseur/api/fournisseurs/me",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            const updatedProfile = res.data.fournisseur;
            setProfile(res.data.fournisseur);
            setProfile(updatedProfile);

        } catch (err) {
            console.error("Error updating image", err);
        }
    };

    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCats, setSelectedCats] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:8888/produit-stock-service/v1/categories", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(res.data);
            } catch (err) {
                console.error("Error fetching categories", err);
            }
        };
        fetchCategories();
    }, []);

    const toggleCategory = (id: number) => {
        setSelectedCats(prev =>
            prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]
        );
    };

    const saveSpecialization = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");

            await axios.post(
                "http://localhost:8888/service-fournisseur/api/fournisseurs/specializations",
                {
                    idFournisseur: profile?.idFournisseur,
                    categoryIds: selectedCats
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Your specializations have been successfully registered ✅");
        } catch (err: any) {
            console.error("Error saving specializations", err.response?.data || err.message);
            alert("Error saving specializations.");
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const fetchMySpecializations = async () => {
            if (!profile?.idFournisseur) return;

            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(
                    `http://localhost:8888/service-fournisseur/api/fournisseurs/${profile.idFournisseur}/specializations`,                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setSelectedCats(res.data);
            } catch (err) {
                console.error("Error fetching specializations", err);
            }
        };

        fetchMySpecializations();
    }, [profile?.idFournisseur]);

    const [allNotifications, setAllNotifications] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8888/service-notification/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = res.data.notifications || res.data;

            console.log("RAW DATA FROM API:", res.data);
            setAllNotifications(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error("Error fetching notifications", err);
            setAllNotifications([]);
        }
    };

    useEffect(() => {
        if (activeSection === "bell") {
            fetchNotifications();
        }
    }, [activeSection]);

    const orderRequests = allNotifications.filter(n =>
        n.niveau === "RFQ" &&
        n.fournisseurId?.toString() === profile?.idFournisseur?.toString()
    );

    const quotationSuccessMessages = allNotifications.filter((n: any) =>
        n.type === "QUOTE_FINALIZED" &&
        n.niveau === "SUCCESS" &&
        n.fournisseurId?.toString() === profile?.idFournisseur?.toString()
    );

    const handleMarkAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`http://localhost:8888/service-notification/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications(); // Refresh
        } catch (err) {
            console.error("Error marking as read", err);
        }
    };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState<any>(null);
    const [deliveryTime, setDeliveryTime] = useState("");

    const openShipModal = (notif: any) => {
        setSelectedNotif(notif);
        setIsModalOpen(true);
    };

    const handleFinalShipment = async () => {
        if (!deliveryTime) {
            alert("Please enter a delivery time!");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.patch(
                `http://localhost:8888/service-commande/api/commandes/${selectedNotif.orderId}/ship`,
                {
                    productName: selectedNotif.productName,
                    productId:  selectedNotif.productId,
                    arrivalRange: deliveryTime,
                    totalPrice: selectedNotif.total_ligne,
                    quantity: selectedNotif.quantite,
                    unitPrice: selectedNotif.prix_unitaire || (selectedNotif.total_ligne / selectedNotif.quantite),
                    supplierName: selectedNotif.sName
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("🚀 Order Shipped & Invoice Generated with QR Code!");
            setIsModalOpen(false);
            setDeliveryTime("");
            fetchNotifications();
        } catch (err) {
            console.error("Error shipping:", err);
        }
    };
    const [showAll, setShowAll] = useState(false);
    const visibleCategories = showAll ? categories : categories.slice(0, 5);
    const [visibleOrdersCount, setVisibleOrdersCount] = useState(2);
    if (!profile) return <p>Loading profile...</p>;
    return (
        <div className="manager-container">

            {/* Sidebar */}
            <aside className="sidebar">
                <ul className="menu">
                    <li className={activeSection === "dashboard" ? "active" : ""}
                        onClick={() => setActiveSection("dashboard")}>
                        <FiGrid/>
                    </li>
                    <li className={activeSection === "orders" ? "active" : ""}
                        onClick={() => setActiveSection("orders")}>
                        <FaTasks/>
                    </li>
                    <li className={activeSection === "analytics" ? "active" : ""}
                        onClick={() => setActiveSection("analytics")}>
                        <FaChartBar/>
                    </li>
                    <li className={activeSection === "specialization" ? "active" : ""}
                        onClick={() => setActiveSection("specialization")}>
                        <FaTags/>
                    </li>
                </ul>

                <ul className="bottom-menu">
                    <li className={activeSection === "settings" ? "active" : ""}
                        onClick={() => setActiveSection("settings")}>
                        <FaCog/>
                    </li>
                    <li onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}>
                        <FaSignOutAlt/>
                    </li>
                </ul>
            </aside>

            {/* Main */}
            <main className="main">

                {/* Navbar */}
                <div className="top-nav">
                    <a href="/" className="nav-logo">
                        <span className="logo-box">GO</span>
                        <img src="/images/logoostock.jpeg" alt="logo" className="logo-image"/>
                    </a>

                    <div className="nav-right">
                        <div>
                            <ul className="menu">
                                <li className={activeSection === "bell" ? "active" : ""}
                                    onClick={() => setActiveSection("bell")}>
                                    <FaBell/>
                                </li>
                            </ul>
                        </div>

                        <div className="nav-avatar" onClick={() => setActiveSection("profile")}
                             style={{cursor: "pointer"}}>
                            {profile?.image ?
                                <img
                                    src={profile.image.startsWith('http')
                                        ? profile.image
                                        : `http://localhost:8888/service-fournisseur${profile.image}`}
                                    alt="Profile"
                                    className="nav-avatar-img"
                                /> : <FaUser size={24}/>}
                        </div>

                        <p>{profile?.prenom || ""}</p>
                    </div>
                </div>

                {/* Dashboard */}
                {activeSection === "dashboard" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <SupplierDashboard
                            profile={profile}
                            notifications={allNotifications}
                            onNavigate={(section: string) => setActiveSection(section)}
                        />
                    </motion.div>
                )}

                {activeSection === "bell" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="admin-notifs-page"
                    >
                        <div className="admin-notifs-header">
                            <div className="header-text-group">
                                <h1><FaBell className="bell-icon"/> Notifications Center</h1>
                                <p className="section-subtitle">Manage orders and system communications.</p>
                            </div>
                            <button className="refresh-circle-btn" onClick={fetchNotifications}>
                                <FaSyncAlt />
                            </button>
                        </div>

                        <div className="admin-notifs-grid-fournisseur">

                            <section className="admin-notif-group">
                                <div className="group-header" style={{ borderBottom: `3px solid #6c5ce7` }}>
                                    <FaTags style={{ color: '#6c5ce7', fontSize: '1.4rem' }} />
                                    <h3>New Order Requests</h3>
                                    <span className="count-badge" style={{ background: '#6c5ce7' }}>
                                         {orderRequests.length}
                                    </span>
                                </div>
                                <div className="notif-scroll-area">
                                    {orderRequests.length > 0 ? (
                                        orderRequests.map(notif => (
                                            <div key={notif._id} className="admin-notif-item">
                                                <p className="msg">{notif.message}</p>
                                                <div className="meta-tags">
                                                    <span className="tag product">New Request</span>
                                                    <button
                                                        className="btn-edit-small"
                                                        onClick={() => setActiveSection("orders")}
                                                    >
                                                        Set Price →
                                                    </button>
                                                </div>
                                                <span className="time">{new Date(notif.dateAlerte).toLocaleString()}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="empty">No pending orders.</p>
                                    )}
                                </div>
                            </section>
                            <section className="admin-notif-group">
                                <div className="group-header" style={{ borderBottom: `3px solid #4facfe` }}>
                                    <FaCheckCircle style={{ color: '#4facfe', fontSize: '1.4rem' }} />
                                    <h3>Order Approvals</h3>
                                    <span className="count-badge" style={{ background: '#4facfe' }}>
                                        {quotationSuccessMessages.length}
                                    </span>
                                </div>
                                <div className="notif-scroll-area">
                                    {quotationSuccessMessages.length > 0 ? (
                                        quotationSuccessMessages.map((notif) => (
                                            <div key={notif._id} className="admin-notif-item">
                                                <p className="msg">{notif.message}</p>
                                                <div className="meta-tags">
                                                    <span className="tag price">Approved</span>
                                                    {notif.type === "QUOTE_FINALIZED" && notif.niveau === "SUCCESS" && (
                                                        <button
                                                            className="btn-confirm"
                                                            style={{ padding: '5px 12px', fontSize: '11px' }}
                                                            onClick={() => openShipModal(notif)}
                                                        >
                                                            Send Invoice & Ship
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="time">{new Date(notif.dateAlerte).toLocaleString()}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="empty">No approvals yet.</p>
                                    )}
                                </div>
                            </section>

                            <section className="admin-notif-group">
                                <div className="group-header" style={{ borderBottom: `3px solid #ef4444` }}>
                                    <FaBoxes style={{ color: '#ef4444', fontSize: '1.4rem' }} />
                                    <h3>Stock Alerts</h3>
                                    <span className="count-badge" style={{ background: '#ef4444' }}>0</span>
                                </div>
                                <div className="notif-scroll-area">
                                    <p className="empty">All inventory levels are normal.</p>
                                </div>
                            </section>

                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {isModalOpen && (
                        <div className="modal-overlay" style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                        }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="ship-modal-content"
                                style={{
                                    background: 'white', padding: '30px', borderRadius: '15px',
                                    width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                                }}
                            >
                                <h3 style={{ marginBottom: '10px', color: '#333' }}>🚚 Shipping Confirmation</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                                    Setting arrival time for: <strong>{selectedNotif?.productName} of {selectedNotif.productId}</strong>
                                </p>

                                <div style={{ margin: '20px 0' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        Estimated Delivery Date/Time:
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 2 hours, Tomorrow at 10 AM..."
                                        value={deliveryTime}
                                        onChange={(e) => setDeliveryTime(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '8px',
                                            border: '1px solid #ddd', outline: 'none'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#eee' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleFinalShipment}
                                        style={{
                                            padding: '10px 20px', borderRadius: '8px', border: 'none',
                                            cursor: 'pointer', background: '#4facfe', color: 'white', fontWeight: 'bold'
                                        }}
                                    >
                                        Confirm & Generate Invoice
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {activeSection === "specialization" && (
                    <div className="specialization-panel fade-in">
                        <header className="workspace-header">
                            <h1><FaTags className="bell-icon"/>My Specializations</h1>
                            <p>Choose the product categories you can supply.</p>
                        </header>

                        <div className="categories-grid">
                            {visibleCategories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className={`category-card ${selectedCats.includes(cat.id) ? 'selected' : ''}`}
                                    onClick={() => toggleCategory(cat.id)}
                                >
                                    <div className="card-check">
                                        {selectedCats.includes(cat.id) ? <FaCheck/> : <FaPlus/>}
                                    </div>
                                    <div className="card-content">
                                        <div className="icon-wrapper"><FaBoxOpen/></div>
                                        <h4>{cat.nom}</h4>
                                        <p>{cat.description || "Certified Supplier"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {categories.length > 6 && (
                            <div className="show-more-container">
                                <button className="btn-show-more" onClick={() => setShowAll(!showAll)}>
                                    {showAll ? "Show Less" : `+ View All (${categories.length})`}
                                </button>
                            </div>
                        )}

                        <div className="action-bar">
                            <button className="btne-save-spec" onClick={saveSpecialization} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save my choices"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Orders */}
                {activeSection === "orders" && (
                    <div className="orders-workspace fade-in">
                        <header className="workspace-header">
                            <div className="header-with-badge">
                                <h2>Order Decision Center</h2>
                                <span className="total-orders-badge">
                                    {orderRequests.length} Pending Requests
                                 </span>
                            </div>
                            <p>Validate availability and submit pricing for each request below.</p>
                        </header>

                        <div className="orders-container">
                            {orderRequests.length > 0 ? (
                                <>
                                    {orderRequests.slice(0, visibleOrdersCount).map((order) => (
                                        <OrderItemCard key={order._id} order={order} profile={profile}/>
                                    ))}
                                    {orderRequests.length > 2 && (
                                        <div className="view-actions-container">
                                            {visibleOrdersCount < orderRequests.length ? (
                                                <button
                                                    className="btn-modern-view"
                                                    onClick={() => setVisibleOrdersCount(orderRequests.length)}
                                                >
                                                    <FaPlus/> View All Requests ({orderRequests.length})
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn-modern-view view-less"
                                                    onClick={() => setVisibleOrdersCount(2)}
                                                >
                                                    <FaSyncAlt/> View Less
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="empty-msg">
                                    <p>No pending orders to show at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Analytics */}
                {activeSection === "analytics" && (
                    <SupplierAnalytics/>
                )}

                {/* Settings */}
                {activeSection === "settings" && (
                    <div className="specialization-panel fade-in">
                        <header className="workspace-header">
                            <h1><FaCog className="bell-icon"/> Account Settings</h1>
                            <p>Customize your supplier experience and business rules.</p>
                        </header>

                        <div className="settings-grid">
                            {/* Business Preferences */}
                            <div className="recent-quotes-card">
                                <h3>Business Rules</h3>
                                <div className="setting-row">
                                    <label>Shipping Provided?</label>
                                    <input type="checkbox" className="ios-switch"/>
                                </div>
                                <div className="setting-row">
                                    <label>Min. Order Value (DH)</label>
                                    <input type="number" placeholder="500" className="mini-input"/>
                                </div>
                            </div>

                            {/* Notification Toggles */}
                            <div className="setting-card">
                                <h3><FaBell/> Notifications</h3>

                                <div className="setting-row">
                                    <div>
                                        <label>New RFQ Alerts</label>
                                        <span className="setting-info-text">Notify me when new requests match my categories</span>
                                    </div>
                                    <input type="checkbox" className="ios-switch" defaultChecked/>
                                </div>

                                <div className="setting-row">
                                    <div>
                                        <label>Email Reports</label>
                                        <span
                                            className="setting-info-text">Receive weekly summary of your performance</span>
                                    </div>
                                    <input type="checkbox" className="ios-switch"/>
                                </div>
                            </div>
                        </div>

                        <div className="action-bar">
                            <button className="btne-save-spec">Update My Settings</button>
                        </div>
                    </div>
                )}

                {/* Profile */}
                {activeSection === "profile" && profile && (
                    <div className="frn-profile-wrapper fade-in">
                        <div className="frn-profile-card">
                            <div className="frn-profile-header">
                                <div className="frn-avatar-section">
                                    <div className="frn-avatar-wrapper">
                                        <div className="frn-avatar-overlay">
                                            <FaCamera />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="frn-avatar-input"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                        {profile.image ? (
                                            <img
                                                src={profile.image.startsWith('http')
                                                    ? profile.image
                                                    : `http://localhost:8888/service-fournisseur${profile.image}`}
                                                alt="Profile"
                                                className="frn-avatar-img"
                                            />
                                        ) : (
                                            <div className="frn-avatar-placeholder">
                                                <FaUser size={45} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="frn-header-info">
                                    <h2 className="frn-user-name">
                                        {profile.prenom || ""} {profile.nom || ""}
                                    </h2>
                                    <p className="frn-role-tag">
                                        <FaStore /> Official Supplier #{profile.idFournisseur || "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div className="frn-profile-intro">
                                As a registered Supplier, you can manage your product catalog, respond to quote
                                requests (RFQs), and track your delivery performance within the platform.
                            </div>

                            <div className="frn-form-grid">
                                <div className="frn-input-group">
                                    <label><FaUser/> First Name</label>
                                    <input value={profile.prenom || ""} readOnly className="frn-readonly"/>
                                </div>

                                <div className="frn-input-group">
                                    <label><FaUser/> Last Name</label>
                                    <input value={profile.nom || ""} readOnly className="frn-readonly"/>
                                </div>

                                <div className="frn-input-group">
                                    <label><FaEnvelope/> Email Address</label>
                                    <input value={profile.email || ""} readOnly className="frn-readonly"/>
                                </div>

                                <div className="frn-input-group">
                                    <label><FaPhone/> Phone Number</label>
                                    <input value={profile.phone || ""} readOnly className="frn-readonly"/>
                                </div>

                                <div className="frn-input-group">
                                    <label><FaIdCard/> CIN</label>
                                    <input value={profile.cin || ""} readOnly className="frn-readonly"/>
                                </div>

                                <div className="frn-input-group">
                                    <label><FaCheckCircle/> Account Status</label>
                                    <div className="frn-status-container">
                                        <span className={`frn-status-badge ${profile.status?.toLowerCase() || 'validated'}`}>
                                            {profile.status || "VALIDATED"}
                                        </span>
                                    </div>
                                </div>

                                <div className="frn-input-group">
                                    <label><FaBriefcase/> Role</label>
                                    <input value={"Fournisseur"} readOnly className="frn-readonly"/>
                                </div>

                                <div className="frn-input-group">
                                    <label><FaCalendarAlt/> Join Date</label>
                                    <input
                                        value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ""}
                                        readOnly
                                        className="frn-readonly"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}