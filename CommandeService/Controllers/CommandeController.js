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

exports.createCommande = async (req, res) => {
    const { id_fournisseur, fournisseur_name, total, emailFournisseur, items, id_request, status, categoryId } = req.body;

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

        const finalCategoryId = categoryId || firstItem.categoryId || firstItem.id_category;

        console.log(`🚀 Dispatching Order Event to Kafka with Category ID: ${finalCategoryId}`);

        await producer.send({
            topic: 'order-notifications',
            messages: [{
                value: JSON.stringify({
                    orderId: newOrder.id_commande,
                    email: emailFournisseur,
                    fournisseur: fournisseur_name,
                    fournisseurId: id_fournisseur,
                    product: pName,
                    productId: pId,
                    categoryId: finalCategoryId,
                    quantity: qty,
                    message: `Procurement Manager requested a price quote for ${qty} units of ${pName} from ${emailFournisseur}`
                })
            }]
        });

        res.status(201).json(newOrder);
    } catch (err) {
        console.error("❌ Error in createCommande database/event mapping pipeline:", err);
        res.status(500).json({ message: "Erreur internal engine propagation" });
    }
};
// controllers/commandeController.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const os = require('os');
const axios = require('axios');

const getLocalIpAddress = () => {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wlan') || name.toLowerCase().includes('sans fil')) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log(`🎯 [SUCCESS] Wi-Fi IP Detected: ${iface.address}`);
                    return iface.address;
                }
            }
        }
    }

    for (const name of Object.keys(interfaces)) {
        if (name.toLowerCase().includes('virtual') || name.toLowerCase().includes('vbox') || name.toLowerCase().includes('wsl')) {
            continue;
        }
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`⚠️ Alternative IP Detected: ${iface.address}`);
                return iface.address;
            }
        }
    }

    console.log(`🚨 Using Manual Backup IP`);
    return '192.168.195.130';
};

