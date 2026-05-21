require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Eureka = require('eureka-js-client').Eureka;
const quotationRoutes = require('./routes/quotationRoutes');

const client = require('prom-client');
const app = express();
const PORT = process.env.PORT || 5005;

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });


app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Service running on port ${PORT}`);
});
// --- 1. Middlewares ---
app.use(express.json());

// --- 2. MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quotation_db')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- 3. Eureka Client Setup ---
const eurekaClient = new Eureka({
  instance: {
    app: 'QUOTATION-SERVICE',
    hostName: 'quotation-service',
    ipAddr: 'quotation-service',
    statusPageUrl: `http://quotation-service:${PORT}/info`,
    healthCheckUrl: `http://quotation-service:${PORT}/health`,
    port: { '$': PORT, '@enabled': 'true' },
    vipAddress: 'quotation-service',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn'
    },
  },
  eureka: {
    host: 'discovery-service',
    port: 8761,
    servicePath: '/eureka/apps/',
  },
});

/* eurekaClient = new Eureka({
  instance: {
    app: 'QUOTATION-SERVICE',
    hostName: process.env.HOSTNAME || 'localhost',
    ipAddr: '127.0.0.1',
    port: { '$': PORT, '@enabled': 'true' },
    vipAddress: 'QUOTATION-SERVICE',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn'
    },
  },
  eureka: {
    host: process.env.EUREKA_HOST || 'localhost',
    port: 8761,
    servicePath: '/eureka/apps/',
  },
});*/


app.use('/api/quotations', quotationRoutes);

app.get('/api/quotations/test', (req, res) => {
  res.json({ message: "Quotation Service is UP and Running!" });
});

// --- 5. Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  eurekaClient.start((error) => {
    if (error) {
      console.log('❌ Eureka Registration Failed:', error);
    } else {
      console.log('✅ QUOTATION-SERVICE registered with Eureka');
    }
  });
});