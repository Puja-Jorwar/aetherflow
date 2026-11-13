const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

let activeRun = {
  status: 'idle', // 'idle' | 'running' | 'completed' | 'failed'
  logs: [],
  appliedCount: 0,
  currentJob: '',
  platform: '',
  startTime: null
};

// Log helper
const addLog = (msg) => {
  const timestamp = new Date().toLocaleTimeString();
  activeRun.logs.push(`[${timestamp}] ${msg}`);
};

const simulateAgentRun = async (jobTitle, location, platform, email) => {
  try {
    activeRun.status = 'running';
    activeRun.startTime = Date.now();
    activeRun.appliedCount = 0;
    activeRun.platform = platform;
    activeRun.logs = [];

    const platformName = platform === 'naukri' ? 'Naukri.com' : 'Indeed.com';
    
    addLog(`🚀 Spawning headless Chromium instance (Puppeteer agent)...`);
    await new Promise(r => setTimeout(r, 1500));
    
    addLog(`🔒 Navigating to secure ${platformName} login portal...`);
    await new Promise(r => setTimeout(r, 1500));

    addLog(`🔑 Authenticating user account: ${email || 'portfolio-demo@aetherflow.io'}...`);
    await new Promise(r => setTimeout(r, 1800));
    addLog(`✅ Session established. Authentication cookies stored in memory cache.`);
    await new Promise(r => setTimeout(r, 1000));

    addLog(`🔍 Executing job directory lookup: Query="${jobTitle}", Location="${location || 'Remote'}"...`);
    await new Promise(r => setTimeout(r, 2000));

    const sampleJobs = [
      { title: `${jobTitle} Role`, company: 'TechSolutions Global' },
      { title: `Full-Stack Developer`, company: 'Innovate Systems' },
      { title: `Software Engineer (React/Node)`, company: 'PixelCraft Labs' }
    ];

    for (let i = 0; i < sampleJobs.length; i++) {
      const job = sampleJobs[i];
      activeRun.currentJob = `${job.title} at ${job.company}`;
      
      addLog(`📄 Navigating to matching listing: "${job.title}" by ${job.company}...`);
      await new Promise(r => setTimeout(r, 1500));

      addLog(`🖱️ Activating Easy Apply form element parser...`);
      await new Promise(r => setTimeout(r, 1200));

      addLog(`📋 Form Schema parsed. Extracting questions...`);
      await new Promise(r => setTimeout(r, 1500));

      addLog(`✍️ Injecting details: Name, Email, Resume text, and Portfolio links...`);
      await new Promise(r => setTimeout(r, 1800));

      addLog(`🤖 Captcha verification solved via background solver.`);
      await new Promise(r => setTimeout(r, 1500));

      addLog(`✅ Application submitted successfully for ${job.title}!`);
      activeRun.appliedCount += 1;
      await new Promise(r => setTimeout(r, 1200));
    }

    activeRun.status = 'completed';
    activeRun.currentJob = '';
    addLog(`🏁 Headless browser closed. Automated run finished successfully!`);
  } catch (err) {
    activeRun.status = 'failed';
    addLog(`❌ Heuristic Error encountered: ${err.message}`);
  }
};

// GET status endpoint
router.get('/status', protect, (req, res) => {
  return successResponse(res, 'Fetched job agent status successfully', activeRun);
});

// POST start run endpoint
router.post('/run', protect, (req, res, next) => {
  const { jobTitle, location, platform, email } = req.body;

  if (!jobTitle || !platform) {
    return next(new AppError('Please provide jobTitle and platform parameters', 400));
  }

  if (activeRun.status === 'running') {
    return next(new AppError('Another job application pipeline is already running', 400));
  }

  // Trigger background simulation (doesn't block the request response)
  simulateAgentRun(jobTitle, location, platform, email).catch(console.error);

  return successResponse(res, 'Job Application automation agent spawned successfully', {
    status: 'running'
  });
});

module.exports = router;
