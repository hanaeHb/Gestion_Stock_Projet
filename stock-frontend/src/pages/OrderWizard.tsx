import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUserTie, FaCheckCircle, FaArrowLeft, FaTimes } from "react-icons/fa";
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

    useEffect(() => {
        const cid = selectedRequest?.categoryId || selectedRequest?.productId;

        console.log("WIZARD CHECK - CID found:", cid);

        if (isOpen && cid) {
            const fetchSuppliers = async () => {
                setLoading(true);
                try {
                    const token = localStorage.getItem("token");
                    const res = await axios.get(
                        `http://localhost:8888/service-fournisseur/api/fournisseurs/category/${cid}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setTargetFournisseurs(res.data);
                } catch (err) {
                    console.error("API ERROR:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchSuppliers();
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
                            <h3>Choose a Specialist Supplier</h3>
                            <div className="suppliers-list">
                                {loading ? <p>Recherche...</p> : targetFournisseurs.map((f: any) => (
                                    <div
                                        key={f.id_fournisseur}
                                        className={`supplier-card ${selectedFournisseur?.id_fournisseur === f.id_fournisseur ? 'selected' : ''}`}
                                        onClick={() => setSelectedFournisseur(f)}
                                    >
                                        <FaUserTie />
                                        <div>
                                            <p>{f.prenom} {f.nom}</p>
                                            <small>{f.email}</small>
                                        </div>
                                    </div>
                                ))}
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
                            <FaCheckCircle size={50} color="#3498db" />
                            <h3>Request Price Quotation</h3>
                            <p>You are requesting a price from <strong>{selectedFournisseur.prenom} {selectedFournisseur.nom}</strong> for:</p>
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