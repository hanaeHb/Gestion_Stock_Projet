import React, { useState, useEffect } from "react";
import "./Manager.css";
import {
    FaBell,
    FaChartBar,
    FaFolder,
    FaCog,
    FaUser,
    FaSignOutAlt,
    FaBoxes
} from "react-icons/fa";
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
                                    <div style={{width:"75%"}}/>
                                </div>
                            </li>

                            <li>
                                <span>Sales Performance</span>
                                <div className="bar">
                                    <div style={{width:"60%"}}/>
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
                    <div className="profile-panel">
                        <h3>Personal Information</h3>

                        <div className="profile-intro">
                            The manager supervises inventory, products, and analytics. Responsibilities include
                            monitoring stock levels, tracking performance, and coordinating with staff for efficient
                            workflow.
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
                            /></div>
                            <div className="form-group"><label>Status</label><input type="text"
                                                                                    value={profile?.status || ""}
                                                                                    readOnly/></div>
                        </div>

                        <div className="profile-info-two-columns">
                            <div className="form-group"><label>Role</label><input type="text"
                                                                                  value={profile?.metierRole || "Manager"}
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
            </main>

        </div>
    );
}