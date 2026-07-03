const express = require("express");
const router = express.Router();
const controller = require("../Controllers/fournisseurController");
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
 *   name: Fournisseurs
 *   description: Gestion des fournisseurs
 */

/**
 * @swagger
 * /api/fournisseurs:
 *   get:
 *     summary: Récupérer tous les fournisseurs
 *     tags: [Fournisseurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des fournisseurs
 */
router.get("/fournisseurs", authMiddleware, (req, res, next) => {
    logger.info("Récupération de tous les fournisseurs");
    next();
}, controller.getAll);

/**
 * @swagger
 * /fournisseurs/me:
 *   get:
 *     summary: Get my fournisseur profile
 *     description: Retourne le profil du fournisseur connecté ou le crée automatiquement
 *     tags: [Fournisseurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil fournisseur
 */
router.get('/fournisseurs/me', authMiddleware, (req, res, next) => {
    logger.info("Accès au profil fournisseur personnel (/me)");
    next();
}, controller.getMyProfile);

router.put('/fournisseurs/me', authMiddleware, controller.uploadImageMiddleware, (req, res, next) => {
    logger.info("Mise à jour du profil fournisseur personnel");
    next();
}, controller.updateMyProfile);
/**
 * @swagger
 * /api/fournisseurs/{id}:
 *   get:
 *     summary: Récupérer un fournisseur par ID
 *     tags: [Fournisseurs]
 *     security:
 *       - bearerAuth: []
 */
router.get("/fournisseurs/:id", authMiddleware, (req, res, next) => {
    logger.info(`Récupération du fournisseur ID: ${req.params.id}`);
    next();
}, controller.getById);

router.post("/fournisseurs/specializations", authMiddleware, (req, res, next) => {
    logger.info("Mise à jour des spécialisations du fournisseur");
    next();
}, controller.updateSpecializations);

router.get("/fournisseurs/:id/specializations", authMiddleware, (req, res, next) => {
    logger.info(`Récupération des spécialisations pour le fournisseur ID: ${req.params.id}`);
    next();
}, controller.getSpecializations);

router.get("/fournisseurs/category/:categoryId", (req, res, next) => {
    logger.info(`Recherche des fournisseurs pour la catégorie ID: ${req.params.categoryId}`);
    next();
}, controller.getFournisseursByCategory);
/**
 * @swagger
 * /api/fournisseurs:
 *   post:
 *     summary: Créer un nouveau fournisseur
 *     tags: [Fournisseurs]
 *     security:
 *       - bearerAuth: []
 */
router.post("/fournisseurs", authMiddleware, hasRole("ADMIN"), (req, res, next) => {
    logger.info("[ADMIN] Création d'un nouveau fournisseur");
    next();
}, controller.create);

/**
 * @swagger
 * /api/fournisseurs/{id}:
 *   put:
 *     summary: Mettre à jour un fournisseur
 *     tags: [Fournisseurs]
 *     security:
 *       - bearerAuth: []
 */
router.put("/fournisseurs/:id", authMiddleware, hasRole("ADMIN"), (req, res, next) => {
    logger.info(`[ADMIN] Mise à jour du fournisseur ID: ${req.params.id}`);
    next();
}, controller.update);

/**
 * @swagger
 * /api/fournisseurs/{id}:
 *   delete:
 *     summary: Supprimer un fournisseur
 *     tags: [Fournisseurs]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/fournisseurs/:id", authMiddleware, hasRole("ADMIN"), (req, res, next) => {
    logger.info(`[ADMIN] Suppression du fournisseur ID: ${req.params.id}`);
    next();
}, controller.delete);

/**
 * @swagger
 * /api/fournisseurs/{id}/activer:
 *   put:
 *     summary: Activer un fournisseur
 *     tags: [Fournisseurs]
 *     security:
 *       - bearerAuth: []
 */
router.put("/fournisseurs/:id/activer", authMiddleware, hasRole("ADMIN"), (req, res, next) => {
    logger.info(`[ADMIN] Activation du fournisseur ID: ${req.params.id}`);
    next();
}, controller.activer);

/**
 * @swagger
 * /api/fournisseurs/{id}/desactiver:
 *   put:
 *     summary: Désactiver un fournisseur
 *     tags: [Fournisseurs]
 *     security:
 *       - bearerAuth: []
 */
router.put("/fournisseurs/:id/desactiver", authMiddleware, hasRole("ADMIN"), (req, res, next) => {
    logger.info(`[ADMIN] Désactivation du fournisseur ID: ${req.params.id}`);
    next();
}, controller.desactiver);

module.exports = router;