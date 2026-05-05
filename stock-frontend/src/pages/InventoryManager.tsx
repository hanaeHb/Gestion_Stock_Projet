
import React, { useState, useEffect, ChangeEvent } from "react";
import "./InventoryManager.css";
import {
    FaBell,
    FaChartBar,
    FaFolder,
    FaCog,
    FaUser,
    FaSignOutAlt,
    FaBoxes, FaSyncAlt
} from "react-icons/fa";
import { FaCamera, FaEnvelope, FaPhone, FaIdCard, FaBriefcase, FaCalendarAlt, FaRocket } from "react-icons/fa";
import { FiGrid } from "react-icons/fi";
import axios from "axios";
import CreateProduitForm from "./CreateProduitForm";
import { motion, AnimatePresence } from "framer-motion";
interface Profile {
    userId?: number;
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

export default function InventoryManager() {
    const [activeSection, setActiveSection] = useState<string>("dashboard");
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await axios.get<Profile>(
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

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
                const imageBase64 = reader.result as string;
                setProfile(prev => prev ? {...prev, image: imageBase64} : null);

                try {
                    const token = localStorage.getItem("token");
                    await axios.put(
                        `http://localhost:8888/usersservice/v1/user-profiles/me`,
                        { image: imageBase64 },
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
    };

    const [products, setProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [movementType, setMovementType] = useState<"ENTREE" | "SORTIE" | null>(null);
    const [movementQty, setMovementQty] = useState<number>(0);
    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8888/produit-stock-service/v1/produits", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(res.data);
        } catch (err) {
            console.error("Error fetching products", err);
        }
    };

    useEffect(() => {
        if (activeSection === "products") {
            fetchProducts();
        }
    }, [activeSection]);

    const handleMovementSubmit = async () => {
        try {
            const token = localStorage.getItem("token");
            const payload = {
                produitId: selectedProduct.id,
                type: movementType,
                quantite: movementQty,
                referenceDocument: "MANUAL_ENTRY",

            };

            await axios.post("http://localhost:8888/produit-stock-service/v1/mouvements", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Mouvement enregistré avec succès!");
            setSelectedProduct(null);
            setMovementQty(0);
            fetchProducts();
        } catch (err: any) {
            alert(err.response?.data?.message || "Erreur lors du mouvement");
        }
    };
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isloading, setLoading] = useState(true);
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8888/service-notification/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const allNotifs = res.data.notifications || [];
            const filtered = allNotifs.filter((n: any) =>
                (n.niveau === "ERROR" || n.type === "CONFIRMED") && n.statut === "NON_LUE"
            );

            setNotifications(filtered);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching notifications", err);
            setLoading(false);
        }
    };
    const handleMarkAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:8888/service-notification/api/notifications/${id}/mark-as-read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications(prev => prev.filter(n => n._id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));

