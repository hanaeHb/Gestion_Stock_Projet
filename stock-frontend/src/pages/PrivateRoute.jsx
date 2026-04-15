import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ role }) => {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" />;

    try {
        const decoded = jwtDecode(token);
        if (!decoded.roles.includes(role)) return <Navigate to="/login" />;

        return <Outlet />; // allow access
    } catch (err) {
        localStorage.removeItem("token");
        return <Navigate to="/login" />;
    }
};

export default PrivateRoute;