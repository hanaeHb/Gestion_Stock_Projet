const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

    message: String,

    type: String,
    
    fournisseur: {
        userId: Number,
        firstName: String,
        lastName: String,
        email: String,
        cin: String,
        phone: String,
        role: String,
        cvPath: String,
    },

    productName: String,
    productId: String,
    categoryId: String,
    sku: String,
    productImage: String,
    fournisseurId: String,
    requestedQty: Number,
    fromManager: String,
    category: String,
    arrivalRange: String,
    qrCode: String,
    invoiceUrl: String,
    orderId: { type: String },
    prix_unitaire: Number,
    quantite: Number,
    total_ligne: Number,
    sName: String,


    dateAlerte: {
        type: Date,
        default: Date.now
    },

    niveau: String,

    statut: {
        type: String,
        default: "NON_LUE"
    }

});

module.exports =
    mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);