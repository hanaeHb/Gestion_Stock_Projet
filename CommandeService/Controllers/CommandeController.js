// controllers/commandeController.js
const db = require("../db");
const { producer } = require('../kafkaConfig');
// Récupérer toutes les commandes
exports.getAllCommandes = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM commandes ORDER BY id_commande ASC");
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Récupérer une commande par ID
exports.getCommandeById = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await db.query("SELECT * FROM commandes WHERE id_commande = $1", [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Commande non trouvée" });
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Créer une nouvelle commande
exports.createCommande = async (req, res) => {
    const { id_fournisseur, total, emailFournisseur, items, id_request, status } = req.body;

    try {
        const result = await db.query(
            "INSERT INTO commandes(id_fournisseur, total, status, id_request) VALUES($1, $2, $3, $4) RETURNING *",
            [id_fournisseur, total, status, id_request]
        );
        const newOrder = result.rows[0];

        const firstItem = items && items[0] ? items[0] : {};
        const pName = firstItem.productName || "Produit";
        const qty = firstItem.quantite || 0;
        const pId = firstItem.id_produit || firstItem.productId;

        await producer.send({
            topic: 'order-notifications',
            messages: [{
                value: JSON.stringify({
                    orderId: newOrder.id_commande,
                    email: emailFournisseur,
                    fournisseurId: id_fournisseur,
                    product: pName,
                    productId: pId,
                    quantity: qty,
                    message: `Procurement Manager requested a price for ${qty} units of ${pName}`
                })
            }]
        });

        res.status(201).json(newOrder);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur" });
    }
};

// controllers/commandeController.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

exports.fournisseurShipOrder = async (req, res) => {
    const { id } = req.params;
    const { arrivalRange, totalPrice, productName, quantity, unitPrice, supplierName } = req.body;

    try {
        const result = await db.query(
            "UPDATE commandes SET status='SHIPPED' WHERE id_commande=$1 RETURNING *",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Commande non trouvée" });
        }

        const invoiceName = `facture_${id}.pdf`;
        const invoiceUrl = `http://localhost:8888/service-commande/invoices/${invoiceName}`;

        const qrCodeDataUrl = await QRCode.toDataURL(invoiceUrl);

        const invoicesDir = path.join(__dirname, '../public/invoices');
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const filePath = path.join(invoicesDir, invoiceName);
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(fs.createWriteStream(filePath));

        doc.fontSize(20).text('INVOICE / FACTURE', { align: 'center', underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Order ID: #${id}`);
        doc.text(`Supplier: ${supplierName}`);
        doc.text(`Product: ${productName}`);
        doc.text(`Quantity: ${quantity}`);
        doc.text(`Unit Price: ${unitPrice} DH`);
        doc.text(`Total Price: ${totalPrice} DH`, { bold: true });
        doc.moveDown();
        doc.text(`ESTIMATED ARRIVAL: ${arrivalRange}`, { color: 'blue' });

        doc.moveDown();
        doc.text('Scan to download digital copy:', { align: 'center' });
        doc.image(qrCodeDataUrl, { fit: [100, 100], align: 'center' });

        doc.end();

        await producer.send({
            topic: 'quotation-updates',
            messages: [{
                value: JSON.stringify({
                    orderId: id,
                    type: "ORDER_SHIPPED",
                    productName: productName,
                    productId: req.body.productId,
                    arrivalRange: arrivalRange,
                    invoiceUrl: invoiceUrl,
                    qrCode: qrCodeDataUrl,
                    total_ligne: totalPrice,
                    quantite: quantity,
                    prix_unitaire: unitPrice,
                    sName: supplierName,
                    message: `🚚 Order of product ${productName} shipped! It will arrive in: ${arrivalRange}.`
                })
            }]
        });

        res.status(200).json({
            message: "Shipped successfully with Invoice & QR Code",
            invoiceUrl: invoiceUrl
        });

    } catch (err) {
        console.error("🔥 ERROR:", err);
        res.status(500).json({ message: "Erreur shipping", error: err.message });
    }
};

exports.confirmReception = async (req, res) => {
    const { id } = req.params;

    try {
        const orderResult = await db.query("SELECT * FROM commandes WHERE id_commande = $1", [id]);
        const linesResult = await db.query("SELECT * FROM ligne_commande WHERE id_commande = $1", [id]);

        if (orderResult.rowCount === 0) return res.status(404).json({ message: "Commande non trouvée" });

        const order = orderResult.rows[0];
        const lines = linesResult.rows;

        await db.query("UPDATE commandes SET status='RECEPTIONNEE' WHERE id_commande=$1", [id]);

        await producer.send({
            topic: 'order-finalized-integration',
            messages: [{
                value: JSON.stringify({
                    orderId: id,
                    totalAmount: order.total,
                    items: lines.map(line => ({
                        productId: line.id_produit,
                        quantity: line.quantite
                    })),
                    timestamp: new Date()
                })
            }]
        });

        res.status(200).json({ message: "Réception confirmée et intégration lancée 🚀" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur confirm reception" });
    }
};
// Valider une commande (changer statut)
exports.validerCommande = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await db.query(
            "UPDATE commandes SET statut='VALIDE' WHERE id_commande=$1 RETURNING *",
            [id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: "Commande non trouvée" });
        res.status(200).json({ message: "Commande validée", commande: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur validation commande" });
    }
};

// Annuler une commande (changer statut)
exports.annulerCommande = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await db.query(
            "UPDATE commandes SET statut='ANNULEE' WHERE id_commande=$1 RETURNING *",
            [id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: "Commande non trouvée" });
        res.status(200).json({ message: "Commande annulée", commande: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur annulation commande" });
    }
};

// Ajouter une ligne de commande
exports.addLigneCommande = async (req, res) => {
    const { id_commande, id_produit, quantite, prix_unitaire } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO ligne_commande(id_commande, id_produit, quantite, prix_unitaire) VALUES($1,$2,$3,$4) RETURNING *",
            [id_commande, id_produit, quantite, prix_unitaire]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur création ligne commande" });
    }
};

// Supprimer une ligne de commande
exports.deleteLigneCommande = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await db.query("DELETE FROM ligne_commande WHERE id_ligne=$1 RETURNING *", [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Ligne non trouvée" });
        res.status(200).json({ message: "Ligne supprimée", ligne: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur suppression ligne" });
    }
};