import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBoxOpen, FaUserTie, FaCheck, FaTimes, FaChevronDown } from "react-icons/fa";
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
            alert(`Decision sent!`);
            fetchQuotes();
        } catch (err) {
            alert("Error updating status");
        }
    };

    return (
        <div className="quotes-management-container">
            <header className="page-header">
                <div className="header-content">
                    <h1>Comparison Center</h1>
                    <p>Review supplier bids and optimize your procurement.</p>
                </div>
                <div className="header-badge-status">
                    <span className="live-dot"></span>
                    Active Comparisons: {Object.keys(groupedQuotes).length} Products
                </div>
            </header>

            <div className="products-stack">
                {Object.values(groupedQuotes).map((group: any) => (
                    <div key={group.productId}
                         className={`product-comparison-card ${expandedProduct === group.productId ? 'is-open' : ''}`}>
                        <div className="product-main-info"
                             onClick={() => setExpandedProduct(expandedProduct === group.productId ? null : group.productId)}>
                            <div className="p-brand">
                                <FaBoxOpen className="p-icon"/>
                                <div>
                                    <h3>{group.productName}</h3>
                                    <span>SKU: {group.sku}</span>
                                </div>
                            </div>
                            <div className="offers-count">
                                {group.offers.length} Supplier Bids
                                <FaChevronDown className="arrow-icon"/>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedProduct === group.productId && (
                                <motion.div
                                    initial={{height: 0, opacity: 0}}
                                    animate={{height: "auto", opacity: 1}}
                                    exit={{height: 0, opacity: 0}}
                                    className="offers-wrapper-modern"
                                >
                                    <div className="offers-scroll-container">
                                        {group.offers.map((quote: any) => (
                                            <div key={quote._id}
                                                 className={`offer-mini-card ${quote.status.toLowerCase()}`}>
                                                <div className="offer-badge-top">Supplier Bid</div>

                                                <div className="offer-main-content">
                                                    <div className="offer-user">
                                                        <div className="avatar-mini">{quote.sName.charAt(0)}</div>
                                                        <div>
                                                            <h4>{quote.sName}</h4>
                                                            <span>{new Date().toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    <div className="offer-pricing">
                                                        <span className="u-price">{quote.prix_unitaire}
                                                            <small>DH/unit</small></span>
                                                        <div className="total-bubble">
                                                            Total: {quote.total_ligne} DH
                                                        </div>
                                                    </div>

                                                    <div className="offer-actions-modern">
                                                        {quote.status === "PENDING" ? (
                                                            <>
                                                                <button className="btn-icon refuse"
                                                                        onClick={() => handleDecision(quote._id, "REFUSED")}>
                                                                    <FaTimes/>
                                                                </button>
                                                                <button className="btn-select-premium"
                                                                        onClick={() => handleDecision(quote._id, "ACCEPTED")}>
                                                                    <FaCheck/> Accept Offer
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className={`final-status ${quote.status}`}>
                                                                {quote.status}
                                                            </div>
                                                        )}
                                                    </div>
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