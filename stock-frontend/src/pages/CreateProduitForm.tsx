import React, {useState, useRef, useEffect} from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaCloudUploadAlt, FaBox, FaLayerGroup, FaTags, FaDollarSign, FaTrash, FaCheckCircle, FaBarcode, FaMapMarkerAlt } from "react-icons/fa";
import "./CreateProduitForm.css";

const CreateProductForm: React.FC = () => {
    const [formData, setFormData] = useState({
        sku: "",
        nom: "",
        description: "",
        prixUnitaire: 0,
        categoryId: "",
        quantiteInitiale: 0,
        seuilCritique: 5,
        emplacement: ""
    });

    const [categories, setCategories] = useState<any[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchCats = async () => {
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
        fetchCats();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Data to be sent:", { ...formData, image: preview });
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            const response = await axios.post("http://localhost:8888/produit-stock-service/v1/produits/create",
                {
                    ...formData,
                    image: preview
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.status === 201) {
                setSuccess(true);
                setFormData({
                    sku: "", nom: "", description: "", prixUnitaire: 0,
                    categoryId: "", quantiteInitiale: 0, seuilCritique: 5, emplacement: ""
                });
                setPreview(null);

            }
        } catch (error: any) {
            console.error("Deployment failed:", error.response?.data || error.message);

            if (error.response?.status === 403) {
                alert("(Permission Denied)!");
            } else {
                alert("Erreur lors du déploiement: " + (error.response?.data?.message || "Check l-Backend"));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modern-form-container">
            <motion.div
                className="form-card-premium"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="form-sidebar-accent">
                    <div className="status-indicator">
                        <div className="dot pulse"></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="premium-layout">
                    <header className="form-header-minimal">
                        <motion.h2
                            initial={{ x: -20 }}
                            animate={{ x: 0 }}
                        >
                            Asset Deployment Console
                        </motion.h2>
                        <p>Global Inventory Synchronization Engine v2.0</p>
                    </header>

                    <div className="upload-master-container">
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`drop-zone-premium ${preview ? 'has-preview' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFile} hidden accept="image/*" />

                            {!preview ? (
                                <div className="upload-placeholder">
                                    <div className="icon-circle shadow-glow"><FaCloudUploadAlt /></div>
                                    <div className="text-content">
                                        <span className="main-text">Upload Product Blueprint</span>
                                        <span className="sub-text">Visual identification asset (High-Res)</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="image-preview-wrapper">
                                    <img src={preview} alt="Preview" className="img-preview-glass" />
                                    <button className="remove-asset" onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}>
                                        <FaTrash />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* --- Input Grid --- */}
                    <div className="input-grid-premium">
                        <div className="field-box">
                            <label><FaBarcode/> SKU (Unique Identifier)</label>
                            <input name="sku" type="text" placeholder="e.g. SRV-X100-MAR" onChange={handleChange}
                                   required/>
                        </div>

                        <div className="field-box">
                            <label><FaBox/> Designation</label>
                            <input name="nom" type="text" placeholder="Product Name" onChange={handleChange} required/>
                        </div>

                        <div className="field-box">
                            <label><FaLayerGroup/> Category</label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Domain</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="field-box">
                            <label><FaDollarSign/> Unit Price (MAD)</label>
                            <input name="prixUnitaire" type="number" step="0.01" placeholder="0.00"
                                   onChange={handleChange} required/>
                        </div>

                        <div className="field-box">
                            <label><FaTags/> Initial Quantity</label>
                            <input name="quantiteInitiale" type="number" placeholder="In-stock units"
                                   onChange={handleChange} required/>
                        </div>

                        <div className="field-box">
                            <label><FaCheckCircle/> Safety Stock (Seuil)</label>
                            <input name="seuilCritique" type="number" placeholder="Alert threshold"
                                   onChange={handleChange} required/>
                        </div>

                        <div className="field-box full-width">
                            <label><FaMapMarkerAlt/> Warehouse Location (Emplacement)</label>
                            <input name="emplacement" type="text" placeholder="e.g. Zone A / Shelf 4"
                                   onChange={handleChange} required/>
                        </div>

                        <div className="field-box full-width">
                            <label>Technical Specifications</label>
                            <textarea name="description" placeholder="Product details..." rows={3}
                                      onChange={handleChange}></textarea>
                        </div>
                    </div>

                    <div className="action-footer">
                        <div className="ai-status">
                            <AnimatePresence>
                                {success && (
                                    <motion.span
                                        initial={{opacity: 0, x: -10}}
                                        animate={{opacity: 1, x: 0}}
                                        className="success-msg"
                                    >
                                    <FaCheckCircle /> Saved
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                        <button type="submit" className={`btn-deploy-pro ${loading ? 'loading' : ''}`} disabled={loading}>
                            {loading ? "COMMUNICATING..." : "INITIATE DEPLOYMENT"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateProductForm;