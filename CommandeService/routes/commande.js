const express = require("express");
const router = express.Router();
const controller = require("../controllers/commandeController");
const authMiddleware = require("../middleware/authMiddleware");
const hasRole = require("../middleware/hasRole");

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
router.patch("/commandes/:id/ship", authMiddleware, hasRole("Fournisseur"), controller.fournisseurShipOrder);

router.post("/commandes/:id/confirm-reception", authMiddleware, controller.confirmReception);
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
router.get("/commandes", authMiddleware, controller.getAllCommandes);

/**
 * @swagger
 * /api/commandes/{id}:
 *   get:
 *     summary: Récupérer une commande par ID
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.get("/commandes/:id", authMiddleware, controller.getCommandeById);

/**
 * @swagger
 * /api/commandes:
 *   post:
 *     summary: Créer une nouvelle commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.post("/commandes", authMiddleware, controller.createCommande);

/**
 * @swagger
 * /api/commandes/{id}/valider:
 *   put:
 *     summary: Valider une commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.put("/commandes/:id/valider", authMiddleware, hasRole("ADMIN"), controller.validerCommande);

/**
 * @swagger
 * /api/commandes/{id}/annuler:
 *   put:
 *     summary: Annuler une commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.put("/commandes/:id/annuler", authMiddleware, hasRole("ADMIN"), controller.annulerCommande);

/**
 * @swagger
 * /api/ligne-commande:
 *   post:
 *     summary: Ajouter une ligne à une commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.post("/ligne-commande", authMiddleware, controller.addLigneCommande);

/**
 * @swagger
 * /api/ligne-commande/{id}:
 *   delete:
 *     summary: Supprimer une ligne de commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/ligne-commande/:id", authMiddleware, hasRole("ADMIN"), controller.deleteLigneCommande);

module.exports = router;