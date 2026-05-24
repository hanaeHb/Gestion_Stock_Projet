const express = require("express");
const router = express.Router();
const controller = require("../Controllers/CommandeController");
const authMiddleware = require("../middleware/authMiddleware");
const hasRole = require("../middleware/hasRole");
const logger = require("../logger");
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Commandes
 *   description: Gestion des commandes
 */
router.patch("/commandes/:id/ship", authMiddleware, hasRole("Fournisseur"), (req, res, next) => {
    logger.info(`[Fournisseur] Expédition de la commande ID: ${req.params.id}`);
    next();
}, controller.fournisseurShipOrder);

router.post("/commandes/:id/confirm-reception", authMiddleware, (req, res, next) => {
    logger.info(`Confirmation de la réception pour la commande ID: ${req.params.id}`);
    next();
}, controller.confirmReception);

/**
 * @swagger
 * /api/commandes:
 *   get:
 *     summary: Récupérer toutes les commandes
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des commandes
 */
router.get("/commandes", authMiddleware, (req, res, next) => {
    logger.info("Récupération de toutes les commandes");
    next();
}, controller.getAllCommandes);
/**
 * @swagger
 * /api/commandes/{id}:
 *   get:
 *     summary: Récupérer une commande par ID
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.get("/commandes/:id", authMiddleware, (req, res, next) => {
    logger.info(`Récupération de la commande ID: ${req.params.id}`);
    next();
}, controller.getCommandeById);
/**
 * @swagger
 * /api/commandes:
 *   post:
 *     summary: Créer une nouvelle commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.post("/commandes", (req, res, next) => {
    logger.info("Création d'une nouvelle commande");
    next();
}, controller.createCommande);
/**
 * @swagger
 * /api/commandes/{id}/valider:
 *   put:
 *     summary: Valider une commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.put("/commandes/:id/valider", authMiddleware, hasRole("ADMIN"), (req, res, next) => {
    logger.info(`[ADMIN] Validation de la commande ID: ${req.params.id}`);
    next();
}, controller.validerCommande);
/**
 * @swagger
 * /api/commandes/{id}/annuler:
 *   put:
 *     summary: Annuler une commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.put("/commandes/:id/annuler", authMiddleware, hasRole("ADMIN"), (req, res, next) => {
    logger.info(`[ADMIN] Annulation de la commande ID: ${req.params.id}`);
    next();
}, controller.annulerCommande);
/**
 * @swagger
 * /api/ligne-commande:
 *   post:
 *     summary: Ajouter une ligne à une commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.post("/ligne-commande", authMiddleware, (req, res, next) => {
    logger.info("Ajout d'une ligne de commande");
    next();
}, controller.addLigneCommande);
/**
 * @swagger
 * /api/ligne-commande/{id}:
 *   delete:
 *     summary: Supprimer une ligne de commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/ligne-commande/:id", authMiddleware, hasRole("ADMIN"), (req, res, next) => {
    logger.info(`[ADMIN] Suppression de la ligne de commande ID: ${req.params.id}`);
    next();
}, controller.deleteLigneCommande);
module.exports = router;