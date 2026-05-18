import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUserTie, FaCheckCircle, FaTimes, FaRobot, FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";
import "./OrderWizard.css";

interface OrderWizardProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRequest: any;
    onSuccess: (requestId: string) => void;
}

const OrderWizard: React.FC<OrderWizardProps> = ({ isOpen, onClose, selectedRequest, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [targetFournisseurs, setTargetFournisseurs] = useState([]);
    const [selectedFournisseur, setSelectedFournisseur] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [aiRankings, setAiRankings] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedFournisseur(null);
            setTargetFournisseurs([]);
        }
        const cid = selectedRequest?.categoryId || selectedRequest?.productId;

        console.log("WIZARD CHECK - CID found:", cid);

        if (isOpen && cid) {
            const fetchData = async () => {
                setLoading(true);
                const token = localStorage.getItem("token");
                try {
                    const resSuppliers = await axios.get(
                        `http://localhost:8888/service-fournisseur/api/fournisseurs/category/${cid}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setTargetFournisseurs(resSuppliers.data);

                    const resAi = await axios.get(
                        `http://localhost:8888/prediction-service/prediction/predict-best-supplier/${cid}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setAiRankings(resAi.data);

                    if (resAi.data && resAi.data.length > 0 && resSuppliers.data) {
                        const topPickFromAi = resAi.data[0];
                        const actualSupplier = resSuppliers.data.find((f: any) =>
                            Number(f.id_fournisseur) === Number(topPickFromAi.id_fournisseur)
                        );

                        if (actualSupplier) {
                            setSelectedFournisseur(actualSupplier);
                            console.log("✅ AI Selection Successful:", actualSupplier.prenom);
                        }
                    }

                } catch (err) {
                    console.error("Error fetching wizard data:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, selectedRequest]);

    const submitToKafka = async () => {
        try {
            const token = localStorage.getItem("token");

            const orderData = {
                id_fournisseur: selectedFournisseur.id_fournisseur,
                emailFournisseur: selectedFournisseur.email,
                id_request: selectedRequest._id,
                items: [{
                    id_produit: selectedRequest.productId,
                    productName: selectedRequest.productName,
                    categoryId: selectedRequest.categoryId,
                    quantite: selectedRequest.requestedQty,
                    prix_unitaire: null
                }],
                total: 0,
                status: 'WAITING_FOR_QUOTATION',
                dateCommande: new Date().toISOString()
            };

            await axios.post("http://localhost:8888/service-commande/api/commandes", orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await axios.put(
                `http://localhost:8888/service-notification/api/notifications/${selectedRequest._id}`,
                {
                    statut: "LUE",
                    niveau: "PROCESSED_REPLENISHMENT",
                    type: selectedRequest.type
                }, // 👈 هادا البارامتر الثاني (الـ Data) يسالي هنا
                {
                    headers: { Authorization: `Bearer ${token}` }
                }  // 👈 هادا البارامتر الثالث (الـ Config) بوحدو معزول
            );

            console.log("✅ MongoDB Notification synced and set to LUE successfully.");

            console.log("✅ MongoDB Notification synced and set to LUE successfully.");
            onSuccess(selectedRequest._id);
            onClose();
            alert(`Primary request routed to ${selectedFournisseur.prenom}! Fallback pipeline armed. 🔥`);

        } catch (err: any) {
            console.error("Kafka Sync Error:", err.response?.data || err.message);
            alert("Erreur lors de l'envoi de la commande.");
        }
    };

    if (!isOpen) return null;


    const sortedSuppliers = [...targetFournisseurs].sort((a: any, b: any) => {
        const scoreA = aiRankings.find(r => Number(r.id_fournisseur) === Number(a.id_fournisseur))?.ai_score || 0;
        const scoreB = aiRankings.find(r => Number(r.id_fournisseur) === Number(b.id_fournisseur))?.ai_score || 0;
        return scoreB - scoreA;
    });

    return (
        <div className="wizard-overlay">
            <div className="wizard-modal">
                <button className="close-btn" onClick={onClose}><FaTimes /></button>

                {/* Progress Bar */}
                <div className="wizard-steps-nav">
                    <span className={step >= 1 ? "active" : ""}>Details</span>
                    <span className={step >= 2 ? "active" : ""}>Supplier</span>
                    <span className={step >= 3 ? "active" : ""}>Confirmation</span>
                </div>

                <div className="wizard-body">
                    {step === 1 && (
                        <div className="wizard-step-content">
                            <h3>Needs assessment</h3>
                            <div className="info-box">
                                <p><strong>ProductId:</strong> {selectedRequest.productId}</p>
                                <p><strong>Product:</strong> {selectedRequest.productName}</p>
                                <p><strong>Quantity:</strong> {selectedRequest.requestedQty} units</p>
                                <p><strong>Category:</strong> {selectedRequest.categoryId} </p>
                            </div>
                            <button className="btn-prama" onClick={() => setStep(2)}>Continue</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="wizard-step-content">
                            <div className="ai-proof-message">
                                <FaRobot />
                                <p>
                                    Our AI has structured an automated routing pipeline based on historical reliability. If the primary supplier rejects, the system rolls over instantly.
                                </p>
                            </div>

                            <h3>Smart Routing Pipeline</h3>
                            <div className="suppliers-list">
                                {loading ? (
                                    <p className="loading-text">Analyzing database...</p>
                                ) : (
                                    sortedSuppliers.map((f: any, index: number) => {
                                        const aiMatch = aiRankings.find(rank => Number(rank.id_fournisseur) === Number(f.id_fournisseur));
                                        const isPrimary = index === 0;
                                        const isBackup = index === 1;

                                        return (
                                            <div
                                                key={f.id_fournisseur}
                                                className={`supplier-card-v2 ${isPrimary ? 'primary-route-card' : isBackup ? 'backup-route-card' : 'hidden-route-card'}`}
                                            >
                                                <div className="supplier-main-info">
                                                    <div className="icon-wrapper">
                                                        <FaUserTie className="user-icon"/>
                                                        <span className="route-index-dot">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="supplier-name">{f.prenom} {f.nom}</p>
                                                        <small className="supplier-email">{f.email}</small>
                                                    </div>
                                                </div>

                                                <div className="ai-recommendation-block">
                                                    {isPrimary && (
                                                        <span className="pipeline-badge primary-badge">🎯 Primary Target</span>
                                                    )}
                                                    {isBackup && (
                                                        <span className="pipeline-badge backup-badge">🛡️ Fallback Plan B</span>
                                                    )}

                                                    {aiMatch && (
                                                        <div className="score-tag-v2">
                                                            ⭐ {aiMatch.ai_score}%
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {/* Fallback warning text if there's no backup supplier found */}
                                {!loading && sortedSuppliers.length <= 1 && (
                                    <div className="fallback-warning-message">
                                        <FaExclamationTriangle />
                                        <p><strong>No Fallback Available:</strong> There are no alternative suppliers registered in this category. In case of refusal, manual sourcing will be required.</p>
                                    </div>
                                )}
                            </div>

                            <div className="actions">
                                <button onClick={() => setStep(1)}>Back</button>
                                <button
                                    className="btn-prama"
                                    disabled={!selectedFournisseur}
                                    onClick={() => setStep(3)}
                                >
                                    Following
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="wizard-step-content final-step">
                            <FaCheckCircle size={50} color="#730d19"/>
                            <h3>Request Price Quotation</h3>
                            <p>You are requesting a price from <strong>{selectedFournisseur?.prenom} {selectedFournisseur?.nom}</strong> for:</p>
                            <div className="summary-box">
                                <p>{selectedRequest.requestedQty}x {selectedRequest.productName} </p>
                            </div>
                            <button className="btn-confirm" onClick={submitToKafka}>Send Request</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderWizard;