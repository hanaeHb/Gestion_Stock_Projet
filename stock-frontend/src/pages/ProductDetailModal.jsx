
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaBox, FaBarcode, FaDollarSign, FaMapMarkerAlt, FaCheckCircle, FaCalendarAlt, FaUser, FaInfoCircle } from "react-icons/fa";
import "./ProductDetailModal.css";

const ProductDetailModal = ({ product, isOpen, onClose }) => {
    if (!isOpen || !product) return null;

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose}>
                <motion.div
                    className="detail-modal-container"
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="detail-modal-header">
                        <h2>Product Details</h2>
                        <button className="close-modal" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>

                    <div className="detail-content">
                        {product.image && (
                            <div className="detail-image-section">
                                <img src={product.image} alt={product.nom} />
                            </div>
                        )}

                        <div className="detail-info-grid">
                            <div className="detail-card">
                                <FaBox className="detail-icon" />
                                <div>
                                    <label>Product Name</label>
                                    <p>{product.nom}</p>
                                </div>
                            </div>

                            <div className="detail-card">
                                <FaBarcode className="detail-icon" />
                                <div>
                                    <label>SKU</label>
                                    <p>{product.sku}</p>
                                </div>
                            </div>

                            <div className="detail-card">
                                <FaDollarSign className="detail-icon" />
                                <div>
                                    <label>Unit Price</label>
                                    <p>{product.prixUnitaire} MAD</p>
                                </div>
                            </div>

                            <div className="detail-card">
                                <FaInfoCircle className="detail-icon" />
                                <div>
                                    <label>Category</label>
                                    <p>{product.category?.nom || product.categorie || "N/A"}</p>
                                </div>
                            </div>

                            <div className="detail-card">
                                <FaCheckCircle className="detail-icon" />
                                <div>
                                    <label>Stock Level</label>
                                    <p>{product.quantiteDisponible ?? 0} units</p>
                                    {product.quantiteDisponible <= (product.seuilCritique || 5) && (
                                        <span className="low-stock-warning">Low Stock Alert!</span>
                                    )}
                                </div>
                            </div>

                            <div className="detail-card full-width">
                                <label>Description</label>
                                <p>{product.description || "No description available"}</p>
                            </div>

                            <div className="detail-card">
                                <label>Critical Threshold</label>
                                <p>{product.seuilCritique || 5} units</p>
                            </div>

                            <div className="detail-card">
                                <label>Status</label>
                                <span className={`status-badge ${product.active ? 'active' : 'inactive'}`}>
                                    {product.active ? "Active" : "Disabled"}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProductDetailModal;