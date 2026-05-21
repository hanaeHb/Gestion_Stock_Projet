const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Eureka = require('eureka-js-client').Eureka;
const commandeRoutes = require('./routes/commande');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { connectKafka } = require('./kafkaConfig');
const path = require('path');
const clien = require('prom-client');

const app = express();
const PORT = 5001;

// 1. تفعيل الـ Metrics الافتراضية بالطريقة الصحيحة والحديثة
clien.collectDefaultMetrics();

// 2. الـ Endpoint مصلحة بالـ Try/Catch والـ Await
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', clien.register.contentType);

    // 🌟 كنجيبو الداتا ف متغير وعاد كنصيفطوها
    const metricsData = await clien.register.metrics();
    res.end(metricsData);

  } catch (error) {
    // 🔥 هاد السطر هو اللي غايطبع ليكِ الخطأ ف الـ Console د كوبرنيتيز يلا وقع مشكل!
    console.error("🚨 Prometheus Metrics Error:", error);
    res.status(500).send(error.message);
  }
});

// Eureka Client
const client = new Eureka({
  instance: {
    app: 'service-commande',
    hostName: 'service-commande',
    instanceId: `service-commande:${PORT}`,
    ipAddr: 'service-commande',
    statusPageUrl: `http://service-commande:${PORT}/info`,
    healthCheckUrl: `http://service-commande:${PORT}/health`,
    port: {
      '$': PORT,
      '@enabled': 'true',
    },
    vipAddress: 'service-commande',
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
});

/*const client = new Eureka({
  instance: {
    app: 'SERVICE-COMMANDE',
    hostName: 'localhost', // Trje3 localhost f blast s-miya d l-pod
    instanceId: `service-commande:${PORT}`,
    ipAddr: '127.0.0.1',   // Trje3 IP local
    statusPageUrl: `http://localhost:${PORT}/info`,
    healthCheckUrl: `http://localhost:${PORT}/health`,
    port: {
      '$': PORT,
      '@enabled': 'true',
    },
    vipAddress: 'SERVICE-COMMANDE',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
  },
  eureka: {
    // Eureka Server li khddam 3ndek f l-PC
    host: 'localhost',
    port: 8761,
    servicePath: '/eureka/apps/',
  },
});*/
// Middleware
app.use(bodyParser.json());

app.use('/invoices', express.static(path.join(__dirname, 'public/invoices')));

// 3. Health Check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'UP' });
});

// Swagger setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Commande Microservice',
      version: '1.0.0',
      description: 'API pour gérer les commandes et lignes de commandes'
    },
    servers: [{ url: `http://localhost:${PORT}/api` }]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', commandeRoutes);

app.listen(PORT, async () => {
  console.log(`Commande microservice running on port ${PORT}`);

  await connectKafka();

  client.start((error) => {
    if (error) {
      console.log('Error starting Eureka client for Commande Service:', error);
    } else {
      console.log('Commande service registered with Eureka successfully! ✅');
    }
  });
});