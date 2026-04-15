const Notification = require("../models/Notification");
const notificationModel = require("../models/notificationModel");
const emailService = require("../Service/emailService");

exports.getAll = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ dateAlerte: -1 });
        res.json({ requestedBy: req.user?.email, notifications });
    } catch (error) {
        res.status(500).json({ message: "Erreur fetching notifications", error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: "Erreur fetching notification", error: error.message });
    }
};
// PUT /api/notifications/:id/status
exports.updateStatus = async (req, res) => {
    try {
        const status = req.body.status || req.query.status; // body aw query
        if (!status) return res.status(400).json({ message: "Status is required" });

        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });

        notification.statut = status.toUpperCase();
        await notification.save();

        // ===============================
        // Send email to fournisseur
        // ===============================
        const email = notification.fournisseur?.email;
        if (email) {
            const subject = status === "validated" ? "Compte validé" : "Compte refusé";
            let body = "";
            if (status === "validated") {
                body = `Votre compte fournisseur a été validé. Connectez-vous ici: http://localhost:3000/login`;
            } else {
                body = `Votre compte fournisseur a été refusé. Pour plus d'informations, contactez l'administrateur.`;
            }

            await emailService.sendEmail(email, subject, body);
        }

        res.json({ message: `Notification ${status} updated and email sent`, notification });
    } catch (error) {
        console.error("Erreur updating notification status:", error);
        res.status(500).json({ message: "Erreur updating notification status", error: error.message });
    }
};
exports.confirmArrival = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notification.type = "CONFIRMED";
        await notification.save();

        res.json({
            message: "Shipment confirmed successfully",
            notification
        });
    } catch (error) {
        res.status(500).json({
            message: "Error confirming arrival",
            error: error.message
        });
    }
};
exports.create = async (req, res) => {
    try {
        const alerte = new notificationModel({
            message: req.body.message,
            niveau: req.body.niveau
        });

        const notifData = alerte.envoyerNotification();

        const notification = new Notification({
            message: notifData.message,
            niveau: notifData.niveau,
            dateAlerte: notifData.date
        });

        await notification.save();

        res.status(201).json({ message: "Notification créée", notification });
    } catch (error) {
        res.status(500).json({ message: "Erreur création notification", error: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { statut: "LUE" },
            { new: true }
        );

        if (!notification) return res.status(404).json({ message: "Notification not found" });
        res.json({ message: "Notification marked as read", notification });
    } catch (error) {
        res.status(500).json({ message: "Erreur update notification", error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { message, niveau } = req.body;
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });

        if (message) notification.message = message;
        if (niveau) notification.niveau = niveau;
        if (type) notification.type = type;
        if (statut) notification.statut = statut;

        await notification.save();
        res.json({ message: "Notification mise à jour", notification });
    } catch (error) {
        res.status(500).json({ message: "Erreur update notification", error: error.message });
    }
};

exports.createReplenishmentRequest = async (req, res) => {
    try {
        const { productId, productName, requestedQty, fromManager } = req.body;

        const notification = new Notification({
            message: `Demande de réapprovisionnement: ${productName} (Qty: ${requestedQty})`,
            productName,
            productId,
            requestedQty,
            fromManager,
            niveau: "REPLENISHMENT_ORDER", 
            statut: "NON_LUE",
            dateAlerte: new Date()
        });

        await notification.save();
        res.status(201).json({ message: "Demande de réapprovisionnement envoyée ✅", notification });
    } catch (error) {
        res.status(500).json({ message: "Erreur creation request", error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });
        res.json({ message: "Notification deleted" });
    } catch (error) {
        res.status(500).json({ message: "Erreur suppression notification", error: error.message });
    }
};