
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
import { FaCamera, FaEnvelope, FaPhone, FaIdCard, FaBriefcase, FaCalendarAlt, FaRocket, FaExclamationTriangle, FaLayerGroup, FaChartLine, FaRobot } from "react-icons/fa";
import { FiGrid } from "react-icons/fi";
import axios from "axios";
import CreateProduitForm from "./CreateProduitForm";
import { motion, AnimatePresence } from "framer-motion";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import InventoryAnalytics from "./InventoryAnalytics";
import ProductEditModal from './ProductEditModal';
import ProductDetailModal from './ProductDetailModal';

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
interface ForecastProps {
    aiData: {
        predicted_demand: number;
        current_stock: number;
        recommended_quantity: number;
    };
    productName: string;
}
interface Product {
    id: string | number;
    sku: string;
    nom: string;
    description?: string;
    prixUnitaire: number;
    categoryId?: string;
    category?: {
        id: string;
        nom: string;
    };
    quantiteDisponible: number;
    seuilCritique: number;
    emplacement?: string;
    active: boolean;
    image?: string;
    categorie?: string;
}
const AIRestockForecast: React.FC<ForecastProps> = ({ aiData, productName }) => {

    const chartData = [
        { name: 'Day -3', sales: Math.floor(aiData.predicted_demand / 10) },
        { name: 'Day -2', sales: Math.floor(aiData.predicted_demand / 8) },
        { name: 'Day -1', sales: Math.floor(aiData.predicted_demand / 9) },
        { name: 'Today', sales: Math.floor(aiData.predicted_demand / 7), stock: aiData.current_stock },
        { name: 'Forecast', prediction: aiData.predicted_demand / 7 },
    ];

    return (
        <div className="ai-forecast-card animate-fade-in">
            <div className="forecast-header">
                <h3><FaRobot /> AI Intelligence: {productName}</h3>
                <p>Linear Regression suggests <strong>+{aiData.recommended_quantity} units</strong> based on demand trend.</p>
            </div>

            <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                    <ComposedChart data={chartData}>
                        <CartesianGrid stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="sales" fill="#ff9a9e" barSize={15} radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="prediction" stroke="#730d19" strokeWidth={3} dot={{ r: 4, fill: '#730d19' }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="forecast-actions">
                <div className="stock-info-tag">Stock: {aiData.current_stock}</div>
            </div>
        </div>
    );
};
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

    const [categories, setCategories] = useState<any[]>([]);


    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8888/produit-stock-service/v1/categories", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data);
        } catch (err) {
            console.error("Error categories:", err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);
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
    const [notificationCount, setNotificationCount] = useState(0);
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

            setNotificationCount(filtered.length);
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
    const lowStockProducts = products
        .filter(p => p.quantiteDisponible <= (p.seuilCritique || 5))
        .map(p => ({
            ...p,
            aiRecommendedQty: p.seuilCritique ? p.seuilCritique * 2 : 50
        }));
    const [aiInsights, setAiInsights] = useState<any[]>([]);
    useEffect(() => {
        const fetchAiPredictions = async () => {
            const lowStock = products.filter(p => p.quantiteDisponible <= (p.seuilCritique || 5));
            const token = localStorage.getItem("token");

            const predictions = await Promise.all(
                lowStock.map(async (p) => {
                    try {
                        const res = await axios.get(`http://localhost:8888/prediction-service/prediction/predict-restock/${p.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        return { ...p, aiData: res.data };
                    } catch (err) { return { ...p, aiData: null }; }
                })
            );
            setAiInsights(predictions.filter(p => p.aiData && p.aiData.recommended_quantity > 0));
        };

        if (products.length > 0 && activeSection === "dashboard") {
            fetchAiPredictions();
        }
    }, [products, activeSection]);

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

    const [aiPage, setAiPage] = useState(1);
    const itemsPerAiPage = 3;


    const indexOfLastAi = aiPage * itemsPerAiPage;
    const indexOfFirstAi = indexOfLastAi - itemsPerAiPage;
    const currentAiInsights = aiInsights.slice(indexOfFirstAi, indexOfLastAi);
    const totalAiPages = Math.ceil(aiInsights.length / itemsPerAiPage);


    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
    const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);

    const handleEditProduct = (product: any) => {
        setSelectedProductForEdit(product);
        setShowEditModal(true);
    };

    const handleViewDetails = (product: any) => {
        setSelectedProductForDetail(product);
        setShowDetailModal(true);
    };

    const handleProductUpdate = (updatedProduct: any) => {
        setProducts((prevProducts: any[]) =>
            prevProducts.map((p: any) =>
                p.id === updatedProduct.id ? updatedProduct : p
            )
        );
        fetchProducts();
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
                        <img src="/favicon.ico" alt="logo" className="loo-image"/>
                    </a>

                    <div className="nav-right">
                        <div>
                            <ul className="menu">
                                <li className={activeSection === "bell" ? "active" : ""}
                                    onClick={() => setActiveSection("bell")}>
                                    <div className="bell-wrapper">
                                        <FaBell/>
                                        {notificationCount > 0 && (
                                            <span className="bell-badge-count">
                                            {notificationCount}
                                        </span>
                                        )}
                                    </div>
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
                    <div className="category-container animate-fade-in">
                        <div className="category-modern-header">
                            <div className="header-text">
                                <h1>Inventory Overview</h1>
                                <p>AI-powered stock predictions and inventory health.</p>
                            </div>
                            <div className="ai-status-badge">AI Engine Active</div>
                        </div>

                        <section className="stats-dashboard-grid">
                            <div className="status-glass-card primary-light">
                                <div className="card-icon-wrapper"><FaBoxes/></div>
                                <div className="card-content">
                                    <h3 className="stat-number">{products.length}</h3>
                                    <p className="stat-label">Total SKUs</p>
                                </div>
                            </div>

                            <div className="status-glass-card warning-light">
                                <div className="card-icon-wrapper"><FaExclamationTriangle/></div>
                                <div className="card-content">
                                    <h3 className="stat-number">{products.filter(p => p.quantiteDisponible <= p.seuilCritique).length}</h3>
                                    <p className="stat-label">Critical Stock</p>
                                </div>
                            </div>

                            <div className="status-glass-card success-light">
                                <div className="card-icon-wrapper"><FaLayerGroup/></div>
                                <div className="card-content">
                                    <h3 className="stat-number">{categories.length}</h3>
                                    <p className="stat-label">Categories</p>
                                </div>
                            </div>

                            <div className="status-glass-card blue-light">
                                <div className="card-icon-wrapper"><FaChartLine/></div>
                                <div className="card-content">
                                    <h3 className="stat-number">
                                        {products.reduce((acc, p) => acc + (p.quantiteDisponible * p.prixUnitaire), 0).toLocaleString()} DH
                                    </h3>
                                    <p className="stat-label">Stock Value</p>
                                </div>
                            </div>
                        </section>

                        <div className="ai-visual-feed">
                            <div className="feed-header-wrapper">
                                <h2 className="feed-title"><FaRobot/> Demand Forecasting Insights</h2>
                                <p className="feed-subtitle">AI-driven analysis using Linear Regression to predict
                                    inventory needs for the next 7 days.</p>
                            </div>

                            <div className="ai-explanation-guide">
                                <div className="guide-item">
                                    <span className="dot bar-color"></span>
                                    <p><strong>Past Sales:</strong> Real history from the last 3 days.</p>
                                </div>
                                <div className="guide-item">
                                    <span className="dot dot-color"></span>
                                    <p><strong>AI Forecast:</strong> Target sales level predicted by the model.</p>
                                </div>
                                <div className="guide-item">
                                    <span className="dot line-color"></span>
                                    <p><strong>Trend:</strong> Direction of demand (Up/Down).</p>
                                </div>
                            </div>
                            <div className="charts-grid">
                                <AnimatePresence mode="wait">
                                    {currentAiInsights.map(item => (
                                        <motion.div
                                            key={item.id}
                                            initial={{opacity: 0, scale: 0.95}}
                                            animate={{opacity: 1, scale: 1}}
                                            exit={{opacity: 0, scale: 0.95}}
                                        >
                                            <AIRestockForecast
                                                aiData={item.aiData}
                                                productName={item.nom}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            {totalAiPages > 1 && (
                                <div className="ai-pagination">
                                    {Array.from({length: totalAiPages}, (_, i) => (
                                        <button
                                            key={i}
                                            className={`pagi-dot ${aiPage === i + 1 ? "active" : ""}`}
                                            onClick={() => setAiPage(i + 1)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {activeSection === "bell" && (
                    <motion.div
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        className="admin-notifs-page"
                    >
                        <div className="admin-notifs-header">
                            <div className="category-modern-header">
                                <div className="header-text">
                                    <h1>Notification Center</h1>
                                    <p>MMonitor stock alerts and confirmed shipments.</p>
                                </div>
                            </div>

                            <button
                                className={`refresh-circle-btn ${isloading ? 'spin' : ''}`}
                                onClick={fetchNotifications}
                                disabled={isloading}
                            >
                                <FaSyncAlt/>
                            </button>
                        </div>

                        <div className="admin-notifs-grid">
                            <section className="admin-notif-group">
                                <div className="group-header" style={{borderBottom: `3px solid #ef4444`}}>
                                    <FaBoxes style={{color: '#ef4444', fontSize: '1.4rem' }} />
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
                                    <th>Produtc Actions</th>
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
                                                    title="Inventory entry"
                                                > +
                                                </button>

                                                <button
                                                    className="btn-action-out"
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setMovementType("SORTIE");
                                                    }}
                                                    title="Out of stock"
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
                                            <button
                                                className="btn-edit-small"
                                                onClick={() => handleEditProduct(product)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn-detail-small"
                                                onClick={() => handleViewDetails(product)}
                                            >
                                                Details
                                            </button>
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

                <ProductEditModal
                    product={selectedProductForEdit}
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedProductForEdit(null);
                    }}
                    onUpdate={handleProductUpdate}
                />

                <ProductDetailModal
                    product={selectedProductForDetail}
                    isOpen={showDetailModal}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedProductForDetail(null);
                    }}
                />
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
                                    Confirm & Send
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
                                <h3>{movementType === "ENTREE" ? "📥 Receipt of Stock" : "📤 Out of Stock"}</h3>
                                <p>Product: <strong>{selectedProduct.nom}</strong></p>

                                <div className="form-group">
                                    <label>Quantity</label>
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
                    <InventoryAnalytics
                        products={products}
                        categories={categories}
                    />
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