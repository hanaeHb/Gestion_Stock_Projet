import React from "react";
import "./home.css";
import Navbar from "../components/Navbar";
import { AiOutlineCloudSync } from "react-icons/ai";
import LogoScene from "./LogoScene"
import {
    FaFacebookF,
    FaInstagram,
    FaTwitter,
    FaLinkedinIn,
    FaMapMarkerAlt
} from "react-icons/fa";
import { FaPaperPlane } from "react-icons/fa";
import {
    FaBoxes,
    FaShoppingCart,
    FaCloud,
    FaChartLine
} from "react-icons/fa";
import {
    FaWarehouse,
    FaBell,
    FaBrain,
    FaUserShield
} from "react-icons/fa";
const Home = () => {
    return (
        <>
            <Navbar />   {}

            <div id="home" className="home">

                {/* HERO SECTION */}
                <section className="hero">

                    <div className="hero-text">
                        <p className="hero-subtitle">
                            The best Smart Inventory Management platform for modern businesses
                        </p>
                        <h1 className="hero-title">IN <span>GO <img src="/images/logoostock.jpeg" alt="Stockflow Logo"
                                                                    className="logo-image"/></span></h1>
                        <p className="hero-description">
                            Automate restocking, track your inventory in real-time,
                            and streamline your supply chain with our intelligent platform.
                        </p>
                        <div className="hero-buttons">
                            <button className="btn-primary">Book a Demo</button>
                            <button className="btn-primary" onClick={() => scrollToSection("contact")}>
                                Contact US
                            </button>
                        </div>
                    </div>

                    <div className="hero-image">
                    <div className="hero-image">
                            <LogoScene/>
                        </div>
                    </div>
                    {/* Gradient line at bottom of hero */}
                    <hr className="hero-hr"/>
                </section>

                {/* AMENITIES SECTION */}
                <section className="amenities">
                    <div className="amenities-header">
                        <h2 className="sec-sub">Discover Smart Features</h2>
                        <h1 className="section-main-title">Intelligent Tools</h1>
                        <div className="section-divider">
                            <div className="divider-line"></div>
                            <div className="divider-icon">
                                <AiOutlineCloudSync/>
                            </div>
                            <div className="divider-line"></div>
                        </div>
                        <p className="section-intro">
                            Optimize your inventory, automate tasks, and gain full control over your stock with our
                            cutting-edge management tools.
                        </p>


                    </div>
                </section>
                <hr className="amenities-hr"/>
                {/* TRUSTED BY */}
                <section id="about" className="smart-section">
                    <h2><span>About </span>GO StoCk</h2>

                    <div className="content-row">
                        <div className="left-image">
                            <img src="/images/logoostock.jpeg" alt="Smart Stock App"/>
                        </div>

                        <div className="right-text">
                            <p>
                                Our Smart Cloud-Native Inventory Management platform is designed to transform the way
                                organizations monitor, control, and optimize their stock operations. Built on a scalable
                                microservices architecture, the system centralizes product management, supplier
                                coordination, real-time stock tracking, and automated replenishment within a secure and
                                high-performance environment. The application integrates intelligent alert mechanisms
                                and AI-powered demand forecasting to anticipate shortages, reduce overstock, and support
                                data-driven strategic decisions. By combining automation, predictive analytics, and
                                role-based access control, the platform ensures operational efficiency, cost reduction,
                                and a smarter supply chain ecosystem tailored for modern enterprises.
                            </p>
                        </div>
                    </div>

                    <div className="center-button">
                        <button className="learn-btn">
                            Learn More <span className="arrow">→</span>
                        </button>
                    </div>

                </section>
                <section id="leading" className="trusted">
                    <p>Trusted by Leading Suppliers</p>
                    <div className="logos">
                        <span>DHL</span>
                        <span>FedEx</span>
                        <span>UPS</span>
                        <span>Maersk</span>
                    </div>
                </section>

                {/* FEATURES */}
                <section id="features" className="features">
                    <h2>Smart Inventory & Automated Restocking</h2>
                    <p className="section-sub">
                        Transform your inventory management with intelligent automation, predictive insights, and
                        seamless control across all your warehouses. Save time, reduce waste, and make smarter supply
                        chain decisions with Stockflow.
                    </p>

                    <div className="feature-grid">

                        <div className="feature-card card1">
                            <div className="feature-icon icon1">
                                <FaBoxes/>
                            </div>
                            <h3>Inventory Tracking</h3>
                            <p>
                                Monitor stock levels in real-time across multiple warehouses with
                                automated alerts and smart forecasting.
                            </p>
                        </div>

                        <div className="feature-card card2">
                            <div className="feature-icon icon2">
                                <FaShoppingCart/>
                            </div>
                            <h3>Order Management</h3>
                            <p>
                                Automate order workflows, manage suppliers and reduce
                                fulfillment delays with intelligent routing.
                            </p>
                        </div>

                        <div className="feature-card card3">
                            <div className="feature-icon icon3">
                                <FaCloud/>
                            </div>
                            <h3>Warehouse Cloud Sync</h3>
                            <p>
                                Seamless synchronization between distributed microservices and
                                cloud infrastructure.
                            </p>
                        </div>

                        <div className="feature-card card4">
                            <div className="feature-icon icon4">
                                <FaChartLine/>
                            </div>
                            <h3>Reporting & Analytics</h3>
                            <p>
                                Advanced dashboards powered by real-time data to optimize stock
                                performance.
                            </p>
                        </div>

                        <div className="feature-card card5">
                            <div className="feature-icon icon5">
                                <FaWarehouse/>
                            </div>
                            <h3>Multi-Warehouse Management</h3>
                            <p>
                                Manage and monitor inventory across multiple warehouses with
                                real-time synchronization and stock transfers.
                            </p>
                        </div>

                        <div className="feature-card card6">
                            <div className="feature-icon icon6">
                                <FaBell/>
                            </div>
                            <h3>Smart Alert System</h3>
                            <p>
                                Receive automatic notifications for low stock levels,
                                abnormal movements, and supply chain risks.
                            </p>
                        </div>
                        <div className="feature-card card7">
                            <div className="feature-icon icon7">
                                <FaBrain/>
                            </div>
                            <h3>AI Demand Forecasting</h3>
                            <p>
                                Predict future demand using intelligent algorithms based on
                                historical sales and seasonal trends.
                            </p>
                        </div>

                        <div className="feature-card card8">
                            <div className="feature-icon icon8">
                                <FaUserShield/>
                            </div>
                            <h3>Role-Based Access Control</h3>
                            <p>
                                Secure the platform with dynamic permissions and
                                role-based authentication for all users.
                            </p>
                        </div>
                    </div>

                </section>

                {/* CONTACT SECTION */}
                <section id="contact" className="contact-section">
                    <h2>Contact Us</h2>
                    <p className="contact-subtitle">
                        Have questions or need assistance? Send us a message and our team will get back to you.
                    </p>

                    <form className="contact-form">
                        <div className="form-group">
                            <input
                                type="email"
                                placeholder="Your Email Address"
                                required
                            />
                        </div>

                        <div className="form-group">
            <textarea
                placeholder="Write your message here..."
                rows="5"
                required
            ></textarea>
                        </div>

                        <button type="submit" className="contact-btn">
                            Send Message <FaPaperPlane className="send-icon"/>
                        </button>
                    </form>
                </section>
                {/* FOOTER */}
                <footer className="footer">
                <div className="footer-grid">

                        {/* Company Info */}
                        <div>
                            <h4>Stockflow</h4>
                            <p>
                                Smart cloud-native inventory management platform designed
                                for modern logistics and intelligent automation.
                            </p>

                            <h5 className="follow-title">Follow Us</h5>

                            <div className="social-icons">
                                <a href="#" className="social-icon facebook">
                                    <FaFacebookF/>
                                </a>

                                <a href="#" className="social-icon instagram">
                                    <FaInstagram/>
                                </a>

                                <a href="#" className="social-icon twitter">
                                    <FaTwitter/>
                                </a>

                                <a href="#" className="social-icon linkedin">
                                    <FaLinkedinIn/>
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4>Quick Links</h4>
                            <a href="#" className="footer-link">Inventory Management</a>
                            <a href="#" className="footer-link">Automation</a>
                            <a href="#" className="footer-link">Analytics</a>
                            <a href="#" className="footer-link">Cloud Integration</a>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4>Contact Us</h4>
                            <p>Email: support@stockflow.com</p>
                            <p>Phone: +212 6 00 00 00 00</p>
                            <p>Tangier, Morocco</p>
                        </div>

                        {/* Map */}
                        <div>
                            <h4>Our Location</h4>
                            <div className="map-container">
                                <iframe
                                    src="https://maps.google.com/maps?q=Tangier%20Morocco&t=&z=13&ie=UTF8&iwloc=&output=embed"
                                    title="location map"
                                    loading="lazy"
                                ></iframe>
                            </div>

                            <a
                                href="https://www.google.com/maps?q=Tangier+Morocco"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="directions-btn"
                            >
                                <FaMapMarkerAlt/> Get Directions
                            </a>
                        </div>

                    </div>

                    <div className="footer-bottom">
                        © 2026 Stockflow | All Rights Reserved
                    </div>
                </footer>

            </div>
        </>
    );
};

const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
        section.scrollIntoView({ behavior: "smooth" });
    }
};
export default Home;