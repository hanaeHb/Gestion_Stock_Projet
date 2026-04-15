const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    idAlerte: { type: Number },
    message: { type: String, required: true },
    dateAlerte: { type: Date, default: Date.now },
    niveau: { type: String, enum: ["FAIBLE","MOYEN","CRITIQUE","INFO","SUCCESS","ERROR"], required: true },
    statut: { type: String, enum: ["NON_LUE","LUE"], default: "NON_LUE" }
});

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);