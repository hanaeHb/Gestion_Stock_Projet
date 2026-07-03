module.exports = (role) => {
    return (req, res, next) => {
        if (!req.user.roles || !req.user.roles.includes(role)) {
            return res.status(403).json({ message: "Accès refusé (ROLE)" });
        }
        next();
    };
};
