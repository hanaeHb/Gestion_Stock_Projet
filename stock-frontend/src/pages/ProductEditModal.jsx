// ProductEditModal.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaBox, FaLayerGroup, FaTags, FaDollarSign, FaCheckCircle, FaBarcode, FaMapMarkerAlt, FaTimes, FaCloudUploadAlt, FaTrash } from "react-icons/fa";
import "./ProductEditModal.css";

const ProductEditModal = ({ product, isOpen, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        id: "",
        sku: "",
        nom: "",
        description: "",
        prixUnitaire: 0,
        categoryId: "",
        quantiteDisponible: 0,
        seuilCritique: 5,
        emplacement: "",
        active: true
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (product) {
            setFormData({
                id: product.id || "",
                sku: product.sku || "",
                nom: product.nom || "",
                description: product.description || "",
                prixUnitaire: product.prixUnitaire || 0,
                categoryId: product.category?.id || product.categoryId || "",
                quantiteDisponible: product.quantiteDisponible || 0,
                seuilCritique: product.seuilCritique || 5,
                emplacement: product.emplacement || "",
                active: product.active !== undefined ? product.active : true
            });
            setPreview(product.image || null);
        }
    }, [product]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:8888/produit-stock-service/v1/categories", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(res.data);
            } catch (err) {
                console.error("Error loading categories:", err);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleFile = (e) => {
        if (e.target.files?.[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const updateData = {
                ...formData,
                image: preview
            };

            const response = await axios.put(
                `http://localhost:8888/produit-stock-service/v1/produits/${formData.id}`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.status === 200) {
                onUpdate(response.data);
                onClose();
            }
        } catch (error) {
            console.error("Update failed:", error);
            alert("Error updating product: " + (error.response?.data?.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose}>
                <motion.div
                    className="edit-modal-container"
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h2>Edit Product</h2>
                        <button className="close-modal" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="edit-form">
                        <div className="edit-form-grid">
                            <div className="field-group">
                                <label><FaBarcode /> SKU</label>
                                <input
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <label><FaBox /> Product Name</label>
                                <input
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <label><FaLayerGroup /> Category</label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="field-group">
                                <label><FaDollarSign /> Unit Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="prixUnitaire"
                                    value={formData.prixUnitaire}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <label><FaTags /> Stock Quantity</label>
                                <input
                                    type="number"
                                    name="quantiteDisponible"
                                    value={formData.quantiteDisponible}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <label><FaCheckCircle /> Critical Threshold</label>
                                <input
                                    type="number"
                                    name="seuilCritique"
                                    value={formData.seuilCritique}
                                    onChange={handleChange}
                                    required
                                />
                            </div>


                            <div className="field-group full-width">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                />
                            </div>

                            <div className="field-group full-width">
                                <label>Product Image</label>
                                <div
                                    className="image-upload-zone"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFile}
                                        hidden
                                        accept="image/*"
                                    />
                                    {preview ? (
                                        <div className="image-preview">
                                            <img src={preview} alt="Preview" />
                                            <button
                                                type="button"
                                                className="remove-image"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreview(null);
                                                    setFile(null);
                                                }}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="upload-placeholder">
                                            <FaCloudUploadAlt />
                                            <span>Click to upload image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="field-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="active"
                                        checked={formData.active}
                                        onChange={handleChange}
                                    />
                                    Product Active
                                </label>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-save" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProductEditModal;