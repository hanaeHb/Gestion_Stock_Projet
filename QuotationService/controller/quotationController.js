const Quotation = require('../model/Quotation');
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'quotation-service',
    brokers: ['localhost:9092']
});
const producer = kafka.producer();

exports.createQuotation = async (req, res) => {
    try {
        const { id_commande, id_produit, pName, pId, id_supplier, sName, supplierEmail, quantite, prix_unitaire } = req.body;

        if (!id_commande || !id_produit || !quantite || !prix_unitaire) {
            return res.status(400).json({ error: "Champs obligatoires manquants" });
        }

        const newQuotation = new Quotation({
            id_commande,
            id_produit,
            pName: pName || "Produit",
            pId:  id_produit,
            id_supplier,
            sName: sName,
            supplierEmail: supplierEmail,
            quantite,
            prix_unitaire,
            status: "PENDING"
        });

        const saved = await newQuotation.save();
        console.log("✅ Devis enregistré pour:", pName);

        await producer.connect();
        await producer.send({
            topic: 'quotation-updates',
            messages: [{
                value: JSON.stringify({
                    type: 'QUOTATION_SUBMITTED',
                    orderId: id_commande,
                    pId:  id_produit,
                    price: prix_unitaire,
                    productName: pName,
                })
            }]
        });
        await producer.disconnect();
        return res.status(201).json(saved);

    } catch (err) {
        console.error("❌ Error in Controller:", err.message);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Erreur interne du serveur" });
        }
    }
};

exports.getAllQuotations = async (req, res) => {
    try {
        const quotes = await Quotation.find().sort({ createdAt: -1 });
        res.json(quotes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSupplierStats = async (req, res) => {
    try {
        const { id_supplier } = req.params;

        const stats = await Quotation.aggregate([
            { $match: { id_supplier: id_supplier } },
            {
                $group: {
                    _id: null,
                    totalQuotes: { $sum: 1 },
                    acceptedQuotes: {
                        $sum: { $cond: [{ $eq: ["$status", "ACCEPTED"] }, 1, 0] }
                    },
                    refusedQuotes: {
                        $sum: { $cond: [{ $eq: ["$status", "REFUSED"] }, 1, 0] }
                    },
                    totalRevenue: {
                        $sum: { $cond: [{ $eq: ["$status", "ACCEPTED"] }, { $multiply: ["$prix_unitaire", "$quantite"] }, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || { totalQuotes: 0, acceptedQuotes: 0, refusedQuotes: 0, totalRevenue: 0 };

        // حساب نسبة القبول
        const acceptanceRate = result.totalQuotes > 0
            ? ((result.acceptedQuotes / result.totalQuotes) * 100).toFixed(1)
            : 0;

        res.json({ ...result, acceptanceRate });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await Quotation.findByIdAndUpdate(
            id,
            { status: status },
            { new: true }
        );

        if (status === "ACCEPTED") {
            await producer.connect();
            await producer.send({
                topic: 'quotation-updates',
                messages: [{
                    value: JSON.stringify({
                        type: 'QUOTATION_ACCEPTED',
                        orderId: updated.id_commande,
                        finalPrice: updated.prix_unitaire,
                        productName: updated.pName,
                        pId: updated.id_produit,
                        supplierEmail: updated.supplierEmail,
                        quantity: updated.quantite,
                        total_ligne: updated.total_ligne,
                        sName: updated.sName
                    })
                }]
            });
            await producer.disconnect();
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};