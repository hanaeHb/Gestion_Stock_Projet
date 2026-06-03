import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserTie, FaCheck, FaTimes, FaChevronDown, FaBoxes, FaImage } from "react-icons/fa";
import axios from "axios";
import "./QuotesManagement.css";

export default function QuotesManagement() {
    const [groupedQuotes, setGroupedQuotes] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

    const fetchQuotes = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8888/quotation-service/api/quotations", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const grouped = res.data.reduce((acc: any, quote: any) => {
                const key = quote.id_produit;
                if (!acc[key]) {
                    acc[key] = {
                        productName: quote.pName,
                        productId: quote.id_produit,
                        sku: quote.sku || "N/A",
                        categoryId: quote.categoryId,
                        offers: []
                    };
                }
                acc[key].offers.push(quote);
                return acc;
            }, {});

            setGroupedQuotes(grouped);
        } catch (err) {
            console.error("Error fetching quotes", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQuotes(); }, []);

    const handleDecision = async (id: string, decision: "ACCEPTED" | "REFUSED") => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`http://localhost:8888/quotation-service/api/quotations/${id}/status`,
                { status: decision },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Decision applied successfully! ✨`);
            fetchQuotes();
        } catch (err) {
            alert("Error updating status");
        }
    };

    return (
        <div className="quotes-management-container">
            <header className="page-header-premium">
                <div className="header-content-premium">
                    <h1>Comparison Center</h1>
                    <p>Evaluate supplier bids side-by-side and secure premium costs.</p>
                </div>
                <div className="header-badge-premium">
                    <span className="live-pulse-dot"></span>
                    Active RFQs: {Object.keys(groupedQuotes).length} Items
                </div>
            </header>

            <div className="products-premium-stack">
                {Object.values(groupedQuotes).map((group: any) => (
                    <div key={group.productId}
                         className={`premium-product-card ${expandedProduct === group.productId ? 'is-active' : ''}`}>

                        <div className="product-row-summary"
                             onClick={() => setExpandedProduct(expandedProduct === group.productId ? null : group.productId)}>

                            <div className="p-identity-group">
                                <div className="product-avatar-wrapper">
                                    {group.productImage ? (
                                        <img src={group.productImage} alt={group.productName} className="product-img-thumb" />
                                    ) : (
                                        <div className="product-placeholder-icon"><FaBoxes /></div>
                                    )}
                                </div>
                                <div className="p-meta-text">
                                    <h3>{group.productName}</h3>
                                    <span className="sku-pill">ID: {group.productId}</span>
                                    <span className="sku-pill">Category: {group.categoryId}</span>
                                </div>
                            </div>

                            <div className="bids-indicator-group">
                                <span className="bids-count-badge">
                                    {group.offers.length} {group.offers.length === 1 ? 'Bid' : 'Bids'} Available
                                </span>
                                <FaChevronDown className="arrow-rotate-icon"/>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedProduct === group.productId && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="expanded-offers-panel"
                                >
                                    <div className="offers-clean-list">
                                        {group.offers.map((quote: any) => (
                                            <div key={quote._id} className={`premium-offer-row ${quote.status.toLowerCase()}`}>

                                                <div className="supplier-identity">
                                                    <div className="supplier-avatar">{quote.sName.charAt(0)}</div>
                                                    <div>
                                                        <h4>{quote.sName}</h4>
                                                        <span className="quote-date">Submitted on {new Date(quote.createdAt || Date.now()).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                <div className="pricing-metrics">
                                                    <div className="unit-price-display">
                                                        {quote.prix_unitaire} <small>DH/unit</small>
                                                    </div>
                                                    <div className="total-cost-badge">
                                                        Total Line: {quote.prix_unitaire * (quote.quantite || 1)} DH
                                                    </div>
                                                </div>

                                                <div className="action-trigger-zone">
                                                    {quote.status === "PENDING" ? (
                                                        <div className="buttons-group">
                                                            <button className="btn-action-circle refuse-btn" title="Reject Offer"
                                                                    onClick={(e) => { e.stopPropagation(); handleDecision(quote._id, "REFUSED"); }}>
                                                                <FaTimes/>
                                                            </button>
                                                            <button className="btn-action-premium accept-btn"
                                                                    onClick={(e) => { e.stopPropagation(); handleDecision(quote._id, "ACCEPTED"); }}>
                                                                <FaCheck/> Accept
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className={`status-pill ${quote.status.toLowerCase()}`}>
                                                            {quote.status}
                                                        </span>
                                                    )}
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}