const winston = require('winston');
const LogstashTransport = require('winston-logstash-transport').LogstashTransport;

const logger = winston.createLogger({
    level: 'info',
    defaultMeta: {
        service_name: 'notificationStockService',
        app: 'service-notification'
    },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        }),
        new LogstashTransport({
            host: 'localhost',
            port: 5044
        })
    ]
});

module.exports = logger;

