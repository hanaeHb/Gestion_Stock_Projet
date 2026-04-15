module.exports.hasAnyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user.roles || !req.user.roles.some(r => roles.includes(r))) {
            return res.status(403).json({ message: "Accès refusé (ROLE)" });
        }
        next();
    };
};