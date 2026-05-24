const express = require('express');
const router = express.Router();
const quotationController = require('../controller/quotationController');
const authMiddleware = require("../middleware/authMiddleware");
const logger = require('../logger');

/**
 * @swagger
 * /api/quotations:
 * post:
 * summary: Create a new quotation
 * tags: [Quotations]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * id_commande: {type: string}
 * id_produit: {type: string}
 * id_supplier: {type: string}
 * quantite: {type: number}
 * prix_unitaire: {type: number}
 * responses:
 * 201:
 * description: Quotation created
 */
router.post('/', authMiddleware, (req, res, next) => {
    logger.info(`Création d'un nouveau devis pour la commande ID: ${req.body.id_commande}`);
    next();
}, quotationController.createQuotation);

/**
 * @swagger
 * /api/quotations/test:
 * get:
 * summary: Test the service
 * responses:
 * 200:
 * description: Service is up
 */

router.get('/stats/:id_supplier', authMiddleware, (req, res, next) => {
    logger.info(`Consultation des statistiques pour le fournisseur ID: ${req.params.id_supplier}`);
    next();
}, quotationController.getSupplierStats);

router.get('/test', (req, res) => res.json({ message: "Quotation Route is working!" }));

router.get('/', authMiddleware, (req, res, next) => {
    logger.info("Récupération de tous les devis (Quotations)");
    next();
}, quotationController.getAllQuotations);

router.post('/refuse', authMiddleware, (req, res, next) => {
    logger.warn(`⚠️ Devis refusé ! Lancement imminent de la recherche d'un fournisseur alternatif (Plan B).`);
    next();
}, quotationController.refuseQuotation);

router.patch('/:id/status', authMiddleware, (req, res, next) => {
    logger.info(`Mise à jour du statut du devis ID: ${req.params.id} -> ${req.body.status || 'Nouveau Statut'}`);
    next();
}, quotationController.updateQuotationStatus);

module.exports = router;