const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const Eureka = require('eureka-js-client').Eureka;
const notificationRoutes = require('./routes/notificationRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const connectDB = require('./db');
const { Kafka } = require('kafkajs');
const Notification = require('./models/Notification');
const emailService = require('./Service/emailService');7
const clien = require('prom-client');
const logger = require('./logger');

const app = express();
const PORT = 5003;

const collectDefaultMetrics = clien.collectDefaultMetrics;
collectDefaultMetrics({ register: clien.register });

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', clien.register.contentType);
    res.end(await clien.register.metrics());
  } catch (ex) {
    logger.error(`Prometheus Metrics Error f Notification: ${ex.message || ex}`);
    res.status(500).end(ex);
  }
});


/*const client = new Eureka({
  instance: {
    app: 'service-notification',
    hostName: 'service-notification',
    ipAddr: 'service-notification',
    statusPageUrl: `http://service-notification:${PORT}/info`,
    healthCheckUrl: `http://service-notification:${PORT}/health`,
    port: { '$': PORT, '@enabled': 'true' },
    vipAddress: 'service-notification',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
  },
  eureka: {
    host: 'discovery-service',
    port: 8761,
    servicePath: '/eureka/apps/',
  },
});*/

const client = new Eureka({
  instance: {
    app: 'service-notification',
    hostName: 'localhost',      // Trje3 localhost
    instanceId: `service-notification:${PORT}`,
    ipAddr: '127.0.0.1',        // Trje3 IP local
    statusPageUrl: `http://localhost:${PORT}/info`,
    healthCheckUrl: `http://localhost:${PORT}/health`,
    port: {
      '$': PORT,
      '@enabled': 'true'
    },
    vipAddress: 'service-notification',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
  },
  eureka: {
    // Eureka server f l-PC dyalk
    host: 'localhost',
    port: 8761,
    servicePath: '/eureka/apps/',
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
  res.send({ status: 'UP' });
});

app.use('/uploads/cv', express.static(path.join(__dirname, 'uploads/cv')));

app.get('/download/cv/:filename', async (req, res) => {
  const fileName = req.params.filename;
  try {
    const response = await axios({
      url: `http://localhost:8888/security-stock/uploads/cv/${fileName}`,
      method: 'GET',
      responseType: 'stream',
    });
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.data.pipe(res);
  } catch (err) {
    console.error("Error fetching file from Security service:", err.message);
    res.status(404).send('File not found');
  }
});
// Connect MongoDB
connectDB();

// Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Notification Microservice', version: '1.0.0' },
    servers: [{ url: `http://localhost:${PORT}/api` }]
  },
  apis: ['./routes/*.js']
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(options)));

// Routes
app.use('/api/notifications', notificationRoutes);

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: [process.env.KAFKA_BROKERS || "localhost:9092"]
});

const consumer = kafka.consumer({ groupId: "notification-group" });

