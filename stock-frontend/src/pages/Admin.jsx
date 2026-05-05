import React, { useState, useEffect, useRef } from "react";
import "./Admin.css";
import {
    FaBell,
    FaComments,
    FaChartBar,
    FaUserTie,
    FaCog,
    FaUsers,
    FaUser,
    FaSignOutAlt,
    FaEnvelope,
    FaLock,
    FaTrash,
    FaEdit,
    FaPhone,
    FaBoxes,
    FaTruckLoading, FaCalendarAlt, FaShieldAlt, FaIdCard,
    FaDownload, FaArrowLeft,FaArrowRight
} from "react-icons/fa";
import { BiCategory } from "react-icons/bi";
import { TbCategory } from "react-icons/tb";
import { HiViewGridAdd } from "react-icons/hi";
import { FaTruck } from "react-icons/fa";
import "./CreateProduitForm";
import { FiDollarSign, FiCalendar, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import { FiGrid, FiCreditCard} from "react-icons/fi";
import UsersRoleChart from "./UsersRoleChart";
import UsersStatusChart from "./UsersStatusChart";
import axios from "axios";
import CreateProduitForm from "./CreateProduitForm";
import {motion} from "framer-motion";
import BudgetManagement from "./BudgetManagement";
import AnalyticsDashboard from "./AnalyticsDashboard";
import AdminNotifications from "./AdminNotifications";
export default function Admin() {
    const [activeSection, setActiveSection] = useState("dashboard");
    const [showForm, setShowForm] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const dropdownRef = useRef(null);
    const [profile, setProfile] = useState(null);
    // ===================== Profile States =====================
    const API_URL = "http://localhost:8888/security-stock/v1/users";
    const token = localStorage.getItem("token");
    const adminId = 1; // replace with dynamic ID if needed
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    const [userData, setUserData] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        cin: "",
        role: ["ADMIN"]
    });
    const [formError, setFormError] = useState("");
    const [profileData, setProfileData] = useState({
        metierRole: "ADMIN"
    });
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 6;

    const filteredUsers = users.filter(user => !user.roles.includes("Fournisseur"));
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    // ===================== fournisseur pages ===================
    const [currentPageFournisseurs, setCurrentPageFournisseurs] = useState(1);

    const fournisseurs = users.filter(user => user.roles.includes("Fournisseur"));

    const indexOfLastFournisseur = currentPageFournisseurs * usersPerPage;
    const indexOfFirstFournisseur = indexOfLastFournisseur - usersPerPage;
    const currentFournisseurs = fournisseurs.slice(indexOfFirstFournisseur, indexOfLastFournisseur);
    // ===================== Click Outside Dropdown =====================
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenProfile(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // ===================== Fetch Admin Profile =====================

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(
                    "http://localhost:8888/usersservice/v1/user-profiles/me",
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log(res.data);
                setProfile(res.data);
                setAdminData(res.data);
            } catch (err) {
                console.error("Error loading profile", err);
            }
        };
        fetchProfile();
    }, []);

    // ===================== Update Profile =====================
    const handleUpdate = (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const updatedData = {
            phone: adminData.phone,
            cin: adminData.cin,
        };
        fetch(`http://localhost:8888/usersservice/v1/user-profiles/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedData),
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to update admin");
                return res.json();
            })
            .then(data => {
                setAdminData(data);
                alert("Profile updated successfully");
            })
            .catch(err => alert("Error updating profile: " + err.message));
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch("http://localhost:8888/security-stock/v1/users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const data = await res.json();

            setUsers(data);

        } catch (error) {
            console.error(error);
            alert("Erreur lors du chargement des utilisateurs: " + error.message);
        }
    };

    const createUser = async () => {

        // ✅ Front validation
        if (!isValidEmail(userData.email)) {
            alert("Email invalide ❌");
            return;
        }

        if (!userData.firstName || !userData.lastName || !userData.password) {
            alert("Tous les champs sont obligatoires ❌");
            return;
        }

        try {
            const userRes = await fetch("http://localhost:8888/security-stock/v1/users/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });


            const data = await userRes.json();

            if (!userRes.ok) {

                throw new Error(
                    data.message ||
                    data.email ||
                    "Erreur lors de la création ❌"
                );
            }

            alert("User créé avec succès ✅");

            fetchUsers();
            setShowForm(false);

            setUserData({
                email: "",
                password: "",
                firstName: "",
                lastName: "",
                phone: "",
                cin: "",
                role: ["Manager"]
            });

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const [allBudgets, setAllBudgets] = useState([]);

    const fetchAllBudgets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get("http://localhost:8888/budgetstock/v1/budgets", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllBudgets(res.data);
        } catch (err) {
            console.error("Error fetching budgets", err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchProducts();
        fetchCategories();
        fetchAllBudgets();
    }, []);

    const handleUpdateUser = async () => {
        try {
            const res = await fetch(`${API_URL}/user/${editingUser.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    firstName: editingUser.firstName,
                    lastName: editingUser.lastName,
                    email: editingUser.email,
                    phone: editingUser.phone,
                    cin: editingUser.cin,
                    roles: editingUser.roles
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Erreur lors de la mise à jour");
            }

            const data = await res.json();
            alert("User updated successfully!");
            fetchUsers();
            setEditingUser(null);

        } catch (err) {
            console.error(err);
            alert("Update error: " + err.message);
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            const res = await fetch(`http://localhost:8888/security-stock/v1/users/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to delete user");

            alert("User deleted successfully!");
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Error deleting user: " + error.message);
        }
    }
    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await fetch(`http://localhost:8888/security-stock/v1/users/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    active: !currentStatus
                })
            });

            fetchUsers();

        } catch (error) {
            console.error(error);
            alert("Erreur lors du changement du statut");
        }
    };

    const [pendingFournisseurs, setPendingFournisseurs] = useState([]);
    const [validatedFournisseurs, setValidatedFournisseurs] = useState([]);

    const fetchPendingFournisseurs = async () => {
        try {
            const res = await fetch(
                "http://localhost:8888/service-notification/api/notifications/pending",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Erreur fetch pending");
            const data = await res.json();

            setPendingFournisseurs(Array.isArray(data) ? data : data.fournisseurs || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchValidatedFournisseurs = async () => {
        try {
            const res = await fetch(
                "http://localhost:8888/service-notification/api/notifications/validated",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Erreur fetch validated");
            const fournisseurs5003 = await res.json();
            const fournisseursArray = Array.isArray(fournisseurs5003) ? fournisseurs5003 : fournisseurs5003.fournisseurs || [];

            const resUsers = await fetch(
                "http://localhost:8888/security-stock/v1/users",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!resUsers.ok) throw new Error("Erreur fetch users");
            const users = await resUsers.json();

            const merged = fournisseursArray.map(f => {
                const user = users.find(u => u.email === f.email);
                return { ...f, active: user?.active || false };
            });

            setValidatedFournisseurs(merged);

        } catch (err) {
            console.error(err);
        }
    };

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
    useEffect(() => {
        fetchPendingFournisseurs();
        fetchValidatedFournisseurs();
    }, []);

    // ===================== Category States =====================
    const [categories, setCategories] = useState([]);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [categoryData, setCategoryData] = useState({
        nom: "",
        description: ""
    });

    // Fetch Categories
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

    // Create Category
    const createCategory = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:8888/produit-stock-service/v1/categories", categoryData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Category created! ✅");
            resetCategoryForm();
            fetchCategories();
        } catch (err) {
            alert("Error during creation ❌");
        }
    };

    // ===================== Category Update States =====================
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategoryId, setCurrentCategoryId] = useState(null);

    const handleEditClick = (cat) => {
        setCategoryData({ nom: cat.nom, description: cat.description });
        setCurrentCategoryId(cat.id);
        setIsEditing(true);
        setShowCategoryForm(true);
    };

    const updateCategory = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:8888/produit-stock-service/v1/categories/${currentCategoryId}`, categoryData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Catégorie mise à jour ! ✅");
            resetCategoryForm();
            fetchCategories();
        } catch (err) {
            alert("Erreur lors de la modification ❌");
        }
    };
    const resetCategoryForm = () => {
        setCategoryData({ nom: "", description: "" });
        setShowCategoryForm(false);
        setIsEditing(false);
        setCurrentCategoryId(null);
    };
    // Delete Category
    const deleteCategory = async (id) => {
        if (!window.confirm("Voulez-vous supprimer cette catégorie ?")) return;
        try {
            await axios.delete(`http://localhost:8888/produit-stock-service/v1/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCategories();
        } catch (err) {
            alert("Impossible de supprimer : Catégorie liée à des produits ❌");
        }
    };

    useEffect(() => {
        if (activeSection === "categorys") {
            fetchCategories();
            setCurrentCatPage(1);
        }
    }, [activeSection]);

    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

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
    const totalProductsCount = products.length;

    const lowStockCount = products.filter(p => p.quantiteDisponible <= (p.seuilCritique || 5)).length;
    const totalCategoriesCount = categories.length;
    const [notifs, setNotifs] = useState([]);
    const [notifsLoading, setNotifsLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const fetchAllNotifications = async () => {
        try {
            setNotifsLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8888/service-notification/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = Array.isArray(res.data) ? res.data : (res.data.notifications || []);
            setNotifs(data);
            setNotifsLoading(false);
        } catch (err) {
            console.error("Error fetching notifications", err);
            setNotifsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllNotifications();
    }, []);
    const [currentCatPage, setCurrentCatPage] = useState(1);
    const catsPerPage = 6;

    const lastCatIndex = currentCatPage * catsPerPage;
    const firstCatIndex = lastCatIndex - catsPerPage;

    const currentCategoriesList = categories.slice(firstCatIndex, lastCatIndex);

    const totalCatPages = Math.ceil(categories.length / catsPerPage);
    const itemsPerPage = 6;
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
        <div className="admin-container">

            {/* ===================== Sidebar ===================== */}
            <aside className="sidebar">
                <ul className="menu">
                    <li className={activeSection === "dashboard" ? "active" : ""}
                        onClick={() => setActiveSection("dashboard")}>
                        <FiGrid/>
                    </li>

                    <li className={activeSection === "analytics" ? "active" : ""}
                        onClick={() => setActiveSection("analytics")}>
                        <FaChartBar/>
                    </li>

                    <li className={activeSection === "fournisseurs" ? "active" : ""}
                        onClick={() => setActiveSection("fournisseurs")}>
                        <FaUserTie/>
                    </li>

                    <li className={activeSection === "users" ? "active" : ""}
                        onClick={() => setActiveSection("users")}>
                        <FaUsers/>
                    </li>
                    <li className={activeSection === "products" ? "active" : ""}
                        onClick={() => setActiveSection("products")}>
                        <FaBoxes/>
                    </li>
                    <li className={activeSection === "categorys" ? "active" : ""}
                        onClick={() => setActiveSection("categorys")}>
                        <HiViewGridAdd/>
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

            {/* ===================== Main Content ===================== */}
            <main className="main">

                {/* ===================== Top Nav ===================== */}
                <div className="top-nav">
                    <a href="/" className="nav-logo">
                        <span className="logo-box">GO</span>
                        <img src="/images/logoostock.jpeg" alt="Stockflow Logo" className="logo-image"/>
                    </a>


                    <div className="nav-right">
                        <div className="nav-badge">
                            <div>
                                <ul className="menu">
                                    <li className={activeSection === "bell" ? "active" : ""}
                                        onClick={() => setActiveSection("bell")}>
                                        <div className="bell-wrapper">
                                            <FaBell/>
                                            {totalCount > 0 && <span className="bell-badge-count">{totalCount}</span>}
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="nav-dropdown" ref={dropdownRef}>
                            <div
                                className="nav-avatar"
                                onClick={() => setActiveSection("profile")}
                            >
                            <FaUser/>
                            </div>
                        </div>
                        <p>{adminData?.prenom}</p>
                    </div>
                </div>

                {activeSection === "budget" && <BudgetManagement />}
                {activeSection === "bell" && (
                    <AdminNotifications
                        notifications={notifs}
                        refresh={fetchAllNotifications}
                        loading={notifsLoading}
                        setTotalCount={setTotalCount}
                    />
                )}

                {/* ===================== Dashboard ===================== */}
                {activeSection === "dashboard" && (
                    <>
                        <div className="category-container">
                            <div className="category-modern-header">
                                <div className="header-text">
                                    <h1>Stock & Users Dashboard</h1>
                                    <p>Organize and structure your inventory hierarchy</p>
                                </div>
                            </div>

                            <section className="dash-cards-container fade-in">

                                {/* Total Products */}
                                <div className="dash-card">
                                    <div className="dash-card-icon-wrapper">
                                        <FaBoxes/>
                                    </div>
                                    <div className="dash-card-content">
                                        <h3>{totalProductsCount}</h3>
                                        <p>Total Products</p>
                                    </div>
                                </div>

                                {/* Low Stock */}
                                <div className="dash-card">
                                    <div className="dash-card-icon-wrapper low-stock-icon">
                                        <FaChartBar/>
                                    </div>
                                    <div className="dash-card-content">
                                        <h3 className="warning-text">{lowStockCount}</h3>
                                        <p>Low Stock Items</p>
                                    </div>
                                </div>

                                {/* Total Users */}
                                <div className="dash-card">
                                    <div className="dash-card-icon-wrapper">
                                        <FaUsers/>
                                    </div>
                                    <div className="dash-card-content">
                                        <h3>{users.filter(user => !user.roles.includes("Fournisseur")).length}</h3>
                                        <p>Active Staff</p>
                                    </div>
                                </div>

                                {/* Total Suppliers */}
                                <div className="dash-card">
                                    <div className="dash-card-icon-wrapper supplier-icon">
                                        <FaUserTie/>
                                    </div>
                                    <div className="dash-card-content">
                                        <h3>{users.filter(user => user.roles.includes("Fournisseur")).length}</h3>
                                        <p>Total Suppliers</p>
                                    </div>
                                </div>

                                {/* Top Role */}
                                <div className="dash-card large">
                                    <div className="dash-card-icon-wrapper role-icon">
                                        <FaCog/>
                                    </div>
                                    <div className="dash-card-content">
                                        <h3>
                                            {(() => {
                                                if (!users.length) return "-";
                                                const roleCount = {};
                                                users.forEach(u => u.roles?.forEach(r => roleCount[r] = (roleCount[r] || 0) + 1));
                                                const topRole = Object.entries(roleCount).sort((a, b) => b[1] - a[1])[0];
                                                return topRole ? `${topRole[0]} (${topRole[1]})` : "-";
                                            })()}
                                        </h3>
                                        <p>Dominant System Role</p>
                                    </div>
                                </div>

                                {/* Total Categories */}
                                <div className="dash-card">
                                    <div className="dash-card-icon-wrapper category-icon">
                                        <HiViewGridAdd/>
                                    </div>
                                    <div className="dash-card-content">
                                        <h3>{totalCategoriesCount}</h3>
                                        <p>Total Categories</p>
                                    </div>
                                </div>
                            </section>

                            {/* ===================== Users Charts ===================== */}
                            <div className="charts-row" style={{marginTop: "40px"}}>

                                <section className="role-chart-section">
                                    <h3>Users by Role</h3>
                                    <div style={{height: "250px"}}>
                                        <UsersRoleChart users={users}/>
                                    </div>
                                </section>

                                <section className="role-chart-section">
                                    <h3>Users Status</h3>
                                    <div style={{height: "250px"}}>
                                        <UsersStatusChart users={users}/>
                                    </div>
                                </section>

                            </div>
                        </div>
                    </>
                )}

                {/* ===================== Analytics ===================== */}
                {activeSection === "analytics" && (
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        transition={{duration: 0.4}}
                    >
                        <AnalyticsDashboard
                            products={products}
                            categories={categories}
                            budgets={allBudgets}
                        />
                    </motion.div>
                )}

                {/* ===================== fournisseurs ===================== */}
                {activeSection === "fournisseurs" && (
                    <div className="fs-section-container animate-fade-in">

                        <div className="fs-main-header">
                            <div className="header-text">
                                <h1>Suppliers Management</h1>
                                <p>Monitor, approve, and manage your network of professional suppliers.</p>
                            </div>
                            <div className="fs-stats-badge">
                                Total: {pendingFournisseurs.length + validatedFournisseurs.length}
                            </div>
                        </div>

                        {/* ===================== Pending Suppliers (Cards or Table) ===================== */}
                        <div className="fs-card-wrapper">
                            <div className="fs-table-header pending">
                                <div className="title-with-dot">
                                    <span className="dot yellow"></span>
                                    <h3>Pending Requests</h3>
                                </div>
                                <span className="count-label">{pendingFournisseurs.length} Pending</span>
                            </div>

                            <div className="fs-table-responsive">
                                <table className="fs-modern-table">
                                    <thead>
                                    <tr>
                                        <th>Supplier Name</th>
                                        <th>Contact Info</th>
                                        <th>CIN / ID</th>
                                        <th>Request Date</th>
                                        <th>CV Document</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Array.isArray(pendingFournisseurs) && pendingFournisseurs.length > 0 ? (
                                        pendingFournisseurs.map(f => (
                                            <tr key={f._id || f.id}>
                                                <td>
                                                    <div className="fs-user-info">
                                                        <div className="fs-avatar-sm">{f.firstName?.charAt(0)}</div>
                                                        <span>{f.firstName} {f.lastName}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="fs-contact-cell">
                                                        <small><FaEnvelope /> {f.email}</small>
                                                        <small><FaPhone /> {f.phone}</small>
                                                    </div>
                                                </td>
                                                <td><span className="fs-cin-badge">{f.cin}</span></td>
                                                <td>{new Date(f.dateAlerte).toLocaleDateString()}</td>
                                                <td>
                                                    {f.cvFile ? (
                                                        <button className="fs-download-btn light" onClick={() => downloadCV(f.cvFile.replace(/^\/?uploads\/cv\//, ''))}>
                                                            <FaDownload /> View CV
                                                        </button>
                                                    ) : <span className="no-data">N/A</span>}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="empty-state">No pending requests at the moment.</td></tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ===================== Validated Suppliers ===================== */}
                        <div className="fs-card-wrapper">
                            <div className="fs-table-header validated">
                                <div className="title-with-dot">
                                    <span className="dot green"></span>
                                    <h3>Validated Suppliers</h3>
                                </div>
                                <span className="count-label">{validatedFournisseurs.length} Active</span>
                            </div>

                            <div className="fs-table-responsive">
                                <table className="fs-modern-table">
                                    <thead>
                                    <tr>
                                        <th>Supplier Name</th>
                                        <th>Email & Phone</th>
                                        <th>Status</th>
                                        <th>Valid Since</th>
                                        <th>CV</th>
                                        <th style={{textAlign: "center"}}>Account</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Array.isArray(validatedFournisseurs) && validatedFournisseurs.length > 0 ? (
                                        validatedFournisseurs.map(f => (
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
                                                <td>
                                        <span className={`fs-status-pill ${f.active ? 'active' : 'inactive'}`}>
                                            {f.active ? "Active" : "Disabled"}
                                        </span>
                                                </td>
                                                <td>{new Date(f.dateAlerte).toLocaleDateString()}</td>
                                                <td>
                                                    {f.cvFile ? (
                                                        <button className="fs-download-btn" onClick={() => downloadCV(f.cvFile.replace(/^\/?uploads\/cv\//, ''))}>
                                                            <FaDownload /> CV
                                                        </button>
                                                    ) : "N/A"}
                                                </td>
                                                <td>
                                                    <div className="fs-toggle-wrapper">
                                                        <label className="fs-modern-switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={f.active}
                                                                onChange={async () => {
                                                                    try {
                                                                        const user = await fetch(`http://localhost:8888/security-stock/v1/users/${f.userId}/status`, {
                                                                            method: "PATCH",
                                                                            headers: {
                                                                                "Content-Type": "application/json",
                                                                                Authorization: `Bearer ${token}`
                                                                            },
                                                                            body: JSON.stringify({active: !f.active})
                                                                        });
                                                                        if (!user.ok) throw new Error("Failed to update status");
                                                                        fetchValidatedFournisseurs();
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        alert("Erreur lors du toggle: " + err.message);
                                                                    }
                                                                }}
                                                            />
                                                            <span className="fs-slider"></span>
                                                        </label>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="empty-state">No validated suppliers found.</td></tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {/* ===================== users ===================== */}
                {activeSection === "users" && (
                    <div className="section-content users-section animate-fade-in">
                        <div className="users-container">
                            <div className="users-modern-header">
                                <div className="header-text">
                                    <h1>User Management</h1>
                                    <p>
                                        Here, you can efficiently manage all users, update information,
                                        and maintain an organized security base.
                                    </p>
                                </div>
                                <button
                                    className={`add-user-fab ${showForm ? 'cancel' : ''}`}
                                    onClick={() => setShowForm(!showForm)}
                                >
                                    <span className="plus-icon">{showForm ? "✕" : "+"}</span>
                                    <span>{showForm ? "Cancel" : "Create User"}</span>
                                </button>
                            </div>

                            <div className="users-grid">
                                {currentUsers.map(user => (
                                    <div className="user-card" key={user.id}>
                                        <div className="user-card-top">
                                            <div className="user-avatar">
                                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                            </div>
                                            <div className="user-status-toggle">
                                                <label className="modern-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={user.active}
                                                        onChange={() => handleToggleStatus(user.id, user.active)}
                                                    />
                                                    <span className="modern-slider-round"></span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="user-card-info">
                                            <h3>{user.firstName} {user.lastName}</h3>
                                            <p className="user-email"><FaEnvelope /> {user.email}</p>
                                            {/* Role Badge */}
                                            <span className={`role-badge ${(user.roles && user.roles[0]) ? user.roles[0].toLowerCase() : 'default'}`}>
                                {user.roles?.join(", ") || "No Role"}
                            </span>
                                        </div>

                                        <div className="user-card-actions">
                                            <button className="action-btn edit" onClick={() => setEditingUser(user)}>
                                                <FaEdit /> Edit
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDelete(user.id)}>
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="modern-pagination">
                                <button
                                    className="pagi-nav-btn"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >  ← Previous  </button>

                                <div className="pagi-numbers-list">
                                    {Array.from({ length: Math.ceil(users.filter(u => !u.roles.includes("Fournisseur")).length / usersPerPage) }, (_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`pagi-num-btn ${currentPage === i + 1 ? "active" : ""}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className="pagi-nav-btn"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(users.filter(u => !u.roles.includes("Fournisseur")).length / usersPerPage)))}
                                    disabled={currentPage === Math.ceil(users.filter(u => !u.roles.includes("Fournisseur")).length / usersPerPage)}
                                > Next →  </button>
                            </div>
                        </div>

                        {showForm && (
                            <div className="um-overlay">
                                <div className="um-card">
                                    <div className="um-header">
                                        <h3><FaUsers/> Create New User</h3>
                                        <p>Enter credentials and assign a role</p>
                                    </div>
                                    <form className="um-form" onSubmit={(e) => { e.preventDefault(); createUser(); }}>
                                        {formError && <p className="um-error">{formError}</p>}

                                        <div className="um-grid-row">
                                            <div className="um-input-group">
                                                <label><FaUser/> First Name</label>
                                                <input
                                                    type="text"
                                                    value={userData.firstName}
                                                    onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="um-input-group">
                                                <label><FaUser/> Last Name</label>
                                                <input
                                                    type="text"
                                                    value={userData.lastName}
                                                    onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="um-input-group">
                                            <label><FaEnvelope/> Email</label>
                                            <input
                                                type="email"
                                                value={userData.email}
                                                onChange={(e) => setUserData({...userData, email: e.target.value})}
                                                required
                                            />
                                        </div>

                                        <div className="um-input-group">
                                            <label><FaCog/> Role</label>
                                            <select
                                                className="um-select"
                                                value={userData.role[0]}
                                                onChange={(e) => setUserData({...userData, role: [e.target.value]})}
                                            >
                                                <option value="ADMIN">ADMIN</option>
                                                <option value="Procurement Manager">Procurement Manager</option>
                                                <option value="Inventory Manager">Inventory Manager</option>
                                            </select>
                                        </div>

                                        <div className="um-input-group">
                                            <label><FaLock/> Password</label>
                                            <input
                                                type="password"
                                                value={userData.password}
                                                onChange={(e) => setUserData({...userData, password: e.target.value})}
                                                required
                                            />
                                        </div>

                                        <div className="um-footer">
                                            <button type="button" className="um-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                                            <button type="submit" className="um-btn-save">Save User</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {editingUser && (
                            <div className="um-overlay">
                                <div className="um-card">
                                    <div className="um-header">
                                        <h3><FaEdit/> Edit User</h3>
                                    </div>
                                    <form className="um-form" onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }}>
                                        <div className="um-grid-row">
                                            <div className="um-input-group">
                                                <label>First Name</label>
                                                <input
                                                    type="text"
                                                    value={editingUser.firstName}
                                                    onChange={e => setEditingUser({...editingUser, firstName: e.target.value})}
                                                />
                                            </div>
                                            <div className="um-input-group">
                                                <label>Last Name</label>
                                                <input
                                                    type="text"
                                                    value={editingUser.lastName}
                                                    onChange={e => setEditingUser({...editingUser, lastName: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="um-input-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                value={editingUser.email}
                                                onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                                            />
                                        </div>
                                        <div className="um-input-group">
                                            <label>Role</label>
                                            <select
                                                className="um-select"
                                                value={editingUser.roles[0]}
                                                onChange={(e) => setEditingUser({...editingUser, roles: [e.target.value]})}>
                                                <option value="ADMIN">ADMIN</option>
                                                <option value="Procurement Manager">Procurement Manager</option>
                                                <option value="Inventory Manager">Inventory Manager</option>
                                            </select>
                                        </div>
                                        <div className="um-footer">
                                            <button type="button" className="um-btn-cancel" onClick={() => setEditingUser(null)}>Cancel</button>
                                            <button type="submit" className="um-btn-save">Save Changes</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===================== Settings ===================== */}
                {activeSection === "settings" && (
                    <div className="panel large animate-fade-in">
                        <div className="settings-header">
                            <h3>⚙️ System Settings</h3>
                            <p>Fine-tune your stock and budget management rules.</p>
                        </div>

                        <div className="settings-grid">
                            <div className="settings-card">
                                <h4>🏢 Company Profile</h4>
                                <div className="setting-item">
                                    <label>Company Name</label>
                                    <input type="text" placeholder="My Warehouse Ltd" className="modern-input" />
                                </div>
                                <div className="setting-item">
                                    <label>Currency</label>
                                    <select className="modern-input">
                                        <option>Moroccan Dirham (DH)</option>
                                        <option>Euro (€)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="settings-card">
                                <h4>🔔 Budget & Notifications</h4>
                                <div className="setting-toggle">
                                    <span>Email alerts when budget is low</span>
                                    <input type="checkbox" defaultChecked />
                                </div>
                                <div className="setting-item">
                                    <label>Alert Threshold (%)</label>
                                    <input type="number" defaultValue={85} className="modern-input" />
                                </div>
                            </div>

                            <div className="settings-card">
                                <h4>🔒 Security</h4>
                                <button className="btn-outline">Change Admin Password</button>
                                <button className="btn-outline">Manage User Roles</button>
                            </div>
                        </div>

                        <div className="settings-footer">
                            <button className="confirm">Save Changes</button>
                        </div>
                    </div>
                )}

                {/* ===================== Profile ===================== */}
                {activeSection === "profile" && (
                    <div className="adm-profile-wrapper fade-in">
                        <div className="adm-profile-card">
                            <div className="adm-profile-header">
                                <div className="adm-avatar-circle">
                                    <FaShieldAlt />
                                </div>
                                <div className="adm-header-text">
                                    <h3>Admin Control Center</h3>
                                    <p>System security & management</p>
                                </div>
                            </div>

                            <div className="adm-profile-intro">
                                The administrator ensures system security, maintenance, and smooth operation.
                                Managing access rights and monitoring performance for an efficient workflow.
                            </div>

                            {loading ? (
                                <div className="adm-loading">Loading profile...</div>
                            ) : adminData && (
                                <form className="adm-profile-form" onSubmit={handleUpdate}>
                                    <div className="adm-form-grid">
                                        <div className="adm-input-group">
                                            <label><FaUser /> First Name</label>
                                            <input type="text" value={adminData?.nom} readOnly className="adm-readonly" />
                                        </div>

                                        <div className="adm-input-group">
                                            <label><FaUser /> Last Name</label>
                                            <input type="text" value={adminData?.prenom} readOnly className="adm-readonly" />
                                        </div>

                                        <div className="adm-input-group">
                                            <label><FaEnvelope /> Email Address</label>
                                            <input type="email" value={adminData?.email} readOnly className="adm-readonly" />
                                        </div>

                                        <div className="adm-input-group">
                                            <label><FaPhone /> Telephone</label>
                                            <input
                                                type="text"
                                                value={adminData.phone || ""}
                                                onChange={e => setAdminData({...adminData, phone: e.target.value})}
                                                placeholder="Enter phone number"
                                            />
                                        </div>

                                        <div className="adm-input-group">
                                            <label><FaIdCard /> CIN</label>
                                            <input
                                                type="text"
                                                value={adminData.cin || ""}
                                                onChange={e => setAdminData({...adminData, cin: e.target.value})}
                                                placeholder="Enter CIN"
                                            />
                                        </div>

                                        <div className="adm-input-group">
                                            <label><FaCalendarAlt /> Join Date</label>
                                            <input type="text" value={new Date(adminData.createdAt).toLocaleDateString() || ""} readOnly className="adm-readonly" />
                                        </div>
                                    </div>

                                    <div className="adm-form-footer">
                                        <button type="submit" className="adm-update-btn">
                                            Update Secure Profile
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
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
                                <p className="section-subtitle">List of All Products</p>
                            </div>
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
                                    <th className="th-info">Product Info</th>
                                    <th>Category</th>
                                    <th>Stock Level</th>
                                    <th>Status</th>
                                    <th>Actions</th>
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
                                                <button className="btn-edit-small">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="catalog-pagination">
                                {/* Previous Button */}
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
                {activeSection === "categorys" && (
                    <div className="section-content category-section">
                        <div className="category-container">
                            {/* Header Section */}
                            <div className="category-modern-header">
                                <div className="header-text">
                                    <h1>Category Management</h1>
                                    <p>Organize and structure your inventory hierarchy</p>
                                </div>
                                <button className="add-category-fab" onClick={() => setShowCategoryForm(true)}>
                                    <span className="plus-icon">+</span>
                                    <span>New Category</span>
                                </button>
                            </div>

                            <div className="category-info-alert">
                                <div className="info-icon">i</div>
                                <p>Use this panel to manage your catalog structure. A well-organized hierarchy improves
                                    stock tracking and reporting.</p>
                            </div>

                            <div className="category-grid">
                                {currentCategoriesList.map((cat) => (
                                    <div className="modern-cat-card" key={cat.id}>
                                        <div className="cat-card-header">
                                            <span className="cat-id-badge">ID: {cat.id}</span>
                                            <div className="cat-actions">
                                                <button className="icon-btn edit" onClick={() => handleEditClick(cat)}>
                                                    <FaEdit/>
                                                </button>
                                                <button className="icon-btn delete"
                                                        onClick={() => deleteCategory(cat.id)}>
                                                    <FaTrash/>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="cat-card-body">
                                            <h3 className="cat-title">{cat.nom}</h3>
                                            <p className="cat-desc">
                                                {cat.description || "No description available for this category."}
                                            </p>
                                        </div>
                                        <div className="cat-card-footer">
                                            <div className="dot-indicator"></div>
                                            <span>Active Category</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="catalog-pagination">
                                <button
                                    className="pagi-nav-btn"
                                    onClick={() => setCurrentCatPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentCatPage === 1}
                                >
                                    ← Previous
                                </button>

                                <div className="pagi-numbers-list">
                                    {[...Array(totalCatPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentCatPage(i + 1)}
                                            className={`pagi-num-btn ${currentCatPage === i + 1 ? "is-active" : ""}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className="pagi-nav-btn"
                                    onClick={() => setCurrentCatPage(prev => Math.min(prev + 1, totalCatPages))}
                                    disabled={currentCatPage === totalCatPages}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>

                        {showCategoryForm && (
                            <div className="modern-modal-overlay">
                                <div className="modern-modal-card">
                                    <div className="modal-header">
                                        <h3>{isEditing ? "Update Category" : "New Category"}</h3>
                                        <p>Fill in the details below</p>
                                    </div>
                                    <form onSubmit={isEditing ? updateCategory : createCategory}>
                                        <div className="modern-input-group">
                                            <label>Category Name</label>
                                            <input
                                                type="text"
                                                value={categoryData.nom}
                                                onChange={(e) => setCategoryData({...categoryData, nom: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="modern-input-group">
                                            <label>Description</label>
                                            <textarea
                                                rows="4"
                                                value={categoryData.description}
                                                onChange={(e) => setCategoryData({...categoryData, description: e.target.value})}
                                            />
                                        </div>
                                        <div className="modal-footer-btns">
                                            <button type="button" className="btn-close" onClick={resetCategoryForm}>Cancel</button>
                                            <button type="submit" className="btn-confirm">{isEditing ? "Save Changes" : "Create Now"}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                )}

            </main>
        </div>
    );
}