            console.log("Notification marked as read! ✅");

        } catch (err: any) {
            console.error("Error marking as read:", err.response?.data || err.message);
        }
    };
    useEffect(() => {
        if (activeSection === "bell") {
            fetchNotifications();
        }
    }, [activeSection]);

    const [showRestockModal, setShowRestockModal] = useState(false);
    const [targetProduct, setTargetProduct] = useState<any>(null);
    const [requestedQty, setRequestedQty] = useState<number>(100);


    const handleSendRequest = async (product: any) => {
        setTargetProduct(product);
        setShowRestockModal(true);
        setRequestedQty(0);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:8888/prediction-service/prediction/predict-restock/${product.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.recommended_quantity) {
                setRequestedQty(res.data.recommended_quantity);
            }
        } catch (err) {
            console.error("AI Prediction Error:", err);
        }
    };
    const confirmRestockAction = async () => {
        if (!targetProduct || !requestedQty) return;

        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:8888/produit-stock-service/v1/produits/request-restock", {
                productId: targetProduct.id,
                productName: targetProduct.nom,
                requestedQty: requestedQty,
                sku: targetProduct.sku,
                productImage: targetProduct.image,
                fromManager: profile?.prenom || "Inventory Dept"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowRestockModal(false);
            alert("Request sent via Kafka! 🚀");
        } catch (err) {
            console.error(err);
            alert("Error sending request to Kafka");
        }
    };
    const filteredProducts = products.filter(p =>
        p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const indexOfLastProduct = currentPage * itemsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);
    return (
        <div className="manager-container">

            {/* Sidebar */}
            <aside className="sidebar">

                <ul className="menu">
                    <li className={activeSection === "dashboard" ? "active" : ""}
                        onClick={() => setActiveSection("dashboard")}>
                        <FiGrid/>
                    </li>

                    <li className={activeSection === "products" ? "active" : ""}
                        onClick={() => setActiveSection("products")}>
                        <FaBoxes/>
                    </li>

                    <li className={activeSection === "analytics" ? "active" : ""}
                        onClick={() => setActiveSection("analytics")}>
                        <FaChartBar/>
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
                        </section>
                    </>
                )}


                {activeSection === "bell" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="admin-notifs-page"
                    >
                        <div className="admin-notifs-header">
                            <div className="header-text-group">
                                <h2 className="page-title">
                                    <FaBell style={{ color: '#4facfe' }} /> Notification Center
                                </h2>
                                <p className="section-subtitle">Monitor stock alerts and confirmed shipments.</p>
                            </div>

                            <button
                                className={`refresh-circle-btn ${isloading ? 'spin' : ''}`}
                                onClick={fetchNotifications}
                                disabled={isloading}
                            >
                                <FaSyncAlt />
                            </button>
                        </div>

                        <div className="admin-notifs-grid">
                            <section className="admin-notif-group">
                                <div className="group-header" style={{ borderBottom: `3px solid #ef4444` }}>
                                    <FaBoxes style={{ color: '#ef4444', fontSize: '1.4rem' }} />
                                    <h3>Critical Stock Alerts</h3>
                                    <span className="count-badge" style={{ background: '#ef4444' }}>
                                        {notifications.filter(n => n.niveau === "ERROR").length}
                                    </span>
                                </div>

                                <div className="notif-scroll-area">
                                    {notifications.filter(n => n.niveau === "ERROR").length > 0 ? (
                                        notifications.filter(n => n.niveau === "ERROR").map(notif => (
                                            <div key={notif._id} className="admin-notif-item">
                                                <p className="msg">{notif.message}</p>
                                                <div className="meta-tags">
                                                    <span className="tag product">Stock Alert</span>
                                                    <span className="tag qty">Action Required</span>
                                                </div>
                                                <span className="time">
                                                    {new Date(notif.dateAlerte).toLocaleString()}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="empty">No critical alerts found.</p>
                                    )}
                                </div>
                            </section>

                            <section className="admin-notif-group">
                                <div className="group-header" style={{ borderBottom: `3px solid #10b981` }}>
                                    <FaBoxes style={{ color: '#10b981', fontSize: '1.4rem' }} />
                                    <h3>Confirmed Shipments</h3>
                                    <span className="count-badge" style={{ background: '#10b981' }}>
                                         {notifications.filter(n => n.type === "CONFIRMED").length}
                                    </span>
                                </div>

                                <div className="notif-scroll-area">
                                    {notifications.filter(n => n.type === "CONFIRMED").length > 0 ? (
                                        notifications.filter(n => n.type === "CONFIRMED").map(notif => (
                                            <div key={notif._id} className="admin-notif-item">
                                                <p className="msg">{notif.message}</p>
                                                <div className="meta-tags">
                                                    <span className="tag price">Received</span>
                                                    <span className="tag product">Inventory Update</span>
                                                </div>
                                                <span className="time">
                                                     {new Date(notif.dateAlerte).toLocaleString()}
                                                 </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="empty">No confirmed arrivals yet.</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </motion.div>
                )}
                {/* Products Section */}
                {activeSection === "products" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="products-hub"
                    >
                        <div className="hub-header">
                            <div>
                                <h2 className="section-title">Inventory Repository</h2>
                                <p className="section-subtitle">Manage, track and deploy new product assets.</p>
                            </div>

                            <button
                                className="btn-add-product-main"
                                onClick={() => setActiveSection("create-product")}
                            >
                                <FaBoxes style={{marginRight: '10px'}}/>
                                Deploy New Asset
                            </button>
                        </div>

                        <div className="panel large glass-panel">
                            <div className="panel-header-inline">
                                <h3>Active Inventory</h3>
                                <div className="table-search">
                                    <input
                                        type="text"
                                        placeholder="Search by SKU or Name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <table className="stock-table">
                                <thead>
                                <tr>
                                    <th>Product Info</th>
                                    <th>Category</th>
                                    <th>Stock Level</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                    <th>Edit Produtc</th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="td-info"
                                                 style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                {product.image && <img src={product.image} alt="p"/>}
                                                <div>
                                                    <strong>{product.nom}</strong>
                                                    <span>SKU: {product.sku}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                                <span className="badge-cat">
                                                    {product.category ? product.category.nom : (product.categorie || "No Category")}
                                                </span>
                                        </td>
                                        <td>
                                            <div className="stock-progress">
                                                <span>{product.quantiteDisponible ?? 0} units</span>

                                                <div className="mini-bar">
                                                    <div style={{
                                                        width: product.quantiteDisponible > (product.seuilCritique || 5) ? '80%' : '20%',
                                                        backgroundColor: product.quantiteDisponible > (product.seuilCritique || 5) ? '#4facfe' : '#ef4444'
                                                    }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                                <span
                                                    className={`status-pill ${product.active ? 'available' : 'out-of-stock'}`}>
                                                    {product.active ? "Active" : "Disabled"}
                                                </span>
                                        </td>
                                        <td>
                                            <div style={{display: 'flex', gap: '5px'}}>
                                                <button
                                                    className="btn-action-in"
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setMovementType("ENTREE");
                                                    }}
                                                    title="Entrée de stock"
                                                > +
                                                </button>

                                                <button
                                                    className="btn-action-out"
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setMovementType("SORTIE");
                                                    }}
                                                    title="Sortie de stock"
                                                > -
                                                </button>
                                                {product.quantiteDisponible <= (product.seuilCritique || 5) && (
                                                    <button
                                                        className="btn-request-stock"
                                                        onClick={() => handleSendRequest(product)}
                                                        style={{
                                                            backgroundColor: 'rgba(243,149,83,0.76)',
                                                            color: '#000',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            marginLeft: '5px'
                                                        }}
                                                    >
                                                        Request Restock
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <button className="btn-edit-small">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <div className="catalog-pagination">
                                <button
                                    className="pagi-nav-btn"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    ← Previous
                                </button>

                                <div className="pagi-numbers-list">
                                    {Array.from({length: totalPages}, (_, i) => i + 1).map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            className={`pagi-num-btn ${currentPage === pageNum ? "is-active" : ""}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className="pagi-nav-btn"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {showRestockModal && (
                    <div className="modal-overlay">
                        <div className="movement-modal glass-panel fade-in">
                            <div className="modal-header-styled">
                                <h3>✨ Smart Restock Request</h3>
                                <p>AI analyzing 365 days of history for: <strong>{targetProduct?.nom}</strong></p>
                            </div>

                            <div className="modal-body" style={{padding: '20px 0'}}>
                                <div className="form-group">
                                    <label style={{
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: '#64748b',
                                        textTransform: 'uppercase'
                                    }}>
                                        Recommended Quantity
                                    </label>
                                    <input
                                        type="number"
                                        className="modern"
                                        value={requestedQty}
                                        onChange={(e) => setRequestedQty(Number(e.target.value))}
                                        autoFocus
                                    />
                                    {requestedQty > 0 ? (
                                        <p style={{color: '#730d19', fontSize: '12px', marginTop: '8px'}}>
                                            ✅ AI suggested this amount to avoid out-of-stock for next 7 days.
                                        </p>
                                    ) : (
                                        <p style={{fontSize: '12px', color: '#94a3b8'}}>Calculating with AI...</p>
                                    )}
                                </div>
                            </div>

                            <div className="modal-actions-grid">
                                <button className="btn-cancel-modern" onClick={() => setShowRestockModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn-confirm-restock"
                                    onClick={confirmRestockAction}
                                    disabled={requestedQty <= 0}
                                >
                                    Confirm & Send to Kafka 🚀
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === "create-product" && (
                    <motion.div
                        initial={{opacity: 0, scale: 0.9}}
                        animate={{opacity: 1, scale: 1}}
                        className="create-product-wrapper"
                    >
                    <div className="back-nav">
                            <button onClick={() => setActiveSection("products")} className="btn-back">
                                ← Back to Inventory
                            </button>
                        </div>
                        <CreateProduitForm/>
                    </motion.div>
                )}

                <AnimatePresence>
                    {selectedProduct && movementType && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="movement-modal glass-panel"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                            >
                                <h3>{movementType === "ENTREE" ? "📥 Réception de Stock" : "📤 Sortie de Stock"}</h3>
                                <p>Produit: <strong>{selectedProduct.nom}</strong></p>

                                <div className="form-group">
                                    <label>Quantité</label>
                                    <input
                                        type="number"
                                        value={movementQty}
                                        onChange={(e) => setMovementQty(parseInt(e.target.value) || 0)}
                                        min="1"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button className="btn-cancel" onClick={() => {setSelectedProduct(null); setMovementQty(0);}}>
                                        Cancel
                                    </button>
                                    <button className="btn-confirm" onClick={handleMovementSubmit}>
                                        Confirm Movement
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                        )}
                </AnimatePresence>

                {/* Analytics */}
                {activeSection === "analytics" && (
                    <div className="panel large">
                        <h3>Stock Analytics</h3>
                        <ul className="bars">
                            <li>
                                <span>Stock Growth</span>
                                <div className="bar">
                                    <div style={{width: "75%"}}/>
                                </div>
                            </li>
                            <li>
                                <span>Sales Performance</span>
                                <div className="bar">
                                    <div style={{width: "60%"}}/>
                                </div>
                            </li>
                        </ul>
                    </div>
                )}

                {/* Settings */}
                {activeSection === "settings" && (
                    <div className="panel large">
                        <h3>Manager Settings</h3>
                        <p>Configure inventory preferences and system options.</p>
                    </div>
                )}

                {/* Profile */}
                {activeSection === "profile" && (
                    <div className="mgr-profile-wrapper fade-in">
                        <div className="mgr-profile-card">
                            <div className="mgr-profile-header">
                                <div className="mgr-avatar-section">
                                    <div className="mgr-avatar-wrapper">
                                        <div className="mgr-avatar-overlay">
                                            <FaCamera />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="mgr-avatar-input"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                        {profile?.image ? (
                                            <img src={profile.image} alt="Profile" className="mgr-avatar-img"/>
                                        ) : (
                                            <div className="mgr-avatar-placeholder">
                                                <FaUser size={45} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mgr-header-info">
                                    <h2 className="mgr-user-name">{profile?.prenom || ""} {profile?.nom || ""}</h2>
                                    <p className="mgr-role-tag"><FaRocket /> Inventory Manager Specialist</p>
                                </div>
                            </div>

                            <div className="mgr-profile-intro">
                                The Inventory Manager oversees stock management, product organization, and warehouse
                                operations. Responsibilities include maintaining accurate inventory levels and coordinating
                                with the team for smooth operational workflow.
                            </div>

                            <div className="mgr-form-grid">
                                <div className="mgr-input-group">
                                    <label><FaUser/> First Name</label>
                                    <input type="text" value={profile?.nom || ""} readOnly className="mgr-readonly"/>
                                </div>
                                <div className="mgr-input-group">
                                    <label><FaUser/> Last Name</label>
                                    <input type="text" value={profile?.prenom || ""} readOnly className="mgr-readonly"/>
                                </div>

                                <div className="mgr-input-group">
                                    <label><FaEnvelope/> Email Address</label>
                                    <input type="email" value={profile?.email || ""} readOnly className="mgr-readonly"/>
                                </div>
                                <div className="mgr-input-group">
                                    <label><FaPhone/> Phone Number</label>
                                    <input
                                        type="text"
                                        value={profile?.phone || ""}
                                        onChange={e => setProfile({...profile, phone: e.target.value})}
                                        placeholder="Enter your phone"
                                    />
                                </div>

                                <div className="mgr-input-group">
                                    <label><FaIdCard/> CIN</label>
                                    <input
                                        type="text"
                                        value={profile?.cin || ""}
                                        onChange={e => setProfile({...profile, cin: e.target.value})}
                                        placeholder="Enter your CIN"
                                    />
                                </div>
                                <div className="mgr-input-group">
                                    <label><FaBriefcase/> Status</label>
                                    <input type="text" value={profile?.status || ""} readOnly className="mgr-readonly"/>
                                </div>
                                <div className="mgr-input-group">
                                    <label><FaBriefcase/> Role</label>
                                    <input type="text" value={profile?.metierRole } readOnly
                                           className="pro-readonly"/>
                                </div>
                                <div className="mgr-input-group">
                                    <label><FaCalendarAlt/> Join Date</label>
                                    <input type="text" value={profile?.createdAt || ""} readOnly
                                           className="mgr-readonly"/>
                                </div>
                            </div>

                            <div className="mgr-form-footer">
                                <button
                                    className="mgr-save-btn"
                                    onClick={async () => {
                                        try {
                                            const token = localStorage.getItem("token");

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

                                        setProfile(res.data);
                                        alert("Profile updated successfully ✅");
                                    } catch (err) {
                                        console.error("Error updating profile");
                                        alert("Failed to update profile.");
                                    }
                                }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}