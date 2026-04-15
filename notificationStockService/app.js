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
const emailService = require('./Service/emailService');

const app = express();
const PORT = 5003;

// Eureka
const client = new Eureka({
  instance: {
    app: 'service-notification',
    hostName: 'localhost', 
    ipAddr: '127.0.0.1',
    statusPageUrl: `http://localhost:${PORT}/info`,
    healthCheckUrl: `http://localhost:${PORT}/health`,
    port: {
      '$': PORT,
      '@enabled': 'true',
    },
    vipAddress: 'service-notification',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
  },
  eureka: {
    host: 'localhost',
    port: 8761,
    servicePath: '/eureka/apps/',
  },
});



app.get('/health', (req, res) => {
  res.send({ status: 'UP' });
});

app.use('/uploads/cv', express.static(path.join(__dirname, 'uploads/cv')));

// Route CV download
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
  brokers: ["localhost:9092"]
});
const consumer = kafka.consumer({ groupId: "notification-group" });

const runKafkaConsumer = async () => {
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
      
      if (topic === "low-stock-alert") {
        await Notification.create({
          message: `⚠️ Alerte Stock: Le produit "${event.nom}" a atteint son seuil critique (${event.quantiteActuelle} restants). Veuillez informer le responsable d'achat.`,
          niveau: "ERROR",
          statut: "NON_LUE",
          type: "STOCK_ALERT",
          dateAlerte: new Date()
        });
        console.log("✅ Alerte stock enregistrée");
      }
      
      if (topic === 'replenishment-requested') {
        const newRequest = new Notification({
          message: `Demand: ${event.productName} (${event.category}) requested by ${event.fromManager}`,
          productName: event.productName,
          productId: event.productId,
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
          statut: "NON_LUE"
        });

        await emailService.sendEmail(
            event.email,
            "Account Pending Verification",
            "Your account is currently under review. We will notify you once it has been approved."
        );
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
      }
      else if (topic === "order-notifications") {
        const { email, product, productId, quantity, orderId, message } = event;

        await Notification.create({
          message: message || `Nouvelle commande: ${quantity}x ${product}`,
          orderId: orderId,
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

runKafkaConsumer().catch(console.error);

// 4. Start server & Register with Eureka
app.listen(PORT, () => {
  console.log(`Notification microservice running on port ${PORT}`);

  client.start((error) => {
    if (error) {
      console.log('Error starting Eureka client:', error);
    } else {
      console.log('Notification service registered with Eureka! ✅');
    }
  });
});