const express = require('express');
const router = express.Router();
const quotationController = require('../controller/quotationController');
const authMiddleware = require("../middleware/authMiddleware");

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
router.post('/', authMiddleware, quotationController.createQuotation);

/**
 * @swagger
 * /api/quotations/test:
 * get:
 * summary: Test the service
 * responses:
 * 200:
 * description: Service is up
 */
router.get('/test', (req, res) => res.json({ message: "Quotation Route is working!" }));

router.get('/', authMiddleware, quotationController.getAllQuotations);

router.patch('/:id/status', authMiddleware, quotationController.updateQuotationStatus);

module.exports = router;