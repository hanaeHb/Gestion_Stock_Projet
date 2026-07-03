const jwt = require("jsonwebtoken");
const { publicKey } = require("../utils/jwt");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token manquant" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, publicKey, {
            algorithms: ["RS256"]
        });

        // populate req.user with fallback values
        req.user = {
            userId: decoded.userId,
            nom: decoded.nom || "",
            prenom: decoded.prenom || "",
            email: decoded.email || "",
            phone: decoded.phone || "",
            cin: decoded.cin || `UNKNOWN-${Date.now()}`
        };

        next();
    } catch (err) {
        return res.status(401).json({ message: "Token invalide" });
    }
};

module.exports = authMiddleware;