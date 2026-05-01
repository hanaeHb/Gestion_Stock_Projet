const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");
const authMiddleware = require("../middleware/authMiddleware");
const hasRole = require("../middleware/hasRole");
const Notification = require("../models/notification");
const { hasAnyRole } = require("../middleware/hasAnyRole");
/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications
 */


// Route /pending
router.get("/pending", authMiddleware, hasRole("Procurement Manager", "ADMIN"), async (req, res) => {
    try {
        const notifications = await Notification.find({
            niveau: "INFO",
            statut: "PENDING",
            "fournisseur.userId": { $exists: true }
        })
            .sort({ dateAlerte: -1 })
            .limit(10);

        const pendingFournisseurs = notifications.map(notif => ({
            _id: notif._id,
            dateAlerte: notif.dateAlerte,
            userId: notif.fournisseur.userId,
            firstName: notif.fournisseur.firstName,
            lastName: notif.fournisseur.lastName,
            email: notif.fournisseur.email,
            phone: notif.fournisseur.phone,
            cin: notif.fournisseur.cin,
            role: notif.fournisseur.role,
            message: notif.message,
            cvFile: notif.fournisseur.cvPath
                ? `/uploads/cv/${notif.fournisseur.cvPath.split("\\").pop()}`
                : null
        }));

        res.json(pendingFournisseurs);

    } catch (err) {
        res.status(500).json({ message: "Erreur fetching pending fournisseurs", error: err.message });
    }
});
router.get("/stock-alerts", authMiddleware,hasRole("Inventory Manager"), async (req, res) => {
    try {
        const alerts = await Notification.find({
            niveau: "ERROR",
            statut: "NON_LUE",
            fournisseur: { $exists: false }
        }).sort({ dateAlerte: -1 });

        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: "Erreur fetching stock alerts", error: err.message });
    }
});
router.get(
    "/validated",
    authMiddleware,
    hasRole("ADMIN", "Procurement Manager"),
    async (req, res) => {
        try {

            const notifications = await Notification.find({
                niveau: "INFO",
                statut: "VALIDATED",
                "fournisseur.userId": { $exists: true }
            })
                .sort({ dateAlerte: -1 });

            const validatedFournisseurs = notifications.map(notif => ({
                _id: notif._id,
                dateAlerte: notif.dateAlerte,
                userId: notif.fournisseur.userId,
                firstName: notif.fournisseur.firstName,
                lastName: notif.fournisseur.lastName,
                email: notif.fournisseur.email,
                phone: notif.fournisseur.phone,
                cin: notif.fournisseur.cin,
                role: notif.fournisseur.role,
                message: notif.message,
                cvFile: notif.fournisseur.cvPath
                    ? `/uploads/cv/${notif.fournisseur.cvPath.split("\\").pop()}` // chemin relatif pour le frontend
                    : null
            }));

            res.json(validatedFournisseurs);

        } catch (err) {
            res.status(500).json({
                message: "Erreur fetching validated fournisseurs",
                error: err.message
            });
        }
    }
);

router.put(
    "/:id/mark-as-read",
    authMiddleware,
    hasRole("Inventory Manager"),
    notificationController.markAsRead
);
router.put("/:id/status", authMiddleware, hasRole("Procurement Manager"), notificationController.updateStatus);

router.patch('/:id/confirm-arrival', authMiddleware, hasRole("Procurement Manager"), notificationController.confirmArrival);

router.post(
    "/create-request",
    authMiddleware,
    hasRole("Inventory Manager"),
    notificationController.createReplenishmentRequest
);

router.get("/replenishment-requests", authMiddleware, hasRole("Procurement Manager"), async (req, res) => {
    try {
        const requests = await Notification.find({
            niveau: "REPLENISHMENT_ORDER",
            statut: "NON_LUE"
        }).sort({ dateAlerte: -1 });

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: "Erreur fetching requests", error: err.message });
    }
});
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Récupérer toutes les notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notifications
 */
router.get("/", authMiddleware, notificationController.getAll);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Récupérer une notification par ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", authMiddleware, notificationController.getById);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Créer une nouvelle notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", authMiddleware, hasRole("ADMIN"), notificationController.create);

/**
 * @swagger
 * /api/notifications/{id}:
 *   put:
 *     summary: Mettre à jour une notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", authMiddleware, hasRole("ADMIN"), notificationController.update);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Supprimer une notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", authMiddleware, hasRole("ADMIN"), notificationController.delete);

module.exports = router;

