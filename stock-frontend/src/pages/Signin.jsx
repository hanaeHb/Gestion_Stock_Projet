
import React, { useState } from "react";
import axios from "axios";
import "./signin.css";
import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaPhone,
    FaIdCard
} from "react-icons/fa";
import {useNavigate} from "react-router-dom";

export default function SignIn() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName:"",
        email: "",
        phone: "",
        cin: "",
        password: "",
        cv : ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showToast, setShowToast] = useState({ show: false, message: "", type: "" });
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setShowToast({ show: false, message: "", type: "" });
        if (!formData.firstName || !formData.lastName || !formData.email ||
            !formData.phone || !formData.cin || !formData.password || !formData.cv) {

            setShowToast({
                show: true,
                message: "Please fill in all the required fields!",
                type: "error"
            });
            setLoading(false);
            setTimeout(() => setShowToast(prev => ({ ...prev, show: false })), 4000);
            return;

        }

        try {
            const data = new FormData();
            data.append("firstName", formData.firstName);
            data.append("lastName", formData.lastName);
            data.append("email", formData.email);
            data.append("phone", formData.phone);
            data.append("password", formData.password);
            data.append("cin", formData.cin);
            data.append("role", "Fournisseur");
            if (formData.cv) {
                data.append("cv", formData.cv); // <-- juste CV
            }

            const res = await axios.post(
                "http://localhost:8888/security-stock/v1/users/register",
                data,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            console.log("Fournisseur registered:", res.data);

            if (res.data.accessToken) {
                localStorage.setItem("token", res.data.accessToken);
                localStorage.setItem("role", "Fournisseur");
            }

            setShowToast({
                show: true,
                message: `Welcome ${formData.firstName}! Registration successful.`,
                type: "success"
            });

            setLoading(false);
            setTimeout(() => {
                navigate("/pending-validation");
            }, 4000);

        } catch (err) {
        console.error("Error detected:", err.response);

        const errorMessage = err.response?.data?.message || "Something went wrong";

        setShowToast({
            show: true,
            message: errorMessage,
            type: "error"
        });

        setLoading(false);
        setTimeout(() => {
            setShowToast(prev => ({ ...prev, show: false }));
        }, 4000);
        }
    };
    return (
        <div className="signin-wrapper">
            <div className="signin-card">
                {/* LEFT PANEL */}
                <div className="left-panel">
                    <div className="left-content">
                        <h1>
                            Get Started<br/>with Us
                        </h1>
                        <p className="subtitle">
                            Let’s make Go StoCk fun! Just follow these steps to create your account.
                        </p>

                        <div className="steps">
                            <div className="step active">
                                <div className="circle">1</div>
                                <span>Sign up your </span>
                                <span>account</span>
                            </div>

                            <div className="step">
                                <div className="circle">2</div>
                                <span>Set up your</span>
                                <span>profile</span>
                            </div>
                        </div>
                    </div>
                    <button className="play" onClick={() => navigate("/")}>
                        ◀ Back Home
                    </button>
                </div>

                {/* RIGHT PANEL */}
                <div className="right-panel">
                    <div className="form-box">
                        <h2>JOIN <span>GO StoCk</span></h2>

                        <p className="form-sub">
                            Manage smarter. Grow faster.</p>
                        <p className="form-sum">
                            Sign in to GO StoCk and transform the way you handle your inventory.
                        </p>
                        <div className="input-group">
                            <FaEnvelope className="input-icon"/>
                            <input
                                placeholder="Email..."
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <FaLock className="input-icon"/>
                            <input
                                type="password"
                                placeholder="Password..."
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="row">
                            <div className="input-group">
                                <FaUser className="input-icon"/>
                                <input placeholder="FirstName..."
                                       name="firstName"
                                       value={formData.firstName}
                                       onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <FaUser className="input-icon"/>
                                <input placeholder="LastName..."
                                       name="lastName"
                                       value={formData.lastName}
                                       onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <FaPhone className="input-icon"/>
                                <input placeholder="Phone..."
                                       name="phone"
                                       value={formData.phone}
                                       onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <FaIdCard className="input-icon"/>
                                <input placeholder="Cin..."
                                       name="cin"
                                       value={formData.cin}
                                       onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="upload-box">
                            <label className="upload-label">
                                <input
                                    type="file"
                                    name="cv"
                                    onChange={(e) =>
                                        setFormData({...formData, cv: e.target.files[0]})
                                    }
                                />

                                <div className="upload-content">
                                    <span className="upload-icon">📄</span>

                                    <p>
                                        {formData.cv
                                            ? formData.cv.name
                                            : "Upload your CV"}
                                    </p>

                                    <small>PDF, DOCX — Max 5MB</small>
                                </div>
                            </label>
                        </div>


                        <button className="signup-btn" onClick={handleSubmit} disabled={loading}>
                            {loading ? "Signing Up..." : "Sign Up"}
                        </button>

                        <div className="or">OR SIGN UP WITH</div>

                        <div className="socials">
                            <button className="social-btn">Google</button>
                            <button className="social-btn">Facebook</button>
                        </div>

                        <p className="login-link">
                            Already have an account? <span onClick={() => navigate("/login")}>Log in</span>
                        </p>
                    </div>
                </div>
            </div>
            {showToast.show && (
                <div className={`custom-toast ${showToast.type === "success" ? "success-toast" : "error-toast"}`}>
                    <div className="toast-icon">{showToast.type === "success" ? "✓" : "✕"}</div>
                    <div className="toast-content">
                        <h4>{showToast.type === "success" ? "Success!" : "Registration Failed"}</h4>
                        <p>{showToast.message}</p>
                    </div>
                    <div className="toast-progress"></div>
                </div>
            )}
        </div>
    );
}

