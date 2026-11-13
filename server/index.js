/**
 * AI Workflow Platform Backend Entry Point
 * 
 * BOOT ORDER:
 * 1. Environment Variables Loading: dotenv is loaded first to make variables available to all config / imports.
 * 2. Database Connection Initialization: Configures and initializes connection to MongoDB using Mongoose.
 * 3. Express Application Instantiation: Instantiates standard express app.
 * 4. Middleware Registration: Registers global middlewares (cors, express.json, logger).
 * 5. Route Mounting: Mounts authentication, health, chat, PDF (RAG), prompts, content generator, and resume APIs.
 * 6. Wildcard Fallback Route: Responds with a 404 AppError for unregistered routes.
 * 7. Global Error Handler Middleware: Handles all operational and unhandled throw calls gracefully.
 * 8. Server Listen: Server starts listening on specified port.
 */

// 1. Environment Variables Loading
require('dotenv').config();

const express = require('express');
const cors = require('cors');
// const connectDB = require('./config/db');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const promptRoutes = require('./routes/promptRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const contentRoutes = require('./routes/contentRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const jobAgentRoutes = require('./routes/jobAgentRoutes');
const classManagerRoutes = require('./routes/classManagerRoutes');

// 2. Database Connection Initialization (Disabled MongoDB, using PostgreSQL)
// connectDB();

// 3. Express Application Instantiation
const app = express();

// 4. Middleware Registration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log incoming requests in dev mode
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// 5. Route Mounting
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/job-agent', jobAgentRoutes);
app.use('/api/class-manager', classManagerRoutes);

// Dynamic Stats Route for dashboard counters
const { protect } = require('./middleware/authMiddleware');
const { successResponse } = require('./utils/apiResponse');
// Mongoose models disabled (using PostgreSQL)
// const Chat = require('./models/chatModel');
// const Document = require('./models/documentModel');
// const Prompt = require('./models/promptModel');

app.get('/api/dashboard/stats', protect, async (req, res, next) => {
  try {
    const db = require('./config/pgDb');
    
    const chatsRes = await db.query('SELECT COUNT(*) FROM chats WHERE user_id = $1', [req.user.id]);
    const promptsRes = await db.query('SELECT COUNT(*) FROM prompts WHERE user_id = $1', [req.user.id]);
    
    const chatsCount = Number(chatsRes.rows[0].count);
    const docsCount = 0; // Document model disabled
    const promptsCount = Number(promptsRes.rows[0].count);

    // Mock workflows list
    const mockWorkflows = [
      { id: 'w1', name: 'Document Summarizer Pipeline', status: 'idle', runs: 24, lastRun: '10 mins ago' },
      { id: 'w2', name: 'Slack Sentiment Notification Router', status: 'idle', runs: 156, lastRun: '2 hours ago' },
      { id: 'w3', name: 'Lead Enrichment Sync', status: 'failed', runs: 8, lastRun: 'Yesterday' }
    ];

    // Read metric counts and return stats
    const stats = {
      workflows: mockWorkflows,
      metrics: {
        totalRuns: chatsCount + docsCount * 2 + promptsCount,
        successRate: 95.7,
        averageExecutionTime: '1.2s',
        apiUsagePercentage: 42
      },
      counts: {
        chats: chatsCount,
        documents: docsCount,
        prompts: promptsCount + 4, // 4 system presets
      }
    };

    return successResponse(res, 'Dashboard statistics fetched successfully', stats);
  } catch (err) {
    next(err);
  }
});

// 6. Wildcard Fallback Route
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 7. Global Error Handler Middleware
app.use(errorHandler);

// 8. Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
