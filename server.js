const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/config/logger');

const PORT = config.port || 3000;

const server = app.listen(PORT, () => {
  logger.info(Server running on port  in  mode);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = server;
