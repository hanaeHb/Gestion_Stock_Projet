// tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { MongooseInstrumentation } = require('@opentelemetry/instrumentation-mongoose');

// 1. Configurer l'exportateur Zipkin
const zipkinExporter = new ZipkinExporter({
    url: 'http://zipkin:9411/api/v2/spans',
    serviceName: 'quotation-service'
});

// 2. Initialiser le SDK complet avec l'exportateur et les instrumentations
const sdk = new NodeSDK({
    serviceName: 'quotation-service',
    traceExporter: zipkinExporter,
    spanProcessor: new BatchSpanProcessor(zipkinExporter),
    instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new MongooseInstrumentation({
            enhancedDatabaseReporting: true,
        }),
    ],
});

// 3. Démarrer le SDK
try {
    sdk.start();
    console.log("🚀 OpenTelemetry SDK Tracing initialisé avec succès !");
} catch (error) {
    console.error("❌ Erreur lors de l'initialisation du Tracing:", error);
}

// Gérer la fermeture propre de l'application
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('Tracing terminé'))
        .catch((error) => console.log('Erreur de fermeture du tracing', error))
        .finally(() => process.exit(0));
});