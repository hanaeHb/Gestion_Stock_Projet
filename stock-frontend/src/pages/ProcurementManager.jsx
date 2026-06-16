import React, { useState, useEffect } from "react";
import "./ProcurementManager.css";
import {
    FaBell,
    FaChartBar,
    FaFolder,
    FaCog,
    FaUser,
    FaSignOutAlt,
    FaBoxes, FaUserTie, FaInbox, FaFileInvoiceDollar, FaDownload, FaSync, FaTruck, FaFilePdf, FaChartLine, FaUserClock
} from "react-icons/fa";
import {  FaCamera, FaEnvelope, FaPhone, FaIdCard, FaBriefcase, FaCalendarAlt, FaCheckCircle, FaUserShield } from "react-icons/fa";
import {FiGrid, FiTrendingUp} from "react-icons/fi";
import axios from "axios";
import PurchaseBudgetTracker from "./PurchaseBudgetTracker";
import OrderWizard from "./OrderWizard";
import QuotesManagement from "./QuotesManagement";
import ShipmentDetails from "./ShipmentDetails";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

    const updateNotificationStatus = async (notificationId, statut, userId) => {
        try {
            const token = localStorage.getItem("token");

            await axios.put(
                `http://localhost:8888/service-notification/api/notifications/${notificationId}/status`,
                { statut: statut },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await axios.patch(
                `http://localhost:8888/security-stock/v1/users/${userId}/status`,
                {
                    active: statut === "validated"
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
                const refusedQuotes = data.filter(n => n.type === "QUOTE_REFUSED_BY_SUPPLIER");
                const noFallback = data.filter(n => n.type === "NO_FALLBACK_AVAILABLE");
                const planB = data.filter(n => n.type === "PLAN_B_ROUTED");

                setPendingFournisseurs(pending);
                setReplenishmentRequests(restock);

                const totalNotifs = pending.length + restock.length + quotes.length + shipments.length + refusedQuotes.length + noFallback.length + planB.length;
                setNotificationCount(totalNotifs);

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
    const quoteNotifications = allNotifications.filter(n => n.type === "QUOTE_RECEIVED" && n.statut === "NON_LUE");
    const refusedQuotes = allNotifications.filter(n => n.type === "QUOTE_REFUSED_BY_SUPPLIER" && n.statut === "NON_LUE");
    const planB = allNotifications.filter(n => n.type === "PLAN_B_ROUTED" && n.statut === "NON_LUE");
    const noFallback = allNotifications.filter(n => n.type === "NO_FALLBACK_AVAILABLE" && n.statut === "NON_LUE");
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

    const [isRefreshing, setIsRefreshing] = useState(false);
    const cardsPerPage = 6;
    const loadLogoAsBase64 = () => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = "/favicon.ico";
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/jpeg"));
                } else {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
        });
    };
    const generateSinglePDF = async (item) => {
        const logoBase64 = await loadLogoAsBase64();
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, "F");

        if (logoBase64) {

            doc.addImage(logoBase64, "PNG", 15, 12, 38, 16, undefined, 'FAST');
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(114, 15, 42);
        doc.text("Inventory Intelligence Report", 15, 42);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`AI Optimization Engine • Generated on: ${new Date().toLocaleString()}`, 15, 50);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(241, 232, 255);
        doc.setLineWidth(0.4);
        doc.roundedRect(15, 56, 180, 18, 4, 4, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(168, 85, 247);
        doc.text("PRODUCT SCOPE", 22, 63);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(114, 15, 42);
        doc.text(`${item.nomProduit || "N/A"}`, 22, 70);


        const tableData = [
            ["Current Stock Level", `${item.quantiteDisponible} Units`],
            ["AI Forecasted Demand", `+${item.prediction?.predicted_demand || 0} Units`],
            ["Recommended Reorder", `+${item.prediction?.recommended_quantity || 0} Units`],
            ["Strategic Best Supplier", `${item.bestSupplier?.name || "Searching..."}`],
            ["AI Trust Match Score", `${item.bestSupplier?.ai_score || 0}%`]
        ];

        autoTable(doc, {
            startY: 82,
            margin: { left: 15, right: 15 },
            head: [['Inventory Optimization Metric', 'Analysis Value']],
            body: tableData,
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 9.5,
                cellPadding: 5,
                textColor: [71, 85, 105],
                lineColor: [241, 245, 249]
            },
            headStyles: {
                fillColor: [114, 15, 42],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10.5,
                cellPadding: 6
            },
            alternateRowStyles: {
                fillColor: [255, 253, 252]
            },
            columnStyles: {
                0: { fontStyle: 'bold', width: 75, textColor: [114, 15, 42] },
                1: { halign: 'left' }
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 1) {

                    if (data.row.index === 0 && item.quantiteDisponible <= (item.seuilCritique || 10)) {
                        data.cell.styles.textColor = [239, 68, 68];
                        data.cell.styles.fontStyle = 'bold';
                    }

                    if (data.row.index === 1) {
                        data.cell.styles.textColor = [59, 130, 246];
                        data.cell.styles.fontStyle = 'bold';
                    }

                    if (data.row.index === 2) {
                        data.cell.styles.textColor = [249, 115, 22];
                        data.cell.styles.fontStyle = 'bold';
                    }

                    if (data.row.index === 4) {
                        data.cell.styles.textColor = [168, 85, 247];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });


        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("StockFlow Intelligence System • Generated Automatically", 15, 285);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(114, 15, 42);
        doc.text(`Page ${pageCount}`, 195, 285, { align: "right" });

        // Save Action
        const fileName = item.nomProduit ? item.nomProduit.replace(/\s+/g, '_') : "Product";
        doc.save(`Report_${fileName}.pdf`);
    };
    const generateGlobalPDF = async () => {
        const logoBase64 = await loadLogoAsBase64();
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, "F");

        if (logoBase64) {
            doc.addImage(logoBase64, "PNG", 14, 12, 38, 16, undefined, 'FAST');
        }


        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(114, 15, 42); // Burgundy premium text
        doc.text("Global Inventory Intelligence Report", 14, 42);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Consolidated Sourcing Pipeline • Generated: ${new Date().toLocaleDateString()}`, 14, 50);

        const tableRows = reports.map(item => [
            item.produitId?.toString() || "N/A",
            item.nomProduit || "Unknown",
            `${item.quantiteDisponible} Units`,
            `+${item.prediction?.predicted_demand || 0} Units`,
            item.bestSupplier?.name || "Searching..."
        ]);

        autoTable(doc, {
            head: [['ID', 'Product Name', 'Stock Level', 'AI Forecast', 'Strategic Supplier']],
            body: tableRows,
            startY: 58,
            margin: { left: 14, right: 14 },
            theme: 'plain',
            styles: {
                font: 'helvetica',
                fontSize: 9.5,
                cellPadding: 5.5,
                textColor: [51, 65, 85],
                borderBottomWidth: 0.3,
                borderBottomColor: [241, 245, 249]
            },
            headStyles: {
                fillColor: [114, 15, 42], // Burgundy header box matchy
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10.5,
                cellPadding: 6
            },

            didParseCell: function (data) {
                if (data.section === 'body') {
                    if (data.row.index % 2 === 1) {
                        data.cell.styles.fillColor = [248, 250, 252];
                    } else {
                        data.cell.styles.fillColor = [255, 255, 255];
                    }

                    if (data.column.index === 2) {
                        const stockVal = parseInt(data.cell.text[0]);
                        if (stockVal <= 10) {
                            data.cell.styles.textColor = [239, 68, 68];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                    if (data.column.index === 3) {
                        data.cell.styles.textColor = [59, 130, 246];
                        data.cell.styles.fontStyle = 'bold';
                    }
                    if (data.column.index === 4) {
                        data.cell.styles.textColor = [168, 85, 247];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Automated Replenishment Dashboard System • StockFlow Intelligence", 14, 285);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(114, 15, 42);
        doc.text(`Page ${pageCount}`, 195, 285, { align: "right" });


        doc.save("Full_Inventory_Intelligence_Report.pdf");
    };


    const handleRefresh = async () => {
        setIsRefreshing(true);
        await generateSmartReport();
        setIsRefreshing(false);
    };


    const [currentPage, setCurrentPage] = useState(1);
    const [reports, setReports] = useState([]);

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
                    let allSups = [];

                    if (cid) {
                        const supplierRes = await axios.get(`http://localhost:8888/prediction-service/prediction/predict-best-supplier/${cid}`, { headers });

                        if (supplierRes.data && supplierRes.data.length > 0) {
                            bestSup = supplierRes.data[0];
                            allSups = supplierRes.data;
                        }
                    }

                    return {
                        ...stock,
                        nomProduit: prodRes.data.nom,
                        prediction: aiRes.data,
                        bestSupplier: bestSup,
                        allSuppliers: allSups
                    };
                } catch (e) {
                    console.error("Error for product:", stock.produitId, e);
                    return { ...stock, nomProduit: "Unknown", prediction: null, bestSupplier: null, allSuppliers: [] };
                }
            }));
            setReports(detailedData);
        } catch (err) {
            console.error("Global fetch error:", err);
        }
    };
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:8888/produit-stock-service/v1/produits", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProducts(res.data);
            } catch (err) {
                console.error("Error fetching products for dashboard", err);
            }
        };
        fetchProducts();
    }, []);
    const handleMarkAsRead = async (id) => {
        try {
            const token = localStorage.getItem("token");

            setAllNotifications(prev => {
                const updated = prev.filter(n => n._id !== id);
                setNotificationCount(prevCount => Math.max(0, prevCount - 1));
                return updated;
            });

            await axios.put(
                `http://localhost:8888/service-notification/api/notifications/${id}/mark-as-read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Notification marked as read! ✅");

            fetchAllNotifications();

        } catch (err) {
            console.error("Error marking as read:", err.response?.data || err.message);
            fetchAllNotifications();
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
                        <FaBoxes/>
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
                                                    <p className="msg"><strong>{req.productName}</strong>: New restock
                                                        request for {req.requestedQty} units.</p>
                                                    <div className="meta-tags">
                                                        <span className="tag product">Product</span>
                                                        <span className="tag qty">{req.requestedQty} Units</span>
                                                    </div>
                                                    <span
                                                        className="time">From: {req.fromManager} • {new Date(req.dateAlerte).toLocaleString()}</span>
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
                                                    <p className="msg">
                                                        <strong>{f.firstName} {f.lastName}</strong> applied as a new
                                                        supplier.</p>
                                                    <div className="meta-tags">
                                                        <span className="tag">New Applicant</span>
                                                    </div>
                                                    <span
                                                        className="time">{new Date(f.dateAlerte).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-msg">No new supplier applications.</div>
                                    )}
                                </div>
                            </section>


                            <section className="admin-notif-group">
                                <div className="group-header" style={{borderBottom: '3px solid #2ecc71'}}>
                                    <FaFileInvoiceDollar style={{color: '#2ecc71', fontSize: '1.2rem'}}/>
                                    <h3>Supplier Quotes & Automation</h3>
                                    <span className="count-badge" style={{background: '#2ecc71'}}>
                                        {quoteNotifications.length + refusedQuotes.length + planB.length + noFallback.length}
                                    </span>
                                </div>
                                <div className="notif-scroll-area">

                                    {[...quoteNotifications, ...refusedQuotes, ...planB, ...noFallback].sort((a, b) => new Date(b.dateAlerte).getTime() - new Date(a.dateAlerte).getTime()).map(notif => {
                                        const isRefused = notif.type === "QUOTE_REFUSED_BY_SUPPLIER";
                                        const isPlanB = notif.type === "PLAN_B_ROUTED";
                                        const isNoFallback = notif.type === "NO_FALLBACK_AVAILABLE";

                                        let itemBorderClass = 'accepted-border';
                                        if (isRefused) itemBorderClass = 'refused-border';
                                        if (isPlanB) itemBorderClass = 'planb-border';
                                        if (isNoFallback) {
                                            itemBorderClass = 'critical-border';
                                        }
                                        return (
                                            <div
                                                key={notif._id}
                                                className={`admin-notif-item ${itemBorderClass}`}
                                                onClick={() => setActiveSection("quotes")}
                                            >
                                                <div className="notif-content">
                                                    <p className="msg">
                                                        <strong style={{
                                                            color: isNoFallback ? '#dc2626' : isRefused ? '#ef4444' : isPlanB ? '#f39c12' : '#2ecc71'
                                                        }}>
                                                            {isNoFallback ? "🚨 CRITICAL ERROR:" : isRefused ? "🚫 Rejected:" : isPlanB ? "🤖 Auto Plan B:" : "✅ Offer Received:"}
                                                        </strong>
                                                        {" "}{notif.message}
                                                    </p>

                                                    <div className="meta-tags">
                                                        <span
                                                            className={`tag ${isNoFallback ? 'tag-critical' : isRefused ? 'tag-red' : isPlanB ? 'tag-orange' : 'tag-green'}`}
                                                            style={
                                                                isNoFallback ? {
                                                                        background: '#dc2626',
                                                                        color: '#fff',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 'bold'
                                                                    } :
                                                                    isPlanB ? {
                                                                        background: '#f39c12',
                                                                        color: '#fff',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.75rem'
                                                                    } : {}
                                                            }
                                                        >
                                                            {isNoFallback ? "No Sourcing Fallback" : isRefused ? "Supplier refused offer" : isPlanB ? "Pipeline Fallback Executed" : "Pending Quote"}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className="time">{new Date(notif.dateAlerte).toLocaleString()}</span>
                                                    <button
                                                        className="btn-mark-read"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsRead(notif._id);
                                                        }}
                                                    >
                                                        Mark as Read
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {quoteNotifications.length === 0 && refusedQuotes.length === 0 && planB.length === 0 && noFallback.length === 0 && (
                                        <div className="empty-msg">No activity from suppliers yet.</div>
                                    )}
                                </div>
                            </section>


                            <section className="admin-notif-group">
                                <div className="group-header" style={{borderBottom: '3px solid #6952d2'}}>
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
                                                    <p className="msg"><strong>In Transit</strong>: {notif.message}
                                                    </p>

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

                    <div className="category-container">
                        <div className="category-modern-header">
                            <div className="header-text">
                                <h1>Dashboard Global</h1>
                                <p>Monitor inventory performance and stock status.</p>
                            </div>
                        </div>

                        <section className="stats-dashboard-grid">

                            <div className="status-glass-card warning-light">
                                <div className="card-icon-wrapper"><FaChartBar/></div>
                                <div className="dash-card-content">
                                    <h3 className="stat-number">{products?.filter(p => p.quantiteDisponible <= (p.seuilCritique || 5)).length || 0}</h3>
                                    <p>Critical Stock Items</p>
                                </div>
                            </div>

                            {/* Card 2: Pending Suppliers */}
                            <div className="status-glass-card pending-light"
                                 onClick={() => setActiveSection("notifications")}>
                                <div className="card-icon-wrapper"><FaUserClock/></div>
                                <div className="dash-card-content">
                                    <h3 className="stat-number">{pendingFournisseurs.length}</h3>
                                    <p>Pending Suppliers</p>
                                </div>
                            </div>


                            <div className="status-glass-card success-light">
                                <div className="card-icon-wrapper"><FaCheckCircle/></div>
                                <div className="dash-card-content">
                                    <h3 className="stat-number">{validatedFournisseurs.length}</h3>
                                    <p>Verified Partners</p>
                                </div>
                            </div>

                            {/* Card 4: Restock Orders */}
                            <div className="status-glass-card primary-light"
                                 onClick={() => setActiveSection("restock_orders")}>
                                <div className="card-icon-wrapper"><FaInbox/></div>
                                <div className="dash-card-content">
                                    <h3 className="stat-number">{replenishmentRequests.length}</h3>
                                    <p >Replenishment Orders</p>
                                </div>
                            </div>
                        </section>
                        <div className="dashboard-content fade-in">

                            <div className="dashboard-controls-wrapper">

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
                                            <FaFilePdf/> Download Full Report
                                        </button>
                                    </div>
                                </div>


                                <div className="ai-metrics-legend-box">
                                    <div className="legend-item">
                                        <span className="legend-dot forecast-dot"></span>
                                        <div className="legend-text">
                                            <span className="legend-label">AI Forecast:</span>
                                            <span className="legend-desc">Predicted market demand volume for the next period.</span>
                                        </div>
                                    </div>

                                    <div className="legend-vertical-line"></div>

                                    <div className="legend-item">
                                        <span className="legend-dot reorder-dot"></span>
                                        <div className="legend-text">
                                            <span className="legend-label">Recommended Reorder:</span>
                                            <span className="legend-desc">Exact action quantity needed now (Forecast balanced minus Current Stock).</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="reports-grid-compact">
                                {currentReports.map((item) => {

                                    const otherSuppliers = item.allSuppliers
                                        ? item.allSuppliers
                                            .filter(s => s.name !== item.bestSupplier?.name)
                                            .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
                                        : [];

                                    return (
                                        <div key={item.produitId} className="report-card-small">
                                            <div className="card-top">
                                                <div className="title-group">
                                                    <h4>{item.nomProduit}</h4>
                                                    <span className="ref-text">Ref: {item.produitId}</span>
                                                </div>
                                                <span
                                                    className={`mini-badge ${item.quantiteDisponible <= item.seuilCritique ? 'crit' : 'ok'}`}>
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
                                                    <span
                                                        className="teach-text">+{item.prediction?.predicted_demand || 0}</span>
                                                </div>
                                                <div className="mini-stat">
                                                    <label>Recommended Reorder</label>
                                                    <span
                                                        className="peach-text">+{item.prediction?.recommended_quantity || 0}</span>
                                                </div>
                                            </div>


                                            <div className="ai-supplier-mini">
                                                <div className="supplier-info-header">
                                                    <p><span className="best-label">⭐ Best supplier:</span>
                                                        <strong>{item.bestSupplier?.name || "Searching..."}</strong></p>
                                                    <span
                                                        className="ai-score-number">{item.bestSupplier?.ai_score || 0}%</span>
                                                </div>
                                                <div className="score-bar-bg">
                                                    <div className="score-bar-fill"
                                                         style={{width: `${item.bestSupplier?.ai_score || 0}%`}}></div>
                                                </div>
                                            </div>

                                            <div className="other-suppliers-wrapper">
                                                <label className="fallback-title">Alternative Sourcing Pipeline:</label>
                                                <div className="other-suppliers-list">
                                                    {otherSuppliers.length > 0 ? (
                                                        otherSuppliers.map((sup, index) => (
                                                            <div key={index} className="other-supplier-item">
                                                                <span className="other-sup-name">👤 {sup.name}</span>
                                                                <span
                                                                    className="other-sup-score">{sup.ai_score || 0}%</span>
                                                            </div>
                                                        ))
                                                    ) : (

                                                        <p className="no-other-suppliers">⚠️ No other suppliers
                                                            available for this product</p>
                                                    )}
                                                </div>
                                            </div>

                                            <button className="btn-mini-pdf" onClick={() => generateSinglePDF(item)}>
                                                <FaFilePdf/> PDF
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="catalog-pagination">
                                <button
                                    className="pagi-nav-btn"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
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
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </div>
                    </>
                )}
                {activeSection === "restock_orders" && (
                    <div className="restock-modern-container fade-in">
                        <header className="restock-header-modern">
                            <div className="category-modern-header">
                                <div className="header-text">
                                    <h1>Critical Replenishment</h1>
                                    <p>High-priority orders waiting for your approval</p>
                                </div>
                            </div>
                            <div className="header-badge">
                                <span className="pulse-dot"></span>
                                {replenishmentRequests.length} Requests Pending
                            </div>
                        </header>

                        <div className="restock-grid">
                            {replenishmentRequests.length === 0 ? (
                                <div className="empty-state-card">
                                    <FaInbox size={50}/>
                                    <p>Great job! No pending requests at the moment.</p>
                                </div>
                            ) : (
                                replenishmentRequests.map((req) => (
                                    <div key={req._id} className="restock-card-modern">
                                        <div className="card-status-line"></div>
                                        <div className="card-body">
                                            <div className="product-info-row">
                                                <div className="p-avatar">
                                                    {req.productImage ? (
                                                        <img
                                                            src={req.productImage}
                                                            alt={req.productName}
                                                            className="product-card-img"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.parentElement.innerText = req.productName.charAt(0).toUpperCase();
                                                            }}
                                                        />
                                                    ) : (
                                                        req.productName.charAt(0).toUpperCase()
                                                    )}
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
                                                    <span
                                                        className="stat-value highlight">{req.requestedQty} Units</span>
                                                </div>
                                                <div className="stat-box">
                                                    <span className="stat-label">Requested By</span>
                                                    <span className="stat-value">{req.fromManager}</span>
                                                </div>
                                                <div className="stat-box">
                                                    <span className="stat-label">Request Date</span>
                                                    <span
                                                        className="stat-value">{new Date(req.dateAlerte || Date.now()).toLocaleDateString()}</span>
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
                            setAllNotifications(prev => prev.filter(n => n._id !== id));
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
                        <div className="pro-profile-wrapper fade-in">
                            <div className="pro-profile-card">
                                <div className="pro-profile-header">
                                    <div className="pro-avatar-section">
                                        <div className="pro-avatar-wrapper">
                                            <div className="pro-avatar-overlay">
                                                <FaCamera/>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="pro-avatar-input"
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
                                                                        {headers: {Authorization: `Bearer ${token}`}}
                                                                    );
                                                                } catch (err) {
                                                                    console.error("Error updating image", err);
                                                                }
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {profile?.image ? (
                                                <img src={profile.image} alt="Profile" className="pro-avatar-img"/>
                                            ) : (
                                                <div className="pro-avatar-placeholder">
                                                    <FaUser size={45}/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pro-header-info">
                                        <h2 className="pro-user-name">{profile?.prenom || ""} {profile?.nom || ""}</h2>
                                        <p className="pro-role-tag"><FaUserShield/> Procurement Manager Specialist</p>
                                    </div>
                                </div>

                                <div className="pro-profile-intro">
                                    The Procurement Manager supervises inventory, products, and analytics.
                                    Responsibilities
                                    include monitoring stock levels, tracking performance, and coordinating with staff
                                    for
                                    efficient workflow.
                                </div>

                                <div className="pro-form-grid">
                                    <div className="pro-input-group">
                                        <label><FaUser/> First Name</label>
                                        <input type="text" value={profile?.nom || ""} readOnly
                                               className="pro-readonly"/>
                                    </div>
                                    <div className="pro-input-group">
                                        <label><FaUser/> Last Name</label>
                                        <input type="text" value={profile?.prenom || ""} readOnly
                                               className="pro-readonly"/>
                                    </div>

                                    <div className="pro-input-group">
                                        <label><FaEnvelope/> Email Address</label>
                                        <input type="email" value={profile?.email || ""} readOnly
                                               className="pro-readonly"/>
                                    </div>
                                    <div className="pro-input-group">
                                        <label><FaPhone/> Phone</label>
                                        <input
                                            type="text"
                                            value={profile?.phone || ""}
                                            onChange={e => setProfile({...profile, phone: e.target.value})}
                                        />
                                    </div>

                                    <div className="pro-input-group">
                                        <label><FaIdCard/> CIN</label>
                                        <input
                                            type="text"
                                            value={profile?.cin || ""}
                                            onChange={e => setProfile({...profile, cin: e.target.value})}
                                        />
                                    </div>
                                    <div className="pro-input-group">
                                        <label><FaCheckCircle/> Status</label>
                                        <input type="text" value={profile?.status || ""} readOnly
                                               className="pro-readonly"/>
                                    </div>

                                    <div className="pro-input-group">
                                        <label><FaBriefcase/> Role</label>
                                        <input type="text" value={profile?.metierRole || "Procurement Manager"} readOnly
                                               className="pro-readonly"/>
                                    </div>
                                    <div className="pro-input-group">
                                        <label><FaCalendarAlt/> Join Date</label>
                                        <input type="text" value={profile?.createdAt || ""} readOnly
                                               className="pro-readonly"/>
                                    </div>
                                </div>

                                <div className="pro-form-footer">
                                    <button className="pro-save-btn" onClick={async () => {
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
                                                <th style={{textAlign: "center"}}>Actions</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {pendingFournisseurs.map((f) => (
                                                <tr key={f._id}>
                                                    <td>
                                                        <div className="fs-user-info">
                                                            <div
                                                                className="fs-avatar-sm">{f.fournisseur?.firstName?.charAt(0)}</div>
                                                            <strong>{f.fournisseur?.firstName} {f.fournisseur?.lastName}</strong>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="fs-contact-cell">
                                                            <span>{f.fournisseur?.email}</span>
                                                            <small>{f.fournisseur?.phone}</small>
                                                        </div>
                                                    </td>
                                                    <td><span className="fs-cin-badge">{f.fournisseur?.cin}</span></td>
                                                    <td><span className="fs-role-tag">{f.fournisseur?.role}</span></td>
                                                    <td>{new Date(f.dateAlerte).toLocaleDateString()}</td>
                                                    <td>
                                                        {f.fournisseur?.cvPath ? (
                                                            <button
                                                                className="fs-download-btn light"
                                                                onClick={() => {
                                                                    const cleanPath = f.fournisseur.cvPath.replace(/^\/?uploads\/cv\//, '').replace(/\\/g, '/');
                                                                    const fileName = cleanPath.split('/').pop();
                                                                    downloadCV(fileName);
                                                                }}
                                                            >
                                                                <FaDownload/> CV
                                                            </button>
                                                        ) : (
                                                            <span className="no-data">N/A</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="fs-actions-gap">
                                                            <button
                                                                className="fs-btn-validate"
                                                                onClick={() => updateNotificationStatus(f._id, "validated", f.fournisseur?.userId)}
                                                            >
                                                                Validate
                                                            </button>
                                                            <button
                                                                className="fs-btn-reject"
                                                                onClick={() => updateNotificationStatus(f._id, "rejected", f.fournisseur?.userId)}
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
                            <div className="fs-main-header" style={{marginTop: '40px'}}>
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
                                                            <div
                                                                className="fs-avatar-sm green-style">{f.firstName?.charAt(0)}</div>
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
                                                            <button className="fs-download-btn light"
                                                                    onClick={() => downloadCV(f.cvFile.replace(/^\/?uploads\/cv\//, ''))}>
                                                                <FaDownload/> CV
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