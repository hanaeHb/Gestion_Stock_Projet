const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Eureka = require('eureka-js-client').Eureka;
const commandeRoutes = require('./routes/commande');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { connectKafka } = require('./kafkaConfig');
const path = require('path');

const app = express();
const PORT = 5001;

// Eureka Client
const client = new Eureka({
  instance: {
    app: 'service-commande',
    hostName: 'localhost',
    instanceId: `service-commande:${PORT}`,
    ipAddr: '127.0.0.1',
    statusPageUrl: `http://localhost:${PORT}/info`,
    healthCheckUrl: `http://localhost:${PORT}/health`,
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
    host: 'localhost',
    port: 8761,
    servicePath: '/eureka/apps/',
  },
});

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