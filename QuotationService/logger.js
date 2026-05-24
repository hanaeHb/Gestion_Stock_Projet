const winston = require('winston');
const LogstashTransport = require('winston-logstash-transport').LogstashTransport;

const logger = winston.createLogger({
    level: 'info',
    defaultMeta: {
        service_name: 'QuotationService',
        app: 'quotation-service'
    },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        }),
        new LogstashTransport({
            host: 'logstash-service',
            port: 5044
        })
    ]
});

module.exports = logger;

