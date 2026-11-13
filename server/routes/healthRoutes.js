const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { successResponse } = require('../utils/apiResponse');

router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const healthData = {
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: {
      status: dbStates[dbStatus] || 'Unknown',
      readyState: dbStatus,
    },
  };

  return successResponse(res, 'System is healthy', healthData);
});

module.exports = router;
