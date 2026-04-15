import React from 'react';
import { motion } from 'framer-motion';
import { FaFilePdf, FaQrcode, FaClock } from 'react-icons/fa';

interface ShipmentProps {
    arrivalRange: string;
    qrCode: string;
    invoiceUrl: string;
}

const ShipmentDetails: React.FC<ShipmentProps> = ({ arrivalRange, qrCode, invoiceUrl }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="shipment-info-card"
            style={{
                background: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '12px',
                padding: '15px',
                marginTop: '10px',
                border: '1px solid #e0e0e0'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2d3436', marginBottom: '12px' }}>
                <FaClock style={{ color: '#4facfe' }} />
                <span style={{ fontSize: '0.9rem' }}>Expected Arrival: <strong>{arrivalRange}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                {/* QR Code Section */}
                <div style={{ textAlign: 'center' }}>
                    <img
                        src={qrCode}
                        alt="Invoice QR Code"
                        style={{ width: '100px', height: '100px', borderRadius: '8px', border: '2px solid #eee' }}
                    />
                    <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>
                        <FaQrcode /> Scan for Invoice
                    </p>
                </div>

                {/* PDF Link Section */}
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '8px' }}>
                        You can also download the official invoice manually:
                    </p>
                    <a
                        href={invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-download-invoice"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: '#ff7675',
                            color: 'white',
                            textDecoration: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                        }}
                    >
                        <FaFilePdf /> View PDF Invoice
                    </a>
                </div>
            </div>
        </motion.div>
    );
};

export default ShipmentDetails;