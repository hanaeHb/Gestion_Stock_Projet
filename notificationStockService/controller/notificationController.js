const Notification = require("../models/Notification");
const notificationModel = require("../models/notificationModel");
const emailService = require("../Service/emailService");
const PDFDocument = require('pdfkit');
const path = require('path');


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
        const status = req.body.statut;
        if (!status) return res.status(400).json({ message: "Status is required" });

        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });

        notification.statut = status.toUpperCase();
        await notification.save();

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

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({
            message: "Notification marked as read successfully",
            notification
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur update notification", error: error.message });
    }
};

exports.markAwaitingReceptionAsRead = async (req, res) => {
    try {
        const { orderId, fournisseurId } = req.body;

        if (!orderId || !fournisseurId) {
            return res.status(400).json({
                message: "Missing required fields: orderId and fournisseurId"
            });
        }

        const result = await Notification.updateMany(
            {
                orderId: orderId,
                fournisseurId: fournisseurId,
                type: "QUOTE_FINALIZED",
                niveau: "SUCCESS",
                statut: "NON_LUE"
            },
            {
                $set: { statut: "LUE" }
            }
        );

        console.log(`✅ Marked ${result.modifiedCount} notification(s) as LUE for order ${orderId}, fournisseur ${fournisseurId}`);

        res.status(200).json({
            success: true,
            message: "Awaiting reception notification marked as read",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("❌ Error marking awaiting reception as read:", error.message);
        res.status(500).json({
            message: "Error marking notification as read",
            error: error.message
        });
    }
};

exports.update = async (req, res) => {
    try {
        const { message, niveau, type, statut } = req.body;

        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });

        if (message) notification.message = message;
        if (niveau) notification.niveau = niveau;
        if (type) notification.type = type;
        if (statut) notification.statut = statut;

        await notification.save();
        res.json({ message: "Notification mise à jour", notification });
    } catch (error) {
        console.error("❌ Error in update controller:", error.message);
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



exports.generateInvoicePDF = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            layout: 'portrait'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${notification.orderId}_${Date.now()}.pdf`);

        doc.pipe(res);


        doc.rect(0, 0, doc.page.width, 80)
            .fill('#730d19');

        doc.fontSize(28)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text('GOSTOCK', 50, 25);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#ffd4d6')
            .text('GO Stock Management Platform', 50, 55);

        doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text('INVOICE', doc.page.width - 150, 35);


        let currentY = 110;

        doc.rect(50, currentY, 500, 60)
            .fill('#fef2f2')
            .stroke('#ff9a9e');

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#730d19');

        doc.text(`Invoice Number: INV-${notification.orderId || notification._id}`, 65, currentY + 12);
        doc.text(`Invoice Date: ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, 65, currentY + 30);
        doc.text(`Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}`, 65, currentY + 48);


        currentY = 195;

        doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#730d19')
            .text('BILL TO (BUYER):', 50, currentY);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#4a5568');

        doc.text('GOSTOCK Platform', 50, currentY + 18);
        doc.text('Casablanca, Morocco', 50, currentY + 33);
        doc.text('admingostock@gmail.com', 50, currentY + 48);


        doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#730d19')
            .text('SUPPLIER (SELLER):', doc.page.width - 180, currentY);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#4a5568');

        doc.text(notification.sName || 'Supplier Name', doc.page.width - 180, currentY + 18);
        doc.text(`Supplier ID: ${notification.fournisseurId || 'N/A'}`, doc.page.width - 180, currentY + 33)


        currentY = 275;

        doc.rect(50, currentY, 500, 25)
            .fill('#ff9a9e');

        doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text('ORDER DETAILS:', 65, currentY + 8);

        currentY = 305;

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#4a5568');

        doc.text(`Order ID: ${notification.orderId || 'N/A'}`, 65, currentY);
        doc.text(`Order Date: ${new Date(notification.dateAlerte || Date.now()).toLocaleDateString('fr-FR')}`, 250, currentY);
        doc.text(`Payment Terms: Net 30 days`, 420, currentY);


        currentY = 335;

        doc.rect(50, currentY, 500, 30)
            .fill('#730d19');

        doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#ffffff');

        doc.text('Product Description', 65, currentY + 10);
        doc.text('Quantity', 250, currentY + 10);
        doc.text('Unit Price', 350, currentY + 10);
        doc.text('Total', 450, currentY + 10);


        currentY = 365;

        const unitPrice = notification.prix_unitaire || (notification.total_ligne / notification.quantite) || 0;
        const totalLigne = notification.total_ligne || (unitPrice * notification.quantite) || 0;

        doc.rect(50, currentY, 500, 45)
            .fill('#ffffff')
            .stroke('#e2e8f0');

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#2d3748');

        doc.text(notification.productName || 'N/A', 65, currentY + 18);
        doc.text(`${notification.quantite || notification.requestedQty || 0} units`, 250, currentY + 18);
        doc.text(`${unitPrice.toFixed(2)} DH`, 350, currentY + 18);
        doc.text(`${totalLigne.toFixed(2)} DH`, 450, currentY + 18);


        currentY = 450;

        // Subtotal
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#4a5568');

        doc.text('Subtotal:', doc.page.width - 200, currentY);
        doc.text(`${totalLigne.toFixed(2)} DH`, doc.page.width - 100, currentY, { align: 'right' });


        currentY = 490;

        doc.rect(doc.page.width - 200, currentY, 180, 50)
            .fill('#730d19');

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text('TOTAL TO PAY:', doc.page.width - 190, currentY + 12);

        doc.fontSize(18)
            .font('Helvetica-Bold')
            .fillColor('#ffd4d6')
            .text(`${totalLigne.toFixed(2)} DH`, doc.page.width - 190, currentY + 28);


        currentY = 570;

        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#730d19')
            .text('Payment Instructions:', 50, currentY);

        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#6c757d');

        doc.text('Bank: BMCE Bank of Africa', 50, currentY + 14);
        doc.text('Account Name: GOSTOCK SARL', 50, currentY + 24);
        doc.text('IBAN: MA64 1234 5678 9012 3456 7890 12', 50, currentY + 34);
        doc.text('SWIFT/BIC: BMCEMAMC', 50, currentY + 44);


        doc.end();

    } catch (err) {
        console.error("Error generating PDF:", err.message);
        res.status(500).json({ error: err.message });
    }
};