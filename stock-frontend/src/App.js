import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Signin from "./pages/Signin";
import InventoryManager from "./pages/InventoryManager"
import ProcurementManager from "./pages/ProcurementManager"
import PrivateRoute from "./pages/PrivateRoute";
import Fournisseur from "./pages/fournisseur";
import PendingValidation from "./pages/pending-validation";


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signin" element={<Signin />} />
                <Route path="/pending-validation" element={<PendingValidation />} />
                {/* Protected admin route */}
                <Route element={<PrivateRoute role="ADMIN" />}>
                    <Route path="/admin" element={<Admin />} />
                </Route>

                <Route element={<PrivateRoute role="Procurement Manager" />}>
                    <Route path="/ProcurementManager" element={<ProcurementManager />} />
                </Route>
                <Route element={<PrivateRoute role="Inventory Manager" />}>
                    <Route path="/InventoryManager" element={<InventoryManager />} />
                </Route>
                <Route element={<PrivateRoute role="Fournisseur" />}>
                    <Route path="/fournisseur" element={<Fournisseur />} />
                </Route>
                {/* fallback */}
                <Route path="*" element={<Navigate to="/" />} />

            </Routes>
        </Router>
    );
}

export default App;