exports.fournisseurShipOrder = async (req, res) => {
    const { id } = req.params;
    const { arrivalRange, totalPrice, productName, quantity, unitPrice, supplierName, productId } = req.body;

    try {
        const result = await db.query(
            "UPDATE commandes SET status='SHIPPED' WHERE id_commande=$1 RETURNING *",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Commande non trouvée" });
        }

        let productDetails = { sku: "N/A", nom: productName, description: "Premium Product", category: null, categorie: null, image: null };
        try {
            const token = req.headers.authorization;
            const response = await axios.get(`http://localhost:8888/produit-stock-service/v1/produits/${productId}`, {
                headers: { Authorization: token }
            });
            if (response.data) {
                productDetails = response.data;
            }
        } catch (apiErr) {
            console.error("⚠️ Extraction Spring Boot failed, backup loaded:", apiErr.message);
        }

        const invoiceName = `facture_${id}.pdf`;
        const invoiceUrl = `http://localhost:8888/service-commande/invoices/${invoiceName}`;

        const localIp = getLocalIpAddress();
        const qrCodeNetworkUrl = `http://${localIp}:8888/service-commande/invoices/${invoiceName}`;

        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeNetworkUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            color: { dark: '#730d19', light: '#ffffff' }
        });

        const invoicesDir = path.join(__dirname, '../public/invoices');
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const filePath = path.join(invoicesDir, invoiceName);
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        doc.pipe(fs.createWriteStream(filePath));

        const PRIMARY_COLOR = '#730d19';
        const ACCENT_PINK = '#ff9a9e';
        const BG_WARM = '#f1e9d2';
        const BG_LIGHT_PINK = '#fff5f6';
        const TEXT_DARK = '#1e1b1b';
        const TEXT_MUTED = '#64748b';

        const today = new Date();
        const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

        doc.rect(0, 0, doc.page.width, 120).fill(PRIMARY_COLOR);

        doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('INVOICE / FACTURE', 40, 45);
        doc.fontSize(10).font('Helvetica')
            .text(`Invoice Date: ${formattedDate}`, doc.page.width - 200, 45, { align: 'right' })
            .text(`Order ID: #${id}`, doc.page.width - 200, 60, { align: 'right' });

        let startY = 145;
        doc.rect(40, startY, 4, 45).fill(PRIMARY_COLOR);

        doc.fillColor(TEXT_DARK);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('ISSUED BY (SUPPLIER):', 52, startY);
        doc.fontSize(10).font('Helvetica').fillColor(TEXT_DARK).text(supplierName, 52, startY + 18);

        doc.fontSize(11).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('SHIPPING DETAILS:', doc.page.width - 240, startY);
        doc.fontSize(10).font('Helvetica').fillColor(TEXT_DARK)
            .text(`Status: SHIPPED`, doc.page.width - 240, startY + 18)
            .font('Helvetica-Bold').fillColor(PRIMARY_COLOR)
            .text(`Expected Arrival: ${arrivalRange}`, doc.page.width - 240, startY + 32);

        let tableTop = 235;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('white');

        doc.rect(40, tableTop, doc.page.width - 80, 25).fill(PRIMARY_COLOR);
        doc.font('Helvetica').fontSize(10).fillColor(BG_WARM);
        doc.text('Product Description', 50, tableTop + 8);
        doc.text('Qty', 300, tableTop + 8, { width: 40, align: 'center' });
        doc.text('Unit Price', 370, tableTop + 8, { width: 70, align: 'right' });
        doc.text('Total (DH)', 460, tableTop + 8, { width: doc.page.width - 520, align: 'right' });

        let rowTop = tableTop + 25;
        doc.rect(40, rowTop, doc.page.width - 80, 35).fill(BG_LIGHT_PINK);

        doc.font('Helvetica').fontSize(10).fillColor(TEXT_DARK);
        doc.text(productDetails.nom || productName, 50, rowTop + 12);
        doc.text(quantity.toString(), 300, rowTop + 12, { width: 40, align: 'center' });
        doc.text(`${unitPrice} DH`, 370, rowTop + 12, { width: 70, align: 'right' });

        doc.font('Helvetica-Bold').fillColor(PRIMARY_COLOR);
        doc.text(`${totalPrice} DH`, 460, rowTop + 12, { width: doc.page.width - 520, align: 'right' });

        doc.rect(40, tableTop, doc.page.width - 80, 60).lineWidth(1).strokeColor(ACCENT_PINK).stroke();

        let footerTop = rowTop + 85;
        doc.moveTo(40, footerTop - 20).lineTo(doc.page.width - 40, footerTop - 20).lineWidth(1).strokeColor(ACCENT_PINK).stroke();

        doc.image(qrCodeDataUrl, 40, footerTop, { fit: [90, 90] });
        doc.rect(38, footerTop - 2, 94, 94).lineWidth(1).strokeColor(ACCENT_PINK).stroke();

        doc.font('Helvetica').fontSize(8).fillColor(TEXT_MUTED)
            .text('Scan this QR code with your phone (connected to the same Wi-Fi) to view or download this official digital copy.', 150, footerTop + 35, { width: 180 });

        let summaryX = doc.page.width - 240;
        doc.rect(summaryX, footerTop, 200, 60).fill(BG_WARM);
        doc.rect(summaryX, footerTop, 200, 60).lineWidth(1).strokeColor(ACCENT_PINK).stroke();

        doc.font('Helvetica-Bold').fontSize(11).fillColor(PRIMARY_COLOR).text('GRAND TOTAL', summaryX + 15, footerTop + 15);
        doc.fontSize(16).fillColor(TEXT_DARK).text(`${totalPrice} DH`, summaryX + 15, footerTop + 32, { bold: true });


        let cardsTop = footerTop + 120;

        doc.moveTo(40, cardsTop - 15).lineTo(doc.page.width - 40, cardsTop - 15).lineWidth(0.5).strokeColor(ACCENT_PINK).stroke();

        doc.font('Helvetica-Bold').fontSize(11).fillColor(PRIMARY_COLOR).text('PRODUCT ARCHIVE SPECIFICATIONS', 40, cardsTop);

        let categoryName = "General";
        if (productDetails.category && productDetails.category.nom) {
            categoryName = productDetails.category.nom;
        } else if (productDetails.categorie && productDetails.categorie.nom) {
            categoryName = productDetails.categorie.nom;
        } else if (typeof productDetails.categorie === 'string') {
            categoryName = productDetails.categorie;
        }

        let cardY = cardsTop + 15;
        let cardWidth = (doc.page.width - 100) / 2;
        let cardHeight = 135;

        doc.rect(40, cardY, cardWidth, cardHeight).fill(BG_LIGHT_PINK);
        doc.rect(40, cardY, cardWidth, cardHeight).lineWidth(1).strokeColor(ACCENT_PINK).stroke();
        doc.rect(40, cardY, 4, cardHeight).fill(PRIMARY_COLOR);

        doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(9.5).text('TECHNICAL INFORMATION', 55, cardY + 12);

        doc.circle(60, cardY + 42, 7).fill(PRIMARY_COLOR);
        doc.fillColor('white').font('ZapfDingbats').fontSize(7).text('✔', 57, cardY + 39);
        doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK).text('Stock Code: ', 75, cardY + 38, { continued: true }).font('Helvetica-Bold').text(productDetails.sku || 'N/A');

        doc.circle(60, cardY + 67, 7).fill(PRIMARY_COLOR);
        doc.fillColor('white').font('ZapfDingbats').fontSize(7).text('▶', 58, cardY + 64);
        doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK).text('Full Registry: ', 75, cardY + 63, { continued: true }).font('Helvetica-Bold').text(productDetails.nom || productName);

        doc.circle(60, cardY + 92, 7).fill(PRIMARY_COLOR);
        doc.fillColor('white').font('ZapfDingbats').fontSize(6).text('✦', 57, cardY + 89);
        doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK).text('Category: ', 75, cardY + 88, { continued: true }).font('Helvetica-Bold').text(categoryName);


        let cardRightX = 40 + cardWidth + 20;
        doc.rect(cardRightX, cardY, cardWidth, cardHeight).fill(BG_LIGHT_PINK);
        doc.rect(cardRightX, cardY, cardWidth, cardHeight).lineWidth(1).strokeColor(ACCENT_PINK).stroke();
        doc.rect(cardRightX, cardY, 4, cardHeight).fill(PRIMARY_COLOR);

        doc.circle(cardRightX + 18, cardY + 16, 6).fill(PRIMARY_COLOR);
        doc.fillColor('white').font('ZapfDingbats').fontSize(6).text('★', cardRightX + 15, cardY + 13);

        doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(9.5).text('CATALOGUE DESCRIPTION', cardRightX + 30, cardY + 12);

        let textWidth = cardWidth - 30;

        if (productDetails.image) {
            try {
                const base64Data = productDetails.image.replace(/^data:image\/\w+;base64,/, "");
                const imageBuffer = Buffer.from(base64Data, 'base64');

                let imgSize = 95;
                let imgX = cardRightX + cardWidth - (imgSize + 15);
                let imgY = cardY + 28;

                doc.image(imageBuffer, imgX, imgY, { fit: [imgSize, imgSize] });
                doc.rect(imgX - 2, imgY - 2, imgSize + 4, imgSize + 4).lineWidth(1).strokeColor(ACCENT_PINK).stroke();

                textWidth = cardWidth - (imgSize + 45);
            } catch (imgErr) {
                console.error("⚠️ Failed to render product base64 image inside PDF:", imgErr.message);
            }
        }

        doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(TEXT_MUTED)
            .text(productDetails.description || 'No custom premium product description recorded in database catalogue module.', cardRightX + 15, cardY + 38, {
                width: textWidth,
                height: 85,
                ellipsis: true
            });

        doc.end();

        // --- 6. صيفطي لـ كافكا ---
        await producer.send({
            topic: 'quotation-updates',
            messages: [{
                value: JSON.stringify({
                    orderId: id,
                    type: "ORDER_SHIPPED",
                    productName: productDetails.nom || productName,
                    productId: productId,
                    arrivalRange: arrivalRange,
                    invoiceUrl: invoiceUrl,
                    qrCode: qrCodeDataUrl,
                    total_ligne: totalPrice,
                    quantite: quantity,
                    prix_unitaire: unitPrice,
                    sName: supplierName,
                    message: `🚚 Order of product ${productDetails.nom || productName} shipped! It will arrive in: ${arrivalRange}.`
                })
            }]
        });

        res.status(200).json({
            message: "Shipped successfully with Premium Invoice & Network Ready QR Code",
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