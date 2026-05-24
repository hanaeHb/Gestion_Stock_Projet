import logging
from logstash_async.handler import AsynchronousLogstashHandler

logger = logging.getLogger('predictionStockService')
logger.setLevel(logging.INFO)

logstash_handler = AsynchronousLogstashHandler(
    host='logstash',
    port=5044,
    database_path='logstash.db'
)

class ServiceNameFilter(logging.Filter):
    def filter(self, record):
        record.service_name = 'predictionStockService'
        return True

logger.addFilter(ServiceNameFilter())
logger.addHandler(logstash_handler)


console_handler = logging.StreamHandler()
logger.addHandler(console_handler)


__all__ = ['logger']