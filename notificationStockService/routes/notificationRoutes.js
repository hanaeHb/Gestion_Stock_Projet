const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");
const authMiddleware = require("../middleware/authMiddleware");
const hasRole = require("../middleware/hasRole");
const Notification = require("../models/Notification");
const { hasAnyRole } = require("../middleware/hasAnyRole");
const logger = require("../logger");
/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications
 */


// Route /pending
router.get("/pending", authMiddleware, hasRole("Procurement Manager", "ADMIN"), async (req, res) => {
    logger.info("[Procurement/ADMIN] Récupération des fournisseurs en attente (PENDING)");
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
        logger.error(`Erreur fetching pending fournisseurs: ${err.message}`);
        res.status(500).json({ message: "Erreur fetching pending fournisseurs", error: err.message });
    }
});
router.get("/stock-alerts", authMiddleware,hasRole("Inventory Manager"), async (req, res) => {
    logger.info("[Inventory Manager] Récupération des alertes de stock critique");
    try {
        const alerts = await Notification.find({
            niveau: "ERROR",
            statut: "NON_LUE",
            fournisseur: { $exists: false }
        }).sort({ dateAlerte: -1 });

        res.json(alerts);
    } catch (err) {
        logger.error(`Erreur fetching stock alerts: ${err.message}`);
        res.status(500).json({ message: "Erreur fetching stock alerts", error: err.message });
    }
});
router.get(
    "/validated",
    authMiddleware,
    hasRole("ADMIN", "Procurement Manager"),
    async (req, res) => {
        logger.info("Récupération des fournisseurs validés");
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
            logger.error(`Erreur fetching validated fournisseurs: ${err.message}`);
            res.status(500).json({
                message: "Erreur fetching validated fournisseurs",
                error: err.message
            });
        }
    }
);

router.put("/:id/mark-as-read", authMiddleware, hasRole("Inventory Manager"), (req, res, next) => {
    logger.info(`Marquer la notification ID: ${req.params.id} comme lue`);
    next();
}, notificationController.markAsRead);

router.put("/:id/mark-awaiting-reception-read", authMiddleware, (req, res, next) => {
    logger.info(`Marquer la notification ID: ${req.params.id} comme lue`);
    next();
}, notificationController.markAwaitingReceptionAsRead);

router.put("/:id/status", authMiddleware, hasRole("Procurement Manager"), (req, res, next) => {
    logger.info(`Mise à jour du statut d'une demande/notif ID: ${req.params.id}`);
    next();
}, notificationController.updateStatus);

router.patch('/:id/confirm-arrival', authMiddleware, hasRole("Procurement Manager"), (req, res, next) => {
    logger.info(`Confirmation d'arrivée de marchandise pour la notif ID: ${req.params.id}`);
    next();
}, notificationController.confirmArrival);

router.post("/create-request", authMiddleware, hasRole("Inventory Manager"), (req, res, next) => {
    logger.info("Création manuelle d'une demande de réapprovisionnement par Inventory Manager");
    next();
}, notificationController.createReplenishmentRequest);

router.get("/replenishment-requests", authMiddleware, hasRole("Procurement Manager"), async (req, res) => {
    logger.info("[Procurement Manager] Consultation des demandes de réapprovisionnement actives");
    try {
        const requests = await Notification.find({
            niveau: "REPLENISHMENT_ORDER",
            statut: "NON_LUE"
        }).sort({ dateAlerte: -1 });

        res.json(requests);
    } catch (err) {
        logger.error(`Erreur fetching replenishment requests: ${err.message}`);
        res.status(500).json({ message: "Erreur fetching requests", error: err.message });
    }
});
router.get(
    "/generate-invoice/:id",
    authMiddleware,
    notificationController.generateInvoicePDF
);
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
router.put("/:id", authMiddleware, notificationController.update);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Supprimer une notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", authMiddleware, notificationController.delete);

module.exports = router;

