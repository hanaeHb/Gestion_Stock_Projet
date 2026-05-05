import React, {useState} from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaBox,
    FaFacebookF, FaChartBar, FaBolt, FaMobileAlt
} from "react-icons/fa";
import axios from "axios";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [userRole, setUserRole] = useState("");
    const handleLogin = async () => {
        try {
            const res = await axios.post("http://localhost:8888/security-stock/v1/users/login", {
                email: email.trim(),
                password: password
            });

            console.log("Response Data:", res.data);
            if (!res.data.accessToken) {
                throw new Error("No access token received");
            }

            const token = res.data.accessToken;
            localStorage.setItem("token", token);
            const decoded = jwtDecode(token);

            console.log("Decoded Token:", decoded);
            const userRoles = decoded.roles || [];
            const role = decoded.roles && decoded.roles.length > 0 ? decoded.roles[0] : "User";
            setUserRole(role);
            setShowSuccess(true);
            if (decoded.roles.includes("ADMIN")) {
                setShowSuccess(true);
                setTimeout(() => navigate("/Admin"), 4000);
            }
            else if (decoded.roles.includes("Procurement Manager")) {
                setShowSuccess(true);
                setTimeout(() => navigate("/ProcurementManager"), 4000);
            }
            else if (decoded.roles.includes("Inventory Manager")) {
                setShowSuccess(true);
                setTimeout(() => navigate("/InventoryManager"), 4000);
            }
            else if (decoded.roles.includes("Fournisseur")) {
                setShowSuccess(true);
                setTimeout(() => navigate("/fournisseur"), 4000);
            }
            else {
                navigate("/userPage");
            }

        }catch (err) {
            console.error("Login Error:", err);
            const errorMessage = err.response?.data?.message || "Invalid Email or Password!";

            setToast({
                show: true,
                message: errorMessage,
                type: "error"
            });

            setTimeout(() => {
                setToast(prev => ({ ...prev, show: false }));
            }, 4000);
        }
    };
    return (
        <div className="container">

            {/* LEFT SIDE */}
            <div className="left">

                <h2 className="title">
                    <span>Welcome</span> BACK
                </h2>

                <p className="form-sub">
                    Manage smarter. Grow faster.</p>
                <p className="form-sum">
                    Access your Go StoCk account to streamline your inventory, gain real-time insights, and make smarter decisions that drive your business forward.
                </p>
                <div className="input-group">
                    <FaEnvelope className="input-icon"/>
                    <input value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           placeholder="Enter your Email..."/>
                </div>

                <div className="input-group">
                    <FaLock className="input-icon"/>
                    <input type="password"
                           placeholder="Enter your password..."
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}/>
                </div>

                <small className="hint">Must be at least 8 characters.</small>

                <button className="login-btn" onClick={handleLogin}>Log in</button>

                <div className="or">OR CONNECT WITH</div>

                <div className="socials">
                    <button className="social-btn">Google</button>
                    <button className="social-btn">Facebook</button>
                </div>

                <p className="Signup-link">
                    Don't have an account? <span  onClick={() => navigate("/signin")}>Sign up</span>
                </p>

            </div>


            {/* RIGHT SIDE */}
            <div className="right">

                <div className="big-circle">

                    <div className="circle-content">

                        <h1>GO StoCk</h1>

                        <p className="circle-text">
                        Dive into Go StoCk and experience the easiest way to manage your inventory, track your stock in real-time, and make smarter decisions that grow your business effortlessly.                        </p>
                        <div className="circle-icons">
                            <FaBox className="icon-feature"/>
                            <FaChartBar className="icon-feature"/>
                            <FaBolt className="icon-feature"/>
                            <FaMobileAlt className="icon-feature"/>
                        </div>
                        <button className="play"  onClick={() => navigate("/")}>▶ Back Home</button>

                    </div>

                </div>

            </div>

            {showSuccess && (
                <div className="custom-toast success-toast">
                    <div className="toast-icon">✓</div>
                    <div className="toast-content">
                        <h4>Success!</h4>
                        <p>Welcome back to Go StoCk.</p>
                        <p>Logging you in as {userRole}...</p>
                    </div>
                    <div className="toast-progress"></div>
                </div>
            )}
            {toast.show && (
                <div className={`custom-toast ${toast.type === "success" ? "success-toast" : "error-toast"}`}>
                    <div className="toast-icon">
                        {toast.type === "success" ? "✓" : "✕"}
                    </div>
                    <div className="toast-content">
                        <h4>{toast.type === "success" ? "Success!" : "Login Failed"}</h4>
                        <p>{toast.message}</p>
                    </div>
                    <div className="toast-progress"></div>
                </div>
            )}
        </div>

    );
}