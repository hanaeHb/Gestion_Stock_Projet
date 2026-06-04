const Quotation = require('../model/Quotation');
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'quotation-service',
    brokers: ['localhost:9092']
});
const producer = kafka.producer();

exports.createQuotation = async (req, res) => {
    try {
        const { id_commande, id_produit, categoryId, pName, sku, pId, id_supplier, sName, supplierEmail, quantite, prix_unitaire } = req.body;

        if (!id_commande || !id_produit || !quantite || !prix_unitaire) {
            return res.status(400).json({ error: "Champs obligatoires manquants" });
        }

        const newQuotation = new Quotation({
            id_commande,
            id_produit,
            pName: pName || "Produit",
            pId:  id_produit,
            categoryId: categoryId,
            sku: sku,
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
                    categoryId: categoryId,
                    sku: sku,
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
exports.refuseQuotation = async (req, res) => {
    try {
        const { orderId, productId, productName, categoryId, quantite, supplierName, reason } = req.body;
        const finalQty = quantite || req.body.requestedQty || 1;

        console.log(`🚫 Refusal received for Order ${orderId} from ${supplierName}`);

        await producer.connect();
        await producer.send({
            topic: 'quotation-updates',
            messages: [{
                value: JSON.stringify({
                    type: 'QUOTATION_REFUSED',
                    orderId: orderId,
                    productId: productId,
                    categoryId: categoryId,
                    requestedQty: finalQty,
                    productName: productName,
                    sName: supplierName,
                    reason: reason
                })
            }]
        });
        await producer.disconnect();

        res.status(200).json({ message: "Refusal sent to manager via Kafka" });
    } catch (err) {
        console.error("❌ Error in refuseQuotation:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
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

        const acceptanceRate = result.totalQuotes > 0
            ? ((result.acceptedQuotes / result.totalQuotes) * 100).toFixed(1)
            : 0;

        res.json({ ...result, acceptanceRate });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getSupplierProductStats = async (req, res) => {
    try {
        const { id_supplier } = req.params;
        const totalCount = await Quotation.countDocuments({ id_supplier: id_supplier });

        if (totalCount === 0) {
            return res.json([]);
        }

        const productStats = await Quotation.aggregate([
            { $match: { id_supplier: id_supplier } },
            {
                $group: {
                    _id: "$pName",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const formattedResult = productStats.map(item => {
            const percentage = ((item.count / totalCount) * 100).toFixed(0);
            return {
                productName: item._id || "Unknown Product",
                count: item.count,
                percentage: parseInt(percentage)
            };
        });

        res.json(formattedResult);

    } catch (err) {
        console.error("❌ Error in getSupplierProductStats:", err.message);
        res.status(500).json({ error: err.message });
    }
};
exports.updateQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log(`📝 Updating quotation ${id} to status: ${status}`);

        const updated = await Quotation.findByIdAndUpdate(
            id,
            { status: status },
            { new: true }  // TODO: replace with returnDocument: 'after' later
        );

        if (!updated) {
            return res.status(404).json({ error: "Quotation not found" });
        }

        await producer.connect();

        if (status === "ACCEPTED") {
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
                        sName: updated.sName,
                        fournisseurId: updated.id_supplier,
                        timestamp: new Date().toISOString()
                    })
                }]
            });
            console.log(`✅ Quotation ${id} ACCEPTED - Kafka event sent`);
        }
        else if (status === "REFUSED") {
            await producer.send({
                topic: 'quotation-updates',
                messages: [{
                    value: JSON.stringify({
                        type: 'QUOTATION_REFUSED_BY_MANAGER',
                        orderId: updated.id_commande,
                        productId: updated.id_produit,
                        productName: updated.pName,
                        categoryId: updated.categoryId,
                        requestedQty: updated.quantite,
                        sName: updated.sName,
                        supplierEmail: updated.supplierEmail,
                        fournisseurId: updated.id_supplier,
                        reason: "Refused by Manager",
                        timestamp: new Date().toISOString()
                    })
                }]
            });
            console.log(`❌ Quotation ${id} REFUSED - Kafka event sent (Plan B triggered)`);
        }

        await producer.disconnect();

        res.status(200).json({
            success: true,
            message: `Quotation ${status.toLowerCase()} successfully`,
            data: updated
        });

    } catch (err) {
        console.error("❌ Error in updateQuotationStatus:", err.message);

        // ✅ Try to disconnect if connected
        try {
            await producer.disconnect();
        } catch (disconnectErr) {
            console.error("Error disconnecting producer:", disconnectErr.message);
        }

        res.status(500).json({ error: err.message });
    }
};
exports.getProductPriceEvolution = async (req, res) => {
    try {
        const { id_supplier } = req.params;
        const { productName } = req.query;

        if (!productName) {
            return res.status(400).json({ error: "Le nom du produit est requis" });
        }

        const history = await Quotation.find({
            id_supplier: id_supplier,
            pName: productName
        })
            .sort({ createdAt: 1 })
            .select('prix_unitaire createdAt');

        const formattedHistory = history.map((item, index) => ({
            name: `Q${index + 1}`,
            price: item.prix_unitaire,
            fullDate: new Date(item.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            })
        }));

        res.json(formattedHistory);
    } catch (err) {
        console.error("❌ Error in getProductPriceEvolution:", err.message);
        res.status(500).json({ error: err.message });
    }
};