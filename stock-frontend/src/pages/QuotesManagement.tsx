import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaTimes, FaChevronDown, FaBoxes, FaEye, FaWallet, FaMoneyBillWave, FaChartLine, FaClock, FaHourglassHalf } from "react-icons/fa";
import axios from "axios";
import "./QuotesManagement.css";

export default function QuotesManagement() {
    const [groupedQuotes, setGroupedQuotes] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

    const [remainingBudget, setRemainingBudget] = useState<number | null>(null);
    const [totalBudget, setTotalBudget] = useState<number | null>(null);
    const [budgetLoading, setBudgetLoading] = useState(true);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [budgetCheckResult, setBudgetCheckResult] = useState<{
        isSufficient: boolean;
        budgetRemaining: number;
        quoteCost: number;
        difference: number;
    } | null>(null);

    const fetchBudget = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get("http://localhost:8888/budgetstock/v1/budgets/current", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTotalBudget(res.data.montantInitial);
            setRemainingBudget(res.data.montantRestant);
        } catch (err) {
            console.error("No active budget found");
            setRemainingBudget(null);
        } finally {
            setBudgetLoading(false);
        }
    };

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

    const checkBudgetForQuote = (quote: any) => {
        if (remainingBudget === null) return null;

        const quoteCost = quote.prix_unitaire * (quote.quantite || 1);
        const isSufficient = quoteCost <= remainingBudget;
        const difference = remainingBudget - quoteCost;

        return {
            isSufficient,
            budgetRemaining: remainingBudget,
            quoteCost: quoteCost,
            difference: difference
        };
    };

    const handleCheckBudget = (quote: any) => {
        const result = checkBudgetForQuote(quote);
        setBudgetCheckResult(result);
        setSelectedQuote(quote);
        setShowBudgetModal(true);
    };

    const handleAcceptFromModal = async () => {
        if (!selectedQuote || !budgetCheckResult?.isSufficient) return;

        try {
            const token = localStorage.getItem("token");

            await axios.patch(`http://localhost:8888/quotation-service/api/quotations/${selectedQuote._id}/status`,
                { status: "ACCEPTED" },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await axios.post(
                `http://localhost:8888/budgetstock/v1/budgets/consume`,
                { amount: budgetCheckResult.quoteCost, quotationId: selectedQuote._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await fetchBudget();
            setShowBudgetModal(false);
            fetchQuotes();
            alert(`✅ Offer accepted! ${budgetCheckResult.quoteCost.toLocaleString()} DH deducted from budget.`);
        } catch (err) {
            console.error("Error accepting offer", err);
            alert("❌ Error accepting offer");
        }
    };

    const handleRefuse = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`http://localhost:8888/quotation-service/api/quotations/${id}/status`,
                { status: "REFUSED" },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchQuotes();
            alert(`✅ Offer refused.`);
        } catch (err) {
            console.error("Error refusing offer", err);
            alert("❌ Error refusing offer");
        }
    };

    useEffect(() => {
        fetchQuotes();
        fetchBudget();
    }, []);

    return (
        <div className="quotes-management-container">
            <header className="page-header-premium">
                <div className="header-content-premium">
                    <h1>Comparison Center</h1>
                    <p>Evaluate supplier offers and optimize your costs.</p>
                </div>
                <div className="header-badge-premium">
                    <span className="live-pulse-dot"></span>
                    RFQ Assets: {Object.keys(groupedQuotes).length} Products
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
                                        <img src={group.productImage} alt={group.productName}
                                             className="product-img-thumb"/>
                                    ) : (
                                        <div className="product-placeholder-icon"><FaBoxes/></div>
                                    )}
                                </div>
                                <div className="p-meta-text">
                                    <h3>{group.productName}</h3>
                                    <span className="sku-pill">ID: {group.productId}</span>
                                </div>
                            </div>

                            <div className="bids-indicator-group">
                                <div className="bids-stats">
        <span className="bids-count-badge">
            {group.offers.length} {group.offers.length === 1 ? 'Offer' : 'Offers'}
        </span>
                                    {/* PENDING INDICATOR - Show if any offer is pending */}
                                    {group.offers.some((offer: any) => offer.status === "PENDING") && (
                                        <span className="pending-count-badge">
                <FaHourglassHalf/>
                                            {group.offers.filter((offer: any) => offer.status === "PENDING").length} Pending
            </span>
                                    )}
                                    {/* ACCEPTED INDICATOR - Optional */}
                                    {group.offers.some((offer: any) => offer.status === "ACCEPTED") && (
                                        <span className="accepted-count-badge">
                <FaCheck/>
                                            {group.offers.filter((offer: any) => offer.status === "ACCEPTED").length} Accepted
            </span>
                                    )}
                                    {/* REFUSED INDICATOR - Optional */}
                                    {group.offers.some((offer: any) => offer.status === "REFUSED") && (
                                        <span className="refused-count-badge">
                <FaTimes/>
                                            {group.offers.filter((offer: any) => offer.status === "REFUSED").length} Refused
            </span>
                                    )}
                                </div>
                                <FaChevronDown className="arrow-rotate-icon"/>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedProduct === group.productId && (
                                <motion.div
                                    initial={{height: 0, opacity: 0}}
                                    animate={{height: "auto", opacity: 1}}
                                    exit={{height: 0, opacity: 0}}
                                    transition={{duration: 0.25, ease: "easeInOut"}}
                                    className="expanded-offers-panel"
                                >
                                    <div className="offers-clean-list">
                                        {group.offers.map((quote: any) => {
                                            const isAcceptable = quote.status === "PENDING" && remainingBudget !== null &&
                                                (quote.prix_unitaire * (quote.quantite || 1)) <= remainingBudget;

                                            // Check if status is PENDING
                                            const isPending = quote.status === "PENDING";

                                            return (
                                                <div key={quote._id}
                                                     className={`premium-offer-row ${quote.status.toLowerCase()}`}>
                                                <div className="supplier-identity">
                                                        <div className="supplier-avatar">{quote.sName.charAt(0)}</div>
                                                        <div>
                                                            <div className="supplier-name-wrapper">
                                                                <h4>{quote.sName}</h4>
                                                                {isPending && (
                                                                    <span className="pending-badge">
                                                                        <FaHourglassHalf /> Pending
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="quote-date">Submitted on {new Date(quote.createdAt || Date.now()).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    <div className="pricing-metrics">
                                                        <div className="unit-price-display">
                                                            {quote.prix_unitaire.toLocaleString()} <small>DH/unit</small>
                                                        </div>
                                                        <div className="total-cost-badge">
                                                            Total: {(quote.prix_unitaire * (quote.quantite || 1)).toLocaleString()} DH
                                                        </div>
                                                    </div>

                                                    <div className="action-trigger-zone">
                                                        {quote.status === "PENDING" ? (
                                                            <div className="buttons-group">
                                                                <button
                                                                    className="btn-action-circle refuse-btn"
                                                                    title="Refuse offer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRefuse(quote._id);
                                                                    }}
                                                                >
                                                                    <FaTimes/>
                                                                </button>

                                                                <button
                                                                    className="btn-check-budget"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCheckBudget(quote);
                                                                    }}
                                                                >
                                                                    <FaEye/> Check Budget
                                                                </button>

                                                                <button
                                                                    className={`btn-action-premium accept-btn ${!isAcceptable ? 'disabled' : ''}`}
                                                                    disabled={true}
                                                                    title="Check budget first"
                                                                >
                                                                    <FaCheck/> Accept
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className={`status-pill ${quote.status.toLowerCase()}`}>
                                                                {quote.status === "ACCEPTED" ? "ACCEPTED" : "REFUSED"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {showBudgetModal && budgetCheckResult && selectedQuote && (
                <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
                    <motion.div
                        className={`budget-modal-compact ${budgetCheckResult.isSufficient ? 'success' : 'danger'}`}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="modal-close-compact" onClick={() => setShowBudgetModal(false)}>&times;</button>

                        <div className="modal-header-compact">
                            <div className={`modal-icon-compact ${budgetCheckResult.isSufficient ? 'success-icon' : 'danger-icon'}`}>
                                {budgetCheckResult.isSufficient ? <FaCheck /> : <FaTimes />}
                            </div>
                            <h3>{budgetCheckResult.isSufficient ? 'Sufficient Budget, Accept Offer' : 'Insufficient Budget, Refuse Offer'}</h3>
                        </div>

                        <div className="modal-body-compact">
                            <div className="supplier-info-compact">
                                <strong>{selectedQuote.sName}</strong>
                                <span>{selectedQuote.pName}</span>
                            </div>

                            <div className="budget-items-compact">
                                <div className="budget-item-compact">
                                    <FaWallet className="item-icon" />
                                    <div>
                                        <span>Remaining budget</span>
                                        <strong className={budgetCheckResult.isSufficient ? 'text-success' : 'text-danger'}>
                                            {budgetCheckResult.budgetRemaining.toLocaleString()} DH
                                        </strong>
                                    </div>
                                </div>

                                <div className="budget-item-compact">
                                    <FaMoneyBillWave className="item-icon" />
                                    <div>
                                        <span>Supplier request</span>
                                        <strong>{budgetCheckResult.quoteCost.toLocaleString()} DH</strong>
                                    </div>
                                </div>

                                <div className={`budget-item-compact diff-item ${budgetCheckResult.isSufficient ? 'diff-success' : 'diff-danger'}`}>
                                    <FaChartLine className="item-icon" />
                                    <div>
                                        <span>Difference</span>
                                        <strong>
                                            {budgetCheckResult.difference >= 0 ? '+' : ''}
                                            {budgetCheckResult.difference.toLocaleString()} DH
                                        </strong>
                                        <small>
                                            {budgetCheckResult.isSufficient ? 'Remains after acceptance' : `Missing ${Math.abs(budgetCheckResult.difference).toLocaleString()} DH`}
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {budgetCheckResult.isSufficient ? (
                                <div className="modal-actions-compact">
                                    <button className="btn-cancel-compact" onClick={() => setShowBudgetModal(false)}>
                                        Cancel
                                    </button>
                                    <button className="btn-accept-compact" onClick={handleAcceptFromModal}>
                                        <FaCheck /> Accept Offer
                                    </button>
                                </div>
                            ) : (
                                <button className="btn-close-compact" onClick={() => setShowBudgetModal(false)}>
                                    Refuse Offer
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}