import React, { useState, useEffect } from "react";
import "./ProcurementManager.css";
import {
    FaBell,
    FaChartBar,
    FaFolder,
    FaCog,
    FaUser,
    FaSignOutAlt,
    FaBoxes, FaUserTie, FaInbox, FaFileInvoiceDollar, FaDownload, FaSync, FaTruck
} from "react-icons/fa";
import {FiGrid, FiTrendingUp} from "react-icons/fi";
import axios from "axios";
import PurchaseBudgetTracker from "./PurchaseBudgetTracker";
import OrderWizard from "./OrderWizard";
import QuotesManagement from "./QuotesManagement";
import ShipmentDetails from "./ShipmentDetails";

export default function ProcurementManager() {

    const [activeSection, setActiveSection] = useState("dashboard");
    const [profile, setProfile] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);
    useEffect(() => {

        const fetchProfile = async () => {

            try {

                const token = localStorage.getItem("token");

                const res = await axios.get(
                    "http://localhost:8888/usersservice/v1/user-profiles/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                console.log(res.data);

                setProfile(res.data);

            } catch (err) {
                console.error("Error loading profile", err);
            }

        };

        fetchProfile();

    }, []);

    const [pendingFournisseurs, setPendingFournisseurs] = useState([]);

    const updateNotificationStatus = async (notificationId, status, userId) => {
        try {
            const token = localStorage.getItem("token");

            await axios.put(
                `http://localhost:8888/service-notification/api/notifications/${notificationId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await axios.patch(
                `http://localhost:8888/security-stock/v1/users/${userId}/status`,
                {
                    active: status === "validated"
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Status mis à jour ✅");

            setPendingFournisseurs(prev => {
                const newList = prev.filter(f => f._id !== notificationId);
                setNotificationCount(newList.length);
                return newList;
            });

        } catch (err) {
            console.error(err.response?.data || err.message);
            alert("Erreur update fournisseur");
        }
    };

    const validateFournisseur = (id) => updateNotificationStatus(id, "validated");
    const rejectFournisseur = (id) => updateNotificationStatus(id, "rejected");
    const [validatedFournisseurs, setValidatedFournisseurs] = useState([]);
    useEffect(() => {
        const fetchPending = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:8888/service-notification/api/notifications/pending", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPendingFournisseurs(res.data);
                setNotificationCount(res.data.length);
            } catch (err) {
                console.error("Erreur fetching pending fournisseurs", err);
            }
        };

        const fetchValidated = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:8888/service-notification/api/notifications/validated", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Erreur fetch validated");
                const data = await res.json();
                const arrayData = Array.isArray(data) ? data : data.fournisseurs || [];
                setValidatedFournisseurs(arrayData);
            } catch (err) {
                console.error("Error fetching validated fournisseurs:", err);
                setValidatedFournisseurs([]);
            }
        };

        fetchPending();
        fetchValidated();
    }, []);

    const [loading, setLoading] = useState(false);
        const fetchAllNotifications = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const resAll = await axios.get("http://localhost:8888/service-notification/api/notifications", config);

                const data = Array.isArray(resAll.
                    data) ? resAll.data : (resAll.data.notifications || []);
                setAllNotifications(data);

                const pending = data.filter(n => n.statut === "PENDING");
                const restock = data.filter(n => n.niveau === "REPLENISHMENT_ORDER");
                const quotes = data.filter(n => n.type === "QUOTE_RECEIVED");
                const shipments = data.filter(n => n.type === "WAITING_CONFIRMATION");

                setPendingFournisseurs(pending);
                setReplenishmentRequests(restock);

                setNotificationCount(pending.length + restock.length + quotes.length + shipments.length);

                setLoading(false);
            } catch (err) {
                console.error("Error fetching all notifications:", err);
                setLoading(false);
            }
        };
    useEffect(() => {
        fetchAllNotifications();
    }, [activeSection]);
    const downloadCV = async (cvFile) => {
        try {
            if (!cvFile) {
                alert("CV not available");
                return;
            }

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `http://localhost:8888/security-stock/v1/users/download/${cvFile}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob"
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", cvFile);
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (err) {
            console.error("Error downloading CV:", err.response || err.message);
            alert("Failed to download CV. Make sure you are logged in.");
        }
    };
    const [replenishmentRequests, setReplenishmentRequests] = useState([]);
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:8888/service-notification/api/notifications/replenishment-requests", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReplenishmentRequests(res.data);
            } catch (err) {
                console.error("Error fetching replenishment requests:", err);
            }
        };

        if (activeSection === "restock_orders" || activeSection === "dashboard") {
            fetchRequests();
        }
    }, [activeSection]);

    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [allNotifications, setAllNotifications] = useState([]);
    const quoteNotifications = allNotifications.filter(n => n.type === "QUOTE_RECEIVED");
    const handleConfirmReception = async (notif) => {
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const receptionData = {
                produitId: notif.productId,
                totalPrice: notif.total_ligne,
                quantite: notif.quantite,
            };
            await axios.post(
                `http://localhost:8888/produit-stock-service/v1/mouvements/confirm-reception`,
                receptionData,
                config
            );

            await axios.patch(
                `http://localhost:8888/service-notification/api/notifications/${notif._id}/confirm-arrival`,
                {},
                config
            );

            alert("✅ Successfully completed: The item has been received and status updated!");
            fetchAllNotifications();

        } catch (err) {
            console.error("Reception Error:", err);
            const errorMsg = err.response?.data || "Error connecting to service";
            alert("❌ failed:" + errorMsg);
        }
    };
    return (
        <div className="manager-container">

            {/* Sidebar */}
            <aside className="sidebar">

                <ul className="menu">

                    <li className={activeSection === "dashboard" ? "active" : ""}
                        onClick={() => setActiveSection("dashboard")}>
                        <FiGrid/>
                    </li>

                    <li className={activeSection === "fournisseurs" ? "active" : ""}
                        onClick={() => setActiveSection("fournisseurs")}>
                        <FaUserTie/>
                    </li>

                    <li className={activeSection === "quotes" ? "active" : ""}
                        onClick={() => setActiveSection("quotes")}>
                        <FaChartBar/>
                    </li>
                    <li className={activeSection === "restock_orders" ? "active" : ""}
                        onClick={() => setActiveSection("restock_orders")}>
                        <FaInbox/>
                    </li>
                    <li className={activeSection === "budget" ? "active" : ""}
                        onClick={() => setActiveSection("budget")}>
                        <FiTrendingUp/>
                    </li>
                </ul>

                <ul className="bottom-menu">

                    <li className={activeSection === "settings" ? "active" : ""}
                        onClick={() => setActiveSection("settings")}>
                    <FaCog/>
                    </li>

                    <li onClick={() => {
                        localStorage.removeItem("token");
                        window.location.href = "/login";
                    }}>
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
                            {notificationCount > 0 && <span className="badge-number">{notificationCount}</span>}
                        </div>

                        <div className="nav-avatar"
                             onClick={() => setActiveSection("profile")}
                             style={{cursor: "pointer"}}>
                            {profile?.image ? (
                                <img src={profile.image} alt="avatar" className="nav-avatar-img"/>
                            ) : (
                                <FaUser size={24}/>
                            )}
                        </div>

                        <p>{profile?.prenom || ""}</p>

                    </div>

                </div>

                {activeSection === "budget" && <PurchaseBudgetTracker />}
                {activeSection === "bell" && (
                    <div className="admin-notifs-page">
                        <div className="admin-notifs-header">
                            <div>
                                <h1><FaBell className="bell-icon"/> Notifications Center</h1>
                                <p>Manage your inventory alerts and supplier requests.</p>
                            </div>
                            <button
                                className="refresh-circle-btn"
                                onClick={fetchAllNotifications}
                                disabled={loading}
                            >
                                <FaSync className={loading ? "spin" : ""} />
                            </button>
                        </div>

                        <div className="admin-notifs-grid">

                            {/* 1. Replenishment Requests */}
                            <section className="admin-notif-group">
                                <div className="group-header" style={{ borderBottom: '3px solid #FFB347' }}>
                                    <FaInbox style={{color: '#FFB347', fontSize: '1.2rem'}}/>
                                    <h3>Replenishment Requests</h3>
                                    <span className="count-badge" style={{background: '#FFB347'}}>
                                        {replenishmentRequests.length}
                                    </span>
                                </div>
                                <div className="notif-scroll-area">
                                    {replenishmentRequests.length > 0 ? (
                                        replenishmentRequests.map(req => (
                                            <div key={req._id} className="admin-notif-item" onClick={() => setActiveSection("restock_orders")}>
                                                <div className="notif-content">
                                                    <p className="msg"><strong>{req.productName}</strong>: New restock request for {req.requestedQty} units.</p>
                                                    <div className="meta-tags">
                                                        <span className="tag product">Product</span>
                                                        <span className="tag qty">{req.requestedQty} Units</span>
                                                    </div>
                                                    <span className="time">From: {req.fromManager} • {new Date(req.dateAlerte).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-msg">✅ No pending restock requests.</div>
                                    )}
                                </div>
                            </section>

                            {/* 2. Supplier Registrations */}
                            <section className="admin-notif-group">
                                <div className="group-header" style={{ borderBottom: '3px solid #4facfe' }}>
                                    <FaUserTie style={{color: '#4facfe', fontSize: '1.2rem'}}/>
                                    <h3>Supplier Registrations</h3>
                                    <span className="count-badge" style={{background: '#4facfe'}}>
                                        {pendingFournisseurs.length}
                                    </span>
                                </div>
                                <div className="notif-scroll-area">
                                    {pendingFournisseurs.length > 0 ? (
                                        pendingFournisseurs.map(f => (
                                            <div key={f._id} className="admin-notif-item" onClick={() => setActiveSection("fournisseurs")}>
                                                <div className="notif-content">
                                                    <p className="msg"><strong>{f.firstName} {f.lastName}</strong> applied as a new supplier.</p>
                                                    <div className="meta-tags">
                                                        <span className="tag">New Applicant</span>
                                                    </div>
                                                    <span className="time">{new Date(f.dateAlerte).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-msg">No new supplier applications.</div>
                                    )}
                                </div>
                            </section>

                            {/* 3. Supplier Quotes */}
                            <section className="admin-notif-group">
                                <div className="group-header" style={{ borderBottom: '3px solid #2ecc71' }}>
                                    <FaFileInvoiceDollar style={{color: '#2ecc71', fontSize: '1.2rem'}}/>
                                    <h3>Supplier Quotes</h3>
                                    <span className="count-badge" style={{background: '#2ecc71'}}>
                        {quoteNotifications.length}
                    </span>
                                </div>
                                <div className="notif-scroll-area">
                                    {quoteNotifications.length > 0 ? (
                                        quoteNotifications.map(notif => (
                                            <div key={notif._id} className="admin-notif-item" onClick={() => setActiveSection("quotes")}>
                                                <div className="notif-content">
                                                    <p className="msg"><strong>Offer Received:</strong> {notif.message}</p>
                                                    <div className="meta-tags">
                                                        <span className="tag price">Pending Quote</span>
                                                    </div>
                                                    <span className="time">{new Date(notif.dateAlerte).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-msg">No new quotes received yet.</div>
                                    )}
                                </div>
                            </section>

                            {/* 4. Shipment Tracking  */}
                            <section className="admin-notif-group">
                                <div className="group-header" style={{ borderBottom: '3px solid #6952d2' }}>
                                    <FaTruck style={{color: '#6952d2', fontSize: '1.2rem'}}/>
                                    <h3>Shipment Tracking</h3>
                                    <span className="count-badge" style={{background: '#6952d2'}}>
                                     {allNotifications.filter(n => n.type === "WAITING_CONFIRMATION").length}
                                    </span>
                                </div>
                                <div className="notif-scroll-area">
                                    {allNotifications.filter(n => n.type === "WAITING_CONFIRMATION").length > 0 ? (
                                        allNotifications.filter(n => n.type === "WAITING_CONFIRMATION").map(notif => (
                                            <div key={notif._id} className="admin-notif-item">
                                                <div className="notif-content">
                                                    <p className="msg"><strong>In Transit 🚢</strong>: {notif.message}</p>

                                                    <ShipmentDetails
                                                        arrivalRange={notif.arrivalRange}
                                                        qrCode={notif.qrCode}
                                                        invoiceUrl={notif.invoiceUrl}
                                                    />

                                                    <button
                                                        className="btn-confirm-arrival-modern"
                                                        onClick={() => handleConfirmReception(notif)}
                                                    >
                                                        Confirm Goods Received
                                                    </button>
                                                    <span className="time">{new Date(notif.dateAlerte).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-msg">📦 No active shipments.</div>
                                    )}
                                </div>
                            </section>

                        </div>
                    </div>
                )}

                {activeSection === "quotes" && <QuotesManagement/>}
                {/* Dashboard */}
                {activeSection === "dashboard" && (
                    <>
                        <header className="header">
                            <h1>Manager Dashboard</h1>
                            <p className="subtitle">
                                Monitor inventory performance and stock status.
                            </p>
                        </header>

                        <section className="cards">

                            <div className="card">
                                <div className="card-icon"><FaBoxes/></div>
                                <h3>1,248</h3>
                                <p>Total Products</p>
                            </div>

                            <div className="card">
                                <div className="card-icon"><FaChartBar/></div>
                                <h3>82</h3>
                                <p>Low Stock</p>
                            </div>

                            <div className="card">
                                <div className="card-icon"><FaFolder/></div>
                                <h3>36</h3>
                                <p>Categories</p>
                            </div>

                            <div className="card" onClick={() => setActiveSection("restock_orders")}
                                 style={{cursor: 'pointer'}}>
                                <div className="card-icon"><FaInbox/></div>
                                <h3>{replenishmentRequests.length}</h3>
                                <p>New Restock Requests</p>
                            </div>

                        </section>
                    </>
                )}
                {activeSection === "restock_orders" && (
                    <div className="restock-modern-container fade-in">
                        <header className="restock-header-modern">
                            <div className="header-text">
                                <h1><FaInbox className="header-icon-anim" /> Critical Replenishment</h1>
                                <p>High-priority orders waiting for your approval</p>
                            </div>
                            <div className="header-badge">
                                <span className="pulse-dot"></span>
                                {replenishmentRequests.length} Requests Pending
                            </div>
                        </header>

                        <div className="restock-grid">
                            {replenishmentRequests.length === 0 ? (
                                <div className="empty-state-card">
                                    <FaInbox size={50} />
                                    <p>Great job! No pending requests at the moment.</p>
                                </div>
                            ) : (
                                replenishmentRequests.map((req) => (
                                    <div key={req._id} className="restock-card-modern">
                                        <div className="card-status-line"></div>
                                        <div className="card-body">
                                            <div className="product-info-row">
                                                <div className="p-avatar">
                                                    {req.productName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="p-details">
                                                    <h3>{req.productName}</h3>
                                                    <span className="p-id">SKU: {req.sku}</span>
                                                </div>
                                                <div className="p-category">
                                                    <span className="cat-badge">{req.category || "General"}</span>
                                                </div>
                                            </div>

                                            <div className="stats-row">
                                                <div className="stat-box">
                                                    <span className="stat-label">Quantity</span>
                                                    <span className="stat-value highlight">{req.requestedQty} Units</span>
                                                </div>
                                                <div className="stat-box">
                                                    <span className="stat-label">Requested By</span>
                                                    <span className="stat-value">{req.fromManager}</span>
                                                </div>
                                                <div className="stat-box">
                                                    <span className="stat-label">Request Date</span>
                                                    <span className="stat-value">{new Date(req.dateAlerte || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="card-actions">
                                                <button
                                                    className="btn-order-premium"
                                                    onClick={() => {
                                                        setCurrentRequest(req);
                                                        setIsWizardOpen(true);
                                                    }}
                                                >
                                                    Approve & Process Order
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <OrderWizard
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                    selectedRequest={currentRequest}
                    onSuccess={(id) => {
                        setReplenishmentRequests(prev => prev.filter(r => r._id !== id));
                        alert("Commande traitée avec succès !");
                    }}
                />



                {activeSection === "settings" && (
                    <div className="panel large">
                        <h3>Manager Settings</h3>
                        <p>Configure inventory preferences and system options.</p>
                    </div>
                )}

                {activeSection === "profile" && (
                    <div className="profile-panel">
                        <h3>Personal Information</h3>

                        <div className="profile-intro">
                            The Procurement Manager supervises inventory, products, and analytics. Responsibilities
                            include monitoring stock levels, tracking performance, and coordinating with staff for
                            efficient workflow.
                        </div>

                        <div className="profile-avatar-section">
                            <div className="avatar-container">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="avatar-input"
                                    onChange={async e => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = async () => {
                                                const imageBase64 = reader.result; // hna base64
                                                setProfile({...profile, image: imageBase64});

                                                try {
                                                    const token = localStorage.getItem("token");
                                                    await axios.put(
                                                        `http://localhost:8888/usersservice/v1/user-profiles/me`,
                                                        {image: imageBase64},
                                                        {
                                                            headers: {
                                                                Authorization: `Bearer ${token}`
                                                            }
                                                        }
                                                    );
                                                    console.log("Image updated!");
                                                } catch (err) {
                                                    console.error("Error updating image", err);
                                                }
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                {profile?.image ? (
                                    <img src={profile.image} alt="Profile" className="profile-avatar-img"/>
                                ) : (
                                    <FaUser size={90} className="profile-avatar-icon"/>
                                )}
                            </div>
                            <h2 className="upload-text">{profile?.prenom || ""} {profile?.nom || ""}</h2>
                        </div>

                        {/* Inputs row */}
                        <div className="profile-info-two-columns">
                            <div className="form-group"><label>First Name</label><input type="text"
                                                                                        value={profile?.nom || ""}
                                                                                        readOnly/></div>
                            <div className="form-group"><label>Last Name</label><input type="text"
                                                                                       value={profile?.prenom || ""}
                                                                                       readOnly/></div>
                        </div>

                        <div className="profile-info-two-columns">
                            <div className="form-group"><label>Email</label><input type="email"
                                                                                   value={profile?.email || ""}
                                                                                   readOnly/></div>
                            <div className="form-group"><label>Phone</label><input
                                type="text"
                                value={profile?.phone || ""}
                                onChange={e => setProfile({...profile, phone: e.target.value})}
                            /></div>
                        </div>

                        <div className="profile-info-two-columns">
                            <div className="form-group"><label>CIN</label><input
                                type="text"
                                value={profile?.cin || ""}
                                onChange={e => setProfile({...profile, cin: e.target.value})}
                            />
                            </div>
                            <div className="form-group"><label>Status</label><input type="text"
                                                                                    value={profile?.status || ""}
                                                                                    readOnly/></div>
                        </div>

                        <div className="profile-info-two-columns">
                            <div className="form-group"><label>Role</label><input type="text"
                                                                                  value={profile?.metierRole || "Procurement Manager"}
                                                                                  readOnly/></div>
                            <div className="form-group"><label>Join Date</label><input type="text"
                                                                                       value={profile?.createdAt || " "}
                                                                                       readOnly/></div>
                        </div>

                        <div className="profile-actions">
                            <button
                                className="change-btn"
                                onClick={async () => {
                                    try {
                                        const token = localStorage.getItem("token");

                                        // hna ghi les fields editable
                                        const updatedData = {
                                            phone: profile?.phone,
                                            cin: profile?.cin,
                                        };

                                        const res = await axios.put(
                                            `http://localhost:8888/usersservice/v1/user-profiles/me`,
                                            updatedData,
                                            {
                                                headers: {Authorization: `Bearer ${token}`},
                                            }
                                        );

                                        setProfile(res.data); // update local state
                                        alert("Profile updated successfully ✅");
                                    } catch (err) {
                                        console.error("Error updating profile", err.response || err.message);
                                        alert("Failed to update profile.");
                                    }
                                }}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === "fournisseurs" && (
                    <div className="fs-section-container animate-fade-in">
                        {/* --- Header 1: Pending --- */}
                        <div className="fs-main-header">
                            <div className="header-text">
                                <h1>Pending Suppliers</h1>
                                <p>Approve or reject the new supplier requests to join the platform.</p>
                            </div>
                            <div className="fs-stats-badge yellow">
                                {pendingFournisseurs.length} Waiting
                            </div>
                        </div>

                        <div className="fs-card-wrapper">
                            <div className="fs-table-responsive">
                                {pendingFournisseurs.length === 0 ? (
                                    <div className="empty-state">No suppliers waiting for approval.</div>
                                ) : (
                                    <table className="fs-modern-table">
                                        <thead>
                                        <tr>
                                            <th>Supplier Name</th>
                                            <th>Contact Details</th>
                                            <th>CIN</th>
                                            <th>Role</th>
                                            <th>Date</th>
                                            <th>Document</th>
                                            <th style={{ textAlign: "center" }}>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {pendingFournisseurs.map((f) => (
                                            <tr key={f._id}>
                                                <td>
                                                    <div className="fs-user-info">
                                                        <div className="fs-avatar-sm">{f.firstName?.charAt(0)}</div>
                                                        <strong>{f.firstName} {f.lastName}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="fs-contact-cell">
                                                        <span>{f.email}</span>
                                                        <small>{f.phone}</small>
                                                    </div>
                                                </td>
                                                <td><span className="fs-cin-badge">{f.cin}</span></td>
                                                <td><span className="fs-role-tag">{f.role}</span></td>
                                                <td>{new Date(f.dateAlerte).toLocaleDateString()}</td>
                                                <td>
                                                    {f.cvFile ? (
                                                        <button className="fs-download-btn light" onClick={() => downloadCV(f.cvFile.replace(/^\/?uploads\/cv\//, ''))}>
                                                            <FaDownload /> CV
                                                        </button>
                                                    ) : <span className="no-data">N/A</span>}
                                                </td>
                                                <td>
                                                    <div className="fs-actions-gap">
                                                        <button
                                                            className="fs-btn-validate"
                                                            onClick={() => updateNotificationStatus(f._id, "validated", f.userId)}
                                                        >
                                                            Validate
                                                        </button>
                                                        <button
                                                            className="fs-btn-reject"
                                                            onClick={() => rejectFournisseur(f._id)}
                                                        >
                                                            Refuse
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* --- Header 2: Validated --- */}
                        <div className="fs-main-header" style={{ marginTop: '40px' }}>
                            <div className="header-text">
                                <h1>Validated Suppliers</h1>
                                <p>Manage your existing verified suppliers and their account status.</p>
                            </div>
                            <div className="fs-stats-badge green">
                                {validatedFournisseurs.length} Verified
                            </div>
                        </div>

                        <div className="fs-card-wrapper">
                            <div className="fs-table-responsive">
                                {validatedFournisseurs.length === 0 ? (
                                    <div className="empty-state">No validated suppliers found.</div>
                                ) : (
                                    <table className="fs-modern-table">
                                        <thead>
                                        <tr>
                                            <th>Supplier Name</th>
                                            <th>Email & Phone</th>
                                            <th>CIN</th>
                                            <th>Approved Date</th>
                                            <th>CV</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {validatedFournisseurs.map(f => (
                                            <tr key={f._id || f.id}>
                                                <td>
                                                    <div className="fs-user-info">
                                                        <div className="fs-avatar-sm green-style">{f.firstName?.charAt(0)}</div>
                                                        <strong>{f.firstName} {f.lastName}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="fs-contact-cell">
                                                        <span>{f.email}</span>
                                                        <small>{f.phone}</small>
                                                    </div>
                                                </td>
                                                <td><span className="fs-cin-badge">{f.cin}</span></td>
                                                <td>{new Date(f.dateAlerte).toLocaleDateString()}</td>
                                                <td>
                                                    {f.cvFile ? (
                                                        <button className="fs-download-btn light" onClick={() => downloadCV(f.cvFile.replace(/^\/?uploads\/cv\//, ''))}>
                                                            <FaDownload /> CV
                                                        </button>
                                                    ) : "N/A"}
                                                </td>

                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

        </div>
    );
}