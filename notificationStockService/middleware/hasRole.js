// hasRole.js
module.exports = (...roles) => { 
    return (req, res, next) => {
        if (!req.user.roles || !roles.some(r => req.user.roles.includes(r))) {
            return res.status(403).json({ message: "Accès refusé (ROLE)" });
        }
        next();
    };
};