const runKafkaConsumer = async () => {
  logger.info("Kafka Consumer connecté avec succès.");
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
      console.log("📩 Kafka Event:", event);
      logger.info(`Événement Kafka reçu sur le topic [${topic}]`);
      if (topic === "low-stock-alert") {
        await Notification.create({
          message: `⚠️ Stock Alert: The product "${event.nom}" has reached its critical threshold (${event.quantiteActuelle} remaining).`,
          niveau: "ERROR",
          statut: "NON_LUE",
          type: "STOCK_ALERT",
          dateAlerte: new Date()
        });
        logger.info(`✅ Alerte stock enregistrée pour le produit: ${event.nom}`);
        console.log("✅ Alerte stock enregistrée");
      }
      
      if (topic === 'replenishment-requested') {
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
        logger.info(`Replenishment Request for ${event.category} saved to DB! ✅`);
        console.log(`Replenishment Request for ${event.category} saved to DB! ✅`);
      }

      if (topic === "fournisseur-registered") {
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
            cvPath: event.cvPath,
          },
          niveau: "INFO",
          statut: "PENDING"
        });

        await emailService.sendEmail(
            event.email,
            "Account Pending Verification",
            "Your account is currently under review. We will notify you once it has been approved."
        );
        logger.info(`📧 Email d'attente envoyé au fournisseur: ${event.email}`);
      }

      if (topic === "fournisseur-validated") {
        await Notification.create({
          message: `Fournisseur ${event.email} a été ${event.status}.`,
          fournisseur: { userId: event.userId, email: event.email },
          niveau: event.status === "validated" ? "SUCCESS" : "ERROR",
          statut: "NON_LUE"
        });

        const subject = event.status === "validated" ? "Compte validé" : "Compte refusé";
        let body = event.status === "validated"
            ? `Votre compte fournisseur a été validé. Connectez-vous ici: http://localhost:3000/login`
            : `Votre compte fournisseur a été refusé. Pour plus d'informations, contactez l'administrateur.`;

        await emailService.sendEmail(event.email, subject, body);
        logger.info(`📧 Email de statut [${event.status}] envoyé à: ${event.email}`);
      }
      else if (topic === "order-notifications") {
        const { email, product, categoryId, productId, quantity, orderId, message, fournisseurId } = event;

        const finalCategoryId = categoryId || "UNKNOWN_CAT";
        await Notification.create({
          message: message || `Nouvelle commande: ${quantity}x ${product}`,
          orderId: orderId,
          fournisseurId: fournisseurId,
          niveau: "RFQ",
          productId: productId,
          categoryId: finalCategoryId,
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
        logger.info(`✅ Notification & Email RFQ envoyés au fournisseur: ${email}`);
        console.log(`✅ Notification & Email sent to supplier: ${email}`);
      }
      else if (topic === "quotation-updates") {
        const { orderId, productId, type, price, productName } = event;

        if (type === "QUOTATION_SUBMITTED") {
          await Notification.findOneAndUpdate(
              { orderId: orderId, niveau: "RFQ" },
              {
                statut: "LUE",
                type: "QUOTE_RECEIV",
                message: `New quote received for ${productName} (Price: ${price} DH)`
              }
          );

          await Notification.create({
            message: `New quote received for ${productName} (Price: ${price} DH)`,
            niveau: "SUCCESS",
            statut: "NON_LUE",
            type: "QUOTE_RECEIVED",
            dateAlerte: new Date()
          });
          logger.info(`✅ Devis soumis reçu pour la commande ID: ${orderId}`);
          console.log(`✅ Notification updated & Manager notified for Order: ${orderId}`);
        }else if (type === "QUOTATION_REFUSED") {

          await Notification.create({
            message: `The supplier ${event.sName} has rejected the offer for ${event.requestedQty} Units of "${event.productName}". Reason: ${event.reason || 'Not specified'}`,
            niveau: "ERROR",
            statut: "NON_LUE",
            type: "QUOTE_REFUSED_BY_SUPPLIER",
            dateAlerte: new Date(),
            orderId: event.orderId
          });
          logger.warn(`=== 🤖 AUTOMATED FALLBACK PIPELINE ACTIVATED (Product ID: ${event.productId}) ===`);
          console.log(`=== 🤖 STARTING AUTOMATED FALLBACK PIPELINE (Product ID: ${event.productId}) ===`);

          const internalAuthHeader = "Bearer " + process.env.INTERNAL_SERVICE_TOKEN;
          let targetFournisseurs = [];
          let aiRankings = [];
          let resolvedCategoryId = event.categoryId ;

          console.log(`🎯 [Step 1.5 - Direct hit]: Using Category ID: ${resolvedCategoryId}`);

          try {
            const resSuppliers = await axios.get(
                `http://localhost:8888/service-fournisseur/api/fournisseurs/category/${resolvedCategoryId}`
            );
            targetFournisseurs = resSuppliers.data || [];
            logger.info(`[Plan B] ${targetFournisseurs.length} fournisseurs alternatifs récupérés.`);
            console.log(`✅ [Step 2 - Supplier Service]: Fetched ${targetFournisseurs.length} alternative targets successfully.`);
          } catch (err) {
            logger.error(`❌ [CRITICAL ERROR - PLAN B]: Impossible de contacter service-fournisseur.`);
            console.error(`❌ [CRITICAL ERROR - SUPPLIER SERVICE]: Failed to fetch suppliers for category ID ${resolvedCategoryId}.`);
            return;
          }

          try {

            const resAi = await axios.get(
                `http://localhost:5008/prediction/predict-best-supplier/${resolvedCategoryId}`
            );
            aiRankings = resAi.data || [];
            logger.info(`[Plan B] Classement IA chargé depuis le service de prédiction Python.`);
            console.log(`✅ [Step 3 - Prediction Service]: AI rankings loaded successfully.`);
          } catch (err) {
            logger.error(`⚠️ [NON-CRITICAL ERROR - PLAN B]: Le pipeline IA Python n'est pas joignable: ${err.message}`);
            console.error(`⚠️ [NON-CRITICAL ERROR - PREDICTION SERVICE]: Failed to reach prediction pipeline.`);
            console.error(`Reason: ${err.message}`, err.response ? `| Status: ${err.response.status} | Data: ${JSON.stringify(err.response.data)}` : '');
            aiRankings = [];
          }

          const sortedSuppliers = [...targetFournisseurs].sort((a, b) => {
            const scoreA = aiRankings.find(r => Number(r.id_fournisseur) === Number(a.id_fournisseur))?.ai_score || 0;
            const scoreB = aiRankings.find(r => Number(r.id_fournisseur) === Number(b.id_fournisseur))?.ai_score || 0;
            return scoreB - scoreA;
          });

          const currentSupplierIndex = sortedSuppliers.findIndex(f => {
            const fullName = `${f.prenom || ''} ${f.nom || ''}`.trim().toLowerCase();
            const eventName = String(event.sName || '').trim().toLowerCase();
            return fullName === eventName ||
                String(f.nom).toLowerCase() === eventName ||
                f.email === event.emailFournisseur;
          });

          let nextSupplier = null;
          if (currentSupplierIndex === -1 && sortedSuppliers.length > 0) {
            nextSupplier = sortedSuppliers[0];
          } else if (currentSupplierIndex !== -1 && (currentSupplierIndex + 1) < sortedSuppliers.length) {
            nextSupplier = sortedSuppliers[currentSupplierIndex + 1];
          }

          if (nextSupplier) {
            logger.info(`🎯 [Plan B] Cible identifiée -> ${nextSupplier.prenom} ${nextSupplier.nom} (ID: ${nextSupplier.id_fournisseur}).`);
            console.log(`🎯 [Pipeline Blueprint]: Next target identified -> ${nextSupplier.prenom} ${nextSupplier.nom} (ID: ${nextSupplier.id_fournisseur}).`);
            const backupQty = event.quantity ? Number(event.quantity) : (event.requestedQty ? Number(event.requestedQty) : 1);

            const newOrderData = {
              id_commande: String(Date.now()),
              id_fournisseur: Number(nextSupplier.id_fournisseur),
              emailFournisseur: nextSupplier.email,
              id_request: event.id_request || "AUTOMATED_PLAN_B",
              status: 'WAITING_FOR_QUOTATION',
              total: 0,
              categoryId: Number(resolvedCategoryId),
              items: [{
                id_produit: event.productId,
                productId: event.productId,
                productName: event.productName || "MacBook Pro M3",
                quantite: backupQty,
                categoryId: Number(resolvedCategoryId)
              }],
              dateCommande: new Date().toISOString()
            };

            try {
              await axios.post("http://localhost:5001/api/commandes", newOrderData, {
              });
              logger.info(`🚀 [Plan B] Commande de secours enregistrée dans CommandeService.`);
              console.log(`🚀 [Step 6 - Commande Service]: Fallback order registered successfully in Database.`);
              const realQty = event.quantite ? Number(event.quantite) : 1;
              await Notification.create({
                message: `🤖 [Plan B Executed]: The system automated a fallback route to supplier "${nextSupplier.prenom} ${nextSupplier.nom}" (ID: ${nextSupplier.id_fournisseur}) for ${backupQty}x "${event.productName || "MacBook Pro M3"}" following the refusal from ${event.sName}.`,
                orderId: newOrderData.id_commande,
                fournisseurId: nextSupplier.id_fournisseur,
                niveau: "PLAN_B_ACTIVATED",
                productId: event.productId,
                categoryId: String(resolvedCategoryId),
                productName: event.productName || "MacBook Pro M3",
                requestedQty: backupQty,
                statut: "NON_LUE",
                dateAlerte: new Date(),
                type: "PLAN_B_ROUTED"
              });
              logger.info(`📢 Alerte Plan B enregistrée dans la base de données.`);
              console.log(`📢 [Admin Alert Saved]: Plan B execution notified to management team.`);

            } catch (err) {
              logger.error(`❌ [CRITICAL ERROR]: Échec de la distribution du Plan B: ${err.message}`);
              console.error(`❌ [CRITICAL ERROR - PLAN B DISTRIBUTION]: Fallback execution chain failed.`);
              console.error(`Reason: ${err.message}`, err.response ? `| Data: ${JSON.stringify(err.response.data)}` : '');
            }

          } else {
            logger.warn(`🚨 [Plan B] Aucun fournisseur alternatif disponible pour la catégorie: ${resolvedCategoryId}`);
            console.warn(`🚨 [Pipeline Sourcing Alert]: No alternative targets available downstream for category ${resolvedCategoryId}.`);

            await Notification.create({
              message: ` ${event.sName} refused "${event.productName}" and no fallback backup supplier exists for this category.`,
              niveau: "ERROR",
              statut: "NON_LUE",
              type: "NO_FALLBACK_AVAILABLE",
              dateAlerte: new Date(),
              orderId: event.orderId
            });

            console.log(`❌ === AUTOMATED FALLBACK TERMINATED: NO PLAN B MATCH ===`);
          }
        }
        else if (type === "QUOTATION_ACCEPTED") {
          const finalProductId = event.pId || event.productId || event.id_produit;
          const supplierIdFromEvent = event.fournisseurId || event.id_supplier;
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
            fournisseurId: supplierIdFromEvent,
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
            fournisseurId: supplierIdFromEvent,
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
          logger.info(`✅ Notification d'acceptation traitée pour la commande: ${orderId}`);
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
          logger.info(`📦 Statut mis à jour: Commande expédiée ID: ${event.orderId}`);
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

runKafkaConsumer().catch((err) => logger.error(`Erreur critique du Consumer Kafka: ${err.message}`));

app.listen(PORT, () => {
  logger.info(`Notification microservice running on port ${PORT}`);
  client.start((error) => {
    if (error) {
      logger.error(`Error starting Eureka client for Notification: ${error.message}`);
    } else {
      logger.info('Notification service registered with Eureka successfully! ✅');
    }
  });
});