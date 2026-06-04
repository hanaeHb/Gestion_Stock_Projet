import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaDownload, FaFilePdf, FaCheckCircle, FaBox, FaTag, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';
import "./ApprovedQuotesPage.css";

interface ApprovedQuote {
    _id: string;
    productName: string;
    quantite: number;
    prix_unitaire: number;
    total_ligne: number;
    orderId: string;
    dateAlerte: string;
    sName: string;
    fournisseurId: string;
}

interface ApprovedQuotesPageProps {
    profile: any;
    onBack: () => void;
}

const ApprovedQuotesPage: React.FC<ApprovedQuotesPageProps> = ({ profile, onBack }) => {
    const [approvedQuotes, setApprovedQuotes] = useState<ApprovedQuote[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        fetchApprovedQuotes();
    }, []);

    const fetchApprovedQuotes = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8888/service-notification/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const notifications = res.data.notifications || res.data;

            // Filter approved quotes (QUOTE_FINALIZED) for this supplier
            const approved = notifications.filter((n: any) =>
                n.type === "QUOTE_FINALIZED" &&
                n.niveau === "SUCCESS" &&
                n.fournisseurId?.toString() === profile?.idFournisseur?.toString()
            );

            setApprovedQuotes(approved);
        } catch (err) {
            console.error("Error fetching approved quotes:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async (quote: ApprovedQuote) => {
        setDownloading(quote._id);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `http://localhost:8888/service-notification/api/notifications/generate-invoice/${quote._id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${quote.orderId}_${quote.productName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Error downloading invoice:", err);
            alert("Failed to download invoice. Please try again.");
        } finally {
            setDownloading(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="approved-quotes-page"
        >
            {/* Header with back button */}
            <div className="page-header-approved">
                <button className="btn-back-dashboard" onClick={onBack}>
                    <FaArrowLeft /> Back to Dashboard
                </button>
                <h1>
                    <FaCheckCircle className="header-icon-approved" />
                    Approved Quotations
                </h1>
                <p>All your accepted quotes and invoices</p>
            </div>

            {/* Quotes List */}
            {loading ? (
                <div className="loading-spinner-approved">
                    <div className="spinner"></div>
                    <p>Loading your approved quotes...</p>
                </div>
            ) : approvedQuotes.length === 0 ? (
                <div className="empty-approved">
                    <FaCheckCircle className="empty-icon" />
                    <h3>No approved quotations yet</h3>
                    <p>When your quotes are accepted by the manager, they will appear here.</p>
                    <button className="btn-browse-rfq" onClick={onBack}>
                        Browse RFQs
                    </button>
                </div>
            ) : (
                <div className="approved-quotes-grid">
                    {approvedQuotes.map((quote, index) => (
                        <motion.div
                            key={quote._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="quote-approval-card"
                        >
                            <div className="quote-card-header">
                                <div className="product-icon">
                                    <FaBox />
                                </div>
                                <div className="product-title">
                                    <h3>{quote.productName}</h3>
                                    <span className="order-ref">Order #{quote.orderId?.slice(-8)}</span>
                                </div>
                                <div className="status-approved-badge">
                                    <FaCheckCircle /> APPROVED
                                </div>
                            </div>

                            <div className="quote-card-details">
                                <div className="detail-row">
                                    <div className="detail-item">
                                        <span className="detail-label">Quantity</span>
                                        <span className="detail-value">{quote.quantite} units</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Unit Price</span>
                                        <span className="detail-value">{quote.prix_unitaire || (quote.total_ligne / quote.quantite)} DH</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Total Amount</span>
                                        <span className="detail-value total">{quote.total_ligne} DH</span>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-item">
                                        <span className="detail-label"><FaCalendarAlt /> Date</span>
                                        <span className="detail-value">{new Date(quote.dateAlerte).toLocaleDateString()}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label"><FaTag /> Supplier</span>
                                        <span className="detail-value">{quote.sName || profile?.nom}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="quote-card-footer">
                                <button
                                    className="btn-download-pdf"
                                    onClick={() => handleDownloadInvoice(quote)}
                                    disabled={downloading === quote._id}
                                >
                                    {downloading === quote._id ? (
                                        <>
                                            <span className="spinner-small">⏳</span>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <FaDownload /> Download Invoice (PDF)
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default ApprovedQuotesPage;