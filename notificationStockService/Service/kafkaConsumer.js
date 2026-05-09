const { Kafka } = require("kafkajs");
const Notification = require("./models/notificationModel");
const emailService = require("./emailService");

const kafka = new Kafka({
    clientId: "notification-service",
    brokers: ["localhost:9092"]
});

const consumer = kafka.consumer({
    groupId: "notification-service-group"
});

const runConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: "low-stock-alert", fromBeginning: false });
    await consumer.subscribe({ topic: "fournisseur-registered", fromBeginning: false });
    await consumer.subscribe({ topic: "fournisseur-validated", fromBeginning: false });
    await consumer.subscribe({ topic: 'replenishment-requested', fromBeginning: true });
    await consumer.subscribe({ topic: 'order-notifications', fromBeginning: true });
    await consumer.subscribe({ topic: 'quotation-updates', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const event = JSON.parse(message.value.toString());
            console.log(`📩 Kafka Event from [${topic}]:`, event);

            // --- CASE 1: LOW STOCK ALERT ---
            if (topic === "low-stock-alert") {
                await Notification.create({
                    message: `⚠️ Alerte Stock: Le produit "${event.nom}" a atteint son seuil critique (${event.quantiteActuelle} restants). Veuillez informer le responsable d'achat.`,
                    niveau: "ERROR",
                    statut: "NON_LUE",
                    dateAlerte: new Date()
                });
                console.log("✅ Alerte stock enregistrée");
            }

            // --- CASE 2: FOURNISSEUR REGISTERED ---
            else if (topic === "fournisseur-registered") {
                await Notification.create({
                    message: `Fournisseur ${event.firstName} ${event.lastName} a créé un compte.`,
                    fournisseur: {
                        userId: event.userId,
                        firstName: event.firstName,
                        lastName: event.lastName,
                        email: event.email,
                        cin: event.cin,
                        phone: event.phone,
                        role: event.role,
                        cvPath: event.cvPath
                    },
                    niveau: "INFO",
                    statut: "PENDING"
                });

                await emailService.sendEmail(
                    event.email,
                    "Account Pending Verification",
                    "Your account is currently under review. We will notify you once it has been approved."
                );
            }

            // --- CASE 3: FOURNISSEUR VALIDATED ---
            else if (topic === "fournisseur-validated") {
                await Notification.create({
                    message: `Fournisseur ${event.email} a été ${event.status}.`,
                    fournisseur: {
                        userId: event.userId,
                        email: event.email
                    },
                    niveau: event.status === "validated" ? "SUCCESS" : "ERROR",
                    statut: "NON_LUE"
                });

                const subject = event.status === "validated" ? "Compte validé" : "Compte refusé";
                let body = event.status === "validated"
                    ? `Votre compte fournisseur a été validé. Connectez-vous ici: http://localhost:3000/login`
                    : `Votre compte fournisseur a été refusé. Pour plus d'informations, contactez l'administrateur.`;

                await emailService.sendEmail(event.email, subject, body);
            }

            else if (topic === 'replenishment-requested') {
                const newRequest = new Notification({
                    message: `Demand: ${event.productName} (${event.category}) requested by ${event.fromManager}`, 
                    productName: event.productName,
                    productId: event.productId,
                    categoryId: event.categoryId,
                    sku: event.sku,
                    productImage: event.productImage,
                    requestedQty: event.requestedQty,
                    fromManager: event.fromManager,
                    category: event.category, 
                    niveau: "REPLENISHMENT_ORDER",
                    statut: "NON_LUE",
                    dateAlerte: new Date()
                });

                await newRequest.save();
                console.log(`Replenishment Request for ${event.category} saved to DB! ✅`);
            }

            else if (topic === "order-notifications") {
                const { email, product, productId, quantity, orderId, message, fournisseurId } = event;

                await Notification.create({
                    message: message || `Nouvelle commande: ${quantity}x ${product}`,
                    orderId: orderId,
                    fournisseurId: fournisseurId,
                    niveau: "RFQ",
                    productId: productId,
                    productName: product,    
                    requestedQty: quantity,
                    statut: "NON_LUE",
                    dateAlerte: new Date(),
                    type: "NEW_ORDER_REQUEST"
                });

                await emailService.sendEmail(
                    email,
                    "New Purchase Request (RFQ)",
                    `Hello, the manager requested a price for ${quantity} units of ${product}. 
                     Please log in to submit your price : http://localhost:3000/login`
                );

                console.log(`✅ Notification & Email sent to supplier: ${email}`);
            }
            else if (topic === "quotation-updates") {
                const { orderId, productId, type, price, productName } = event;

                if (type === "QUOTATION_SUBMITTED") {
                    await Notification.findOneAndUpdate(
                        { orderId: orderId, niveau: "RFQ" },
                        {
                            statut: "LUE",
                            message: `Réponse envoyée pour ${productName}: ${price} DH`
                        }
                    );
                    
                    await Notification.create({
                        message: `Nouveau devis reçu pour ${productName} (Prix: ${price} DH)`,
                        niveau: "SUCCESS",
                        statut: "NON_LUE",
                        type: "QUOTE_RECEIVED",
                        dateAlerte: new Date()
                    });

                    console.log(`✅ Notification updated & Manager notified for Order: ${orderId}`);
                }
                else if (type === "QUOTATION_ACCEPTED") {
                    const finalProductId = event.pId || event.productId || event.id_produit;
                    await Notification.create({
                        message: `The offer for product "${productName}" has been accepted. Please remember to confirm receipt once the goods have been delivered.`,
                        orderId: orderId,
                        productId: finalProductId,
                        niveau: "SUCCESS",
                        productName: productName,
                        prix_unitaire: event.price,
                        quantite: event.quantity,
                        total_ligne: event.total_ligne,
                        sName: event.sName,
                        statut: "NON_LUE",
                        type: "QUOTE_FINALIZED",
                        dateAlerte: new Date()
                    });
                    await Notification.create({
                        message: `📦 The offer for product "${productName}" has been accepted. Please remember to confirm receipt once the goods have been delivered.`,
                        orderId: orderId,
                        productId: finalProductId,
                        productName: productName,
                        prix_unitaire: event.price,
                        quantite: event.quantity,
                        total_ligne: event.total_ligne,
                        sName: event.sName,
                        niveau: "INFO",
                        statut: "NON_LUE",
                        type: "AWAITING_RECEPTION",
                        dateAlerte: new Date()
                    });
                    
                    if (event.supplierEmail) {
                        await emailService.sendEmail(
                            event.supplierEmail,
                            "Quote Accepted - Smart Stock Management",
                            `Good news! Your quote for ${productName} (Price: ${event.price} DH) has been accepted. 
                             Please log in to generate the invoice: http://localhost:3000/login`
                        );
                    }
                    console.log(`✅ Acceptance notification & email processed for Order: ${orderId}`);
                }

                else if (type === "ORDER_SHIPPED") {
                    await Notification.create({
                        message: event.message,
                        orderId: event.orderId,
                        productId: event.productId,
                        productName: event.productName,
                        total_ligne: event.total_ligne,
                        quantite: event.quantite,
                        prix_unitaire: event.prix_unitaire,
                        sName: event.sName,
                        arrivalRange: event.arrivalRange,
                        qrCode: event.qrCode,
                        invoiceUrl: event.invoiceUrl,
                        niveau: "INFO",
                        statut: "NON_LUE",
                        type: "WAITING_CONFIRMATION",
                        dateAlerte: new Date()
                    });
                }

                else if (type === "QUOTATION_REFUSED") {
                    if (event.supplierEmail) {
                        await emailService.sendEmail(
                            event.supplierEmail,
                            "Quote Status Update",
                            `We regret to inform you that your quote for ${productName} was not selected this time. 
                             Check other requests here: http://localhost:3000/login`
                        );
                    }
                }
            }
        }
    });
};

module.exports = runConsumer;