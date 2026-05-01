import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUserTie, FaCheckCircle, FaArrowLeft, FaTimes, FaRobot } from "react-icons/fa";
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
                        } else {
                            console.warn("⚠️ AI suggested a supplier ID that doesn't exist in targetFournisseurs");
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

            onSuccess(selectedRequest._id);
            onClose();
            alert(`Request sent to ${selectedFournisseur.prenom}! Waiting for their price.`);

        } catch (err: any) {
            console.error("Kafka Sync Error:", err.response?.data || err.message);
            alert("Erreur lors de l'envoi de la commande.");
        }
    };

    if (!isOpen) return null;

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
                            </div>
                            <button className="btn-prama" onClick={() => setStep(2)}>Continue</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="wizard-step-content">
                            <div className="ai-proof-message">
                                <FaRobot />
                                <p>
                                    Our AI has selected the best supplier for you based on history from the last year
                                    (delivery speed, quality, and price). The best candidate is highlighted below.
                                </p>
                            </div>

                            <h3>Specialist Supplier (AI Selected)</h3>
                            <div className="suppliers-list">
                                {loading ? (
                                    <p>Recherche...</p>
                                ) : (
                                    targetFournisseurs
                                        .sort((a: any, b: any) => {
                                            const scoreA = aiRankings.find(r => Number(r.id_fournisseur) === Number(a.id_fournisseur))?.ai_score || 0;
                                            const scoreB = aiRankings.find(r => Number(r.id_fournisseur) === Number(b.id_fournisseur))?.ai_score || 0;
                                            return scoreB - scoreA;
                                        })
                                        .map((f: any, index: number) => {
                                            const aiMatch = aiRankings.find(rank => Number(rank.id_fournisseur) === Number(f.id_fournisseur));
                                            const isTopPick = index === 0;
                                            return (
                                                <div
                                                    key={f.id_fournisseur}
                                                    className={`supplier-card ${isTopPick ? 'ai-selected-card' : 'other-supplier'}`}
                                                >
                                                    <div className="supplier-main-info">
                                                        <FaUserTie className="user-icon"/>
                                                        <div>
                                                            <p className="supplier-name">{f.prenom} {f.nom}</p>
                                                            <small className="supplier-email">{f.email}</small>
                                                        </div>
                                                    </div>

                                                    {aiMatch && (
                                                        <div className="ai-recommendation">
                                                            <div className="score-tag">
                                                                ⭐ {aiMatch.ai_score}% Reliability
                                                            </div>
                                                            <span>
                                    {aiMatch.recommendation}
                                </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
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
                            <FaCheckCircle size={50} color="#3498db"/>
                            <h3>Request Price Quotation</h3>
                            <p>You are requesting a price
                                from <strong>{selectedFournisseur.prenom} {selectedFournisseur.nom}</strong> for:</p>
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