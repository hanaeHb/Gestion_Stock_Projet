// Navbar.jsx
import React, { useState } from 'react';
import './Navbar.css';
import { useNavigate } from "react-router-dom";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    return (
        <nav className="navbar">
            <div className="nav-container">
                    <img src="/favicon.ico" alt="Stockflow Logo" className="loo-image"/>

                <div className={`nav-links ${isOpen ? 'active' : ''}`}>
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#leading">Our Leading</a>
                    <a href="#features">Features</a>
                    <a href="#contact">Contact Us</a>

                    <div className="nav-buttons">
                        <button
                            className="nav-btn nav-btn-secondary"
                            onClick={() => navigate("/login")}
                        >
                            Login
                        </button>
                        <button className="nav-btn nav-btn-primary"
                                onClick={() => navigate("/signin")}
                        >Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;