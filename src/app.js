const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const attachIo = require('./middleware/attachIo.middleware');
const errorHandler = require('./middleware/error.middleware');
const { clientOrigins } = require('./config/env');

const createApp = (io) => {
  const app = express();

  app.use(cors({ origin: clientOrigins, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachIo(io));

  app.get('/', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
  });

  app.use('/api', routes);

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
