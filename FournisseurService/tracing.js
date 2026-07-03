// tracing.js
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');

const zipkinExporter = new ZipkinExporter({
    url: 'http://zipkin:9411/api/v2/spans',
    serviceName: 'service-fournisseur'
});

// 2. Initialisation du Tracer Provider
const provider = new NodeTracerProvider();

// 3. Ajouter le processeur de spans (Batch pour la performance)
provider.addSpanProcessor(new BatchSpanProcessor(zipkinExporter));

// 4. Enregistrer le provider globalement
provider.register();

registerInstrumentations({
    instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new PgInstrumentation(),
    ],
    tracerProvider: provider,
});

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
