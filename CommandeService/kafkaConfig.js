const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'service-commande',
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || 'kafka-service:9092']
});

const producer = kafka.producer();

const connectKafka = async () => {
    try {
        await producer.connect();
        console.log("Kafka Producer Connected ✅");
    } catch (error) {
        console.error("Kafka Connection Error ❌", error);
    }
};

module.exports = { producer, connectKafka };