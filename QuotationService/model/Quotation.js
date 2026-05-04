const mongoose = require('mongoose');


const QuotationSchema = new mongoose.Schema({
    id_commande: { type: String, required: true }, // ID ديال الـ Notification/RFQ
    id_produit: { type: String, required: true },
    pName: { type: String },
    id_supplier: { type: String, required: true },
    sName: { type: String },
    supplierEmail: { type: String },
    quantite: { type: Number, required: true },
    prix_unitaire: { type: Number, required: true },
    total_ligne: { type: Number },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REFUSED'],
        default: 'PENDING'
    },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now }
});

QuotationSchema.pre('save', function() {
    this.total_ligne = this.quantite * this.prix_unitaire;
});

module.exports = mongoose.model('Quotation', QuotationSchema);
