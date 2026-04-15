import React from "react";
import "./pendingValidation.css";
import {useNavigate} from "react-router-dom";

export default function PendingValidation() {
    const navigate = useNavigate();
    return (
        <div className="pending-wrapper">
            <div className="pending-card">
                <h1>Thank you for signing up!</h1>
                <p>Your account is under review.</p>
                <p>We will verify your information and send you a confirmation email once it's approved.</p>
                <p className="email">Please check your email for updates.
                    <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer"
                       style={{color: "#4facfe", fontWeight: "700", textDecoration: "underline"}}>
                        Open Gmail
                    </a>
                </p>
                <button onClick={() => navigate("/")}>Back to Home</button>
            </div>
        </div>
    );
}