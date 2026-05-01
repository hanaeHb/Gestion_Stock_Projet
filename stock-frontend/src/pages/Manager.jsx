import React, { useState, useEffect } from "react";
import "./Manager.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    FaBell,
    FaChartBar,
    FaFolder,
    FaCog,
    FaUser,
    FaSignOutAlt,
    FaBoxes, FaRobot, FaFilePdf
} from "react-icons/fa";
import {  FaCamera, FaEnvelope, FaPhone, FaIdCard, FaBriefcase, FaCalendarAlt, FaCheckCircle, FaChartLine } from "react-icons/fa";
import { FiGrid } from "react-icons/fi";
import axios from "axios";

export default function Manager() {

    const [activeSection, setActiveSection] = useState("dashboard");
    const [profile, setProfile] = useState(null);

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
    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 6;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [reports, setReports] = useState([]);
    const generateSinglePDF = (item) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(30, 41, 59);
        doc.text("Inventory Intelligence Report", 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
        doc.line(20, 35, 190, 35);

        // Content
        doc.setFontSize(14);
        doc.text(`Product: ${item.nomProduit}`, 20, 50);

        const data = [
            ["Current Stock", `${item.quantiteDisponible} units`],
            ["AI Forecasted Demand", `${item.prediction?.predicted_demand || 0}`],
            ["Recommended Reorder", `${item.prediction?.recommended_quantity || 0}`],
            ["Best Supplier Match", `${item.bestSupplier?.name || "N/A"}`],
            ["AI Reliability Score", `${item.bestSupplier?.ai_score || 0}%`]
        ];

        autoTable(doc, {
            startY: 60,
            head: [['Metric', 'Analysis Value']],
            body: data,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] }
        });

        doc.save(`Report_${item.nomProduit}.pdf`);
    };
    const generateGlobalPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Global Inventory Intelligence Report", 14, 15);

        const tableRows = reports.map(item => [
            item.produitId,
            item.nomProduit,
            item.quantiteDisponible,
            item.prediction?.predicted_demand || 0,
            item.bestSupplier?.name || "N/A"
        ]);

        autoTable(doc, {
            head: [['ID', 'Product', 'Stock', 'AI Demand', 'Supplier']],
            body: tableRows,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [149, 117, 205] }
        });
        doc.save("Full_Inventory_Report.pdf");
    };

    // --- 2. Refresh Logic ---
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await generateSmartReport();
        setIsRefreshing(false);
    };

    // --- 3. Pagination Logic ---
    const indexOfLastCard = currentPage * cardsPerPage;
    const indexOfFirstCard = indexOfLastCard - cardsPerPage;
    const currentReports = reports.slice(indexOfFirstCard, indexOfLastCard);
    const totalPages = Math.ceil(reports.length / cardsPerPage);
    const generateSmartReport = async () => {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        try {
            const alertRes = await axios.get("http://localhost:8888/produit-stock-service/v1/stocks/alertes", { headers });

            const detailedData = await Promise.all(alertRes.data.map(async (stock) => {
                try {
                    const prodRes = await axios.get(`http://localhost:8888/produit-stock-service/v1/produits/${stock.produitId}`, { headers });

                    const cid = prodRes.data.categoryId || prodRes.data.id_category || prodRes.data.category?.id;

                    const aiRes = await axios.get(`http://localhost:8888/prediction-service/prediction/predict-restock/${stock.produitId}`, { headers });

                    let bestSup = null;
                    if (cid) {
                        const supplierRes = await axios.get(`http://localhost:8888/prediction-service/prediction/predict-best-supplier/${cid}`, { headers });
                        if (supplierRes.data && supplierRes.data.length > 0) {
                            bestSup = supplierRes.data[0];
                        }
                    }

                    return {
                        ...stock,
                        nomProduit: prodRes.data.nom,
                        prediction: aiRes.data,
                        bestSupplier: bestSup
                    };
                } catch (e) {
                    console.error("Error for product:", stock.produitId, e);
                    return { ...stock, nomProduit: "Unknown", prediction: null, bestSupplier: null };
                }
            }));
            setReports(detailedData);
        } catch (err) {
            console.error("Global fetch error:", err);
        }
    };

    useEffect(() => {
        if (activeSection === "dashboard") {
            generateSmartReport();
        }
    }, [activeSection]);
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
                    <div className="dashboard-content fade-in">

                        {/* Control Bar (Download & Refresh) */}
                        <div className="dashboard-controls">
                            <div className="control-left">
                                <h3>Strategic Overview</h3>
                                <p>Showing {indexOfFirstCard + 1}-{Math.min(indexOfLastCard, reports.length)} of {reports.length} products</p>
                            </div>
                            <div className="control-right">
                                <button className="btn-refresh" onClick={handleRefresh} disabled={isRefreshing}>
                                    {isRefreshing ? "Refreshing..." : "Refresh Data"}
                                </button>
                                <button className="btn-download-all" onClick={generateGlobalPDF}>
                                    <FaFilePdf /> Download Full Report
                                </button>
                            </div>
                        </div>

                        {/* Reports Grid (صغرنا الـ Cards هنا) */}
                        <div className="reports-grid-compact">
                            {currentReports.map((item) => (
                                <div key={item.produitId} className="report-card-small">
                                    <div className="card-top">
                                        <div className="title-group">
                                            <h4>{item.nomProduit}</h4>
                                            <span className="ref-text">Ref: {item.produitId}</span>
                                        </div>
                                        <span className={`mini-badge ${item.quantiteDisponible <= item.seuilCritique ? 'crit' : 'ok'}`}>
                                            {item.quantiteDisponible <= item.seuilCritique ? 'Urgent' : 'Optimal'}
                                        </span>
                                    </div>

                                    <div className="card-mid">
                                        <div className="mini-stat">
                                            <label>Stock</label>
                                            <span>{item.quantiteDisponible}</span>
                                        </div>
                                        <div className="mini-stat">
                                            <label>AI Forecast</label>
                                            <span className="peach-text">+{item.prediction?.predicted_demand || 0}</span>
                                        </div>
                                    </div>

                                    <div className="ai-supplier-mini">
                                        <p><strong>{item.bestSupplier?.name || "Searching..."}</strong></p>
                                        <div className="score-bar-bg">
                                            <div className="score-bar-fill" style={{width: `${item.bestSupplier?.ai_score || 0}%`}}></div>
                                        </div>
                                    </div>

                                    <button className="btn-mini-pdf" onClick={() => generateSinglePDF(item)}>
                                        <FaFilePdf /> PDF
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Buttons */}
                        <div className="pagination-bar">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >Previous</button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >Next</button>
                        </div>
                    </div>
                )}

                {/* Products */}
                {activeSection === "products" && (
                    <div className="panel large">

                        <h3>Products List</h3>

                        <table className="stock-table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Stock</th>
                                <th>Status</th>
                            </tr>
                            </thead>

                            <tbody>

                            <tr>
                                <td>Laptop Dell</td>
                                <td>Electronics</td>
                                <td>45</td>
                                <td>Available</td>
                            </tr>

                            <tr>
                                <td>Keyboard</td>
                                <td>Accessories</td>
                                <td>12</td>
                                <td>Low</td>
                            </tr>

                            </tbody>
                        </table>

                    </div>
                )}

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

                {activeSection === "profile" && (
                    <div className="mng-profile-wrapper fade-in">
                        <div className="mng-profile-card">
                            <div className="mng-profile-header">
                                <div className="mng-avatar-section">
                                    <div className="mng-avatar-wrapper">
                                        <div className="mng-avatar-overlay">
                                            <FaCamera />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="mng-avatar-input"
                                                onChange={async e => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = async () => {
                                                            const imageBase64 = reader.result;
                                                            setProfile({...profile, image: imageBase64});
                                                            try {
                                                                const token = localStorage.getItem("token");
                                                                await axios.put(
                                                                    `http://localhost:8888/usersservice/v1/user-profiles/me`,
                                                                    {image: imageBase64},
                                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                                );
                                                            } catch (err) { console.error("Error updating image", err); }
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </div>
                                        {profile?.image ? (
                                            <img src={profile.image} alt="Profile" className="mng-avatar-img"/>
                                        ) : (
                                            <div className="mng-avatar-placeholder">
                                                <FaUser size={45} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mng-header-info">
                                    <h2 className="mng-user-name">{profile?.prenom || ""} {profile?.nom || ""}</h2>
                                    <p className="mng-role-tag"><FaChartLine /> Strategic Manager Specialist</p>
                                </div>
                            </div>

                            <div className="mng-profile-intro">
                                The manager supervises inventory, products, and analytics. Responsibilities include
                                monitoring stock levels, tracking performance, and coordinating with staff for efficient
                                workflow.
                            </div>

                            <div className="mng-form-grid">
                                <div className="mng-input-group">
                                    <label><FaUser /> First Name</label>
                                    <input type="text" value={profile?.nom || ""} readOnly className="mng-readonly" />
                                </div>
                                <div className="mng-input-group">
                                    <label><FaUser /> Last Name</label>
                                    <input type="text" value={profile?.prenom || ""} readOnly className="mng-readonly" />
                                </div>

                                <div className="mng-input-group">
                                    <label><FaEnvelope /> Email Address</label>
                                    <input type="email" value={profile?.email || ""} readOnly className="mng-readonly" />
                                </div>
                                <div className="mng-input-group">
                                    <label><FaPhone /> Phone</label>
                                    <input
                                        type="text"
                                        value={profile?.phone || ""}
                                        onChange={e => setProfile({...profile, phone: e.target.value})}
                                    />
                                </div>

                                <div className="mng-input-group">
                                    <label><FaIdCard /> CIN</label>
                                    <input
                                        type="text"
                                        value={profile?.cin || ""}
                                        onChange={e => setProfile({...profile, cin: e.target.value})}
                                    />
                                </div>
                                <div className="mng-input-group">
                                    <label><FaCheckCircle /> Account Status</label>
                                    <div className="mng-status-container">
                        <span className={`mng-status-badge ${profile.status?.toLowerCase() || 'validated'}`}>
                            {profile.status || "VALIDATED"}
                        </span>
                                    </div>
                                </div>

                                <div className="mng-input-group">
                                    <label><FaBriefcase /> Role</label>
                                    <input type="text" value={profile?.metierRole || "Manager"} readOnly className="mng-readonly" />
                                </div>
                                <div className="mng-input-group">
                                    <label><FaCalendarAlt /> Join Date</label>
                                    <input type="text" value={profile?.createdAt || ""} readOnly className="mng-readonly" />
                                </div>
                            </div>

                            <div className="mng-form-footer">
                                <button className="mng-save-btn" onClick={async () => {
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
                    </div>
                )}
            </main>

        </div>
    );
}