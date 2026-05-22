// tracing.js
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { MongooseInstrumentation } = require('@opentelemetry/instrumentation-mongoose'); // Optionnel: ila bghiti t-tracker hta les requêtes m3a MongoDB

// 1. Configurer l'exportateur Zipkin li khdam f Kubernetes (Port 9411)
const zipkinExporter = new ZipkinExporter({
    url: 'http://zipkin:9411/api/v2/spans',
    serviceName: 'quotation-service' // Smiya li ghadi tban lik f Zipkin UI
});

// 2. Initialisation du Tracer Provider
const provider = new NodeTracerProvider();

// 3. Ajouter le processeur de spans (Batch pour la performance)
provider.addSpanProcessor(new BatchSpanProcessor(zipkinExporter));

// 4. Enregistrer le provider globalement
provider.register();

// 5. Activer l'instrumentation automatique pour HTTP, Express et Mongoose
registerInstrumentations({
    instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new MongooseInstrumentation(), // Ghadi t-trace-i hta l-waqt lli kakhdo MongoDB f l-queries
    ],
    tracerProvider: provider,
});

console.log("🚀 OpenTelemetry Tracing initialisé avec succès !");