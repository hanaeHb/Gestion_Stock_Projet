const express = require('express');
const cors = require('cors');
const path = require('path');
const Eureka = require('eureka-js-client').Eureka;
const fournisseurRoutes = require('./routes/fournisseur');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const clien = require('prom-client');
const logger = require('./logger');

const app = express();
const PORT = 5000;

const collectDefaultMetrics = clien.collectDefaultMetrics;
collectDefaultMetrics({ register: clien.register });

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', clien.register.contentType);
    res.end(await clien.register.metrics());
  } catch (ex) {
    logger.error(` Prometheus Metrics Error f Fournisseur: ${ex.message || ex}`);
    res.status(500).end(ex);
  }
});



// Configuration Eureka
const client = new Eureka({
  instance: {
    app: 'service-fournisseur',
    hostName: 'service-fournisseur', // Smiya f Kubernetes
    ipAddr: 'service-fournisseur',
    statusPageUrl: `http://service-fournisseur:${PORT}/api/info`,
    healthCheckUrl: `http://service-fournisseur:${PORT}/health`,
    port: {
      '$': PORT,
      '@enabled': 'true',
    },
    vipAddress: 'service-fournisseur',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
  },
  eureka: {
    host: process.env.EUREKA_HOST || 'discovery-service',
    port: 8761,
    servicePath: '/eureka/apps/',
  },
});

/*const client = new Eureka({
  instance: {
    app: 'service-fournisseur',
    hostName: 'localhost',      // Trje3 localhost
    instanceId: `service-fournisseur:${PORT}`,
    ipAddr: '127.0.0.1',        // Trje3 IP local
    statusPageUrl: `http://localhost:${PORT}/api/info`,
    healthCheckUrl: `http://localhost:${PORT}/health`,
    port: {
      '$': PORT,
      '@enabled': 'true',
    },
    vipAddress: 'service-fournisseur',
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
});*/

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Static Files & Routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', fournisseurRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.send({ status: 'UP' });
});

// Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Fournisseur Microservice', version: '1.0.0' },
    servers: [{ url: `http://localhost:${PORT}/api` }]
  },
  apis: ['./routes/*.js']
};
const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Start server
app.listen(PORT, () => {
  logger.info(`Fournisseur microservice running on port ${PORT}`);

  client.start((error) => {
    if (error) {
      logger.error(`Error starting Eureka client for Fournisseur Service: ${error.message}`);
    } else {
      logger.info('Fournisseur service registered with Eureka successfully! ✅');
    }
  });
});