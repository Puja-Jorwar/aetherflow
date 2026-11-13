const express = require('express');
const { OpenAI } = require('openai');
const { protect } = require('../middleware/authMiddleware');
const Document = require('../models/documentModel');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

const groq = process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_')
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    })
  : null;

// Helper to generate normalized deterministic mock embeddings for dev fallback
const generateMockEmbedding = (text) => {
  const vec = [];
  for (let i = 0; i < 1536; i++) {
    let val = 0;
    for (let j = 0; j < Math.min(text.length, 50); j++) {
      val += text.charCodeAt(j) * Math.sin(i + j);
    }
    vec.push(Math.sin(val));
  }
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map(v => v / (magnitude || 1));
};

// Helper for Cosine Similarity (Dot product of normalized vectors)
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
};

// Asynchronous RAG query solver
const runRAGQuery = async (queryText) => {
  try {
    const docs = await Document.find({});
    if (!docs || docs.length === 0) {
      return "I couldn't find any uploaded documents in my database. Please upload a PDF first in the dashboard.";
    }

    const queryVector = generateMockEmbedding(queryText);
    let docChunks = [];

    docs.forEach(d => {
      d.chunks.forEach(chunk => {
        docChunks.push({
          text: chunk.text,
          embedding: chunk.embedding,
          filename: d.filename
        });
      });
    });

    const matches = docChunks.map(chunk => {
      const score = cosineSimilarity(queryVector, chunk.embedding);
      return { text: chunk.text, score, filename: chunk.filename };
    });

    matches.sort((a, b) => b.score - a.score);
    const topChunks = matches.slice(0, 3);
    const contextText = topChunks.map(m => `[From Document: ${m.filename}]\n${m.text}`).join('\n\n');

    if (groq) {
      const systemPrompt = `You are a helpful AI assistant. Answer the user's question based ONLY on the provided document context. If the answer cannot be determined from the context, state that you cannot find the answer. Do not make things up.
 
Document Context:
----------------
${contextText}
----------------`;
 
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: queryText }
        ]
      });
      return response.choices[0].message.content;
    } else {
      return `[Mock Offline Answer for: "${queryText}"]\nBased on matched context from ${topChunks[0].filename}: "${topChunks[0].text}"`;
    }
  } catch (err) {
    console.error('RAG process failed in integrations', err);
    return `Error processing request: ${err.message}`;
  }
};

// 1. Fetch Slack channels list
router.get('/slack/channels', protect, async (req, res, next) => {
  try {
    const token = process.env.SLACK_BOT_TOKEN;

    if (!token || token.includes('your_')) {
      const devChannels = [
        { id: 'C123', name: '#general' },
        { id: 'C456', name: '#random' },
        { id: 'C789', name: '#aetherflow-notifications' }
      ];
      return successResponse(res, 'Fetched mock Slack channels (token not set)', devChannels);
    }

    const response = await fetch('https://slack.com/api/conversations.list?types=public_channel', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!data.ok) {
      return next(new AppError(`Slack API Error: ${data.error}`, 400));
    }

    const channels = data.channels.map(ch => ({
      id: ch.id,
      name: `#${ch.name}`
    }));

    return successResponse(res, 'Fetched Slack channels successfully', channels);
  } catch (err) {
    next(err);
  }
});

// 2. Slack Events API listener (Public route)
router.post('/slack/events', async (req, res, next) => {
  try {
    const { type, challenge, event } = req.body;

    if (type === 'url_verification') {
      return res.status(200).send(challenge);
    }

    if (event && event.type === 'app_mention') {
      const channel = event.channel;
      const originalText = event.text || '';
      const cleanText = originalText.replace(/<@[^>]+>/g, '').trim();

      // Slack demands 200 OK within 3 seconds. Send response first to prevent retries.
      res.status(200).send({ ok: true });

      // Run search and post reply asynchronously
      (async () => {
        const answer = await runRAGQuery(cleanText);
        const token = process.env.SLACK_BOT_TOKEN;
        
        if (token && !token.includes('your_')) {
          await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              channel: channel,
              text: `👋 Hello! Here is the answer to your query:\n\n${answer}`,
              thread_ts: event.ts
            })
          });
        } else {
          console.log(`[Slack Event Bot Mock Reply to channel ${channel}]: ${answer}`);
        }
      })().catch(console.error);

      return;
    }

    return res.status(200).send({ ok: true });
  } catch (err) {
    next(err);
  }
});

// 3. Slack Slash Command router (Public route)
router.post('/slack/command', async (req, res, next) => {
  try {
    const { text, response_url } = req.body;

    if (!text) {
      return res.status(200).send({
        response_type: 'ephemeral',
        text: 'Please provide a search query. E.g. `/ask-aetherflow What is the status of the project?`'
      });
    }

    res.status(200).send({
      response_type: 'ephemeral',
      text: '⏳ *AetherFlow RAG Engine:* Searching indexed documents and compiling answer...'
    });

    (async () => {
      const answer = await runRAGQuery(text);

      if (response_url) {
        await fetch(response_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            response_type: 'in_channel',
            text: `🔍 *AetherFlow RAG Answer for:* "${text}"\n\n${answer}`
          })
        });
      }
    })().catch(console.error);

  } catch (err) {
    next(err);
  }
});

// 4. Forward content to Slack webhook
router.post('/slack', protect, async (req, res, next) => {
  try {
    const { webhookUrl, text } = req.body;

    if (!webhookUrl || !text) {
      return next(new AppError('Please provide webhookUrl and text content', 400));
    }

    const payload = {
      text: text,
      username: 'AetherFlow Bot',
      icon_emoji: ':zap:'
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return next(new AppError(`Slack Webhook Error: ${errorText}`, response.status));
    }

    return successResponse(res, 'Successfully posted message to Slack channel', null);
  } catch (err) {
    next(err);
  }
});

// 5. Forward content to Discord webhook
router.post('/discord', protect, async (req, res, next) => {
  try {
    const { webhookUrl, text } = req.body;

    if (!webhookUrl || !text) {
      return next(new AppError('Please provide webhookUrl and text content', 400));
    }

    let discordContent = text;
    if (discordContent.length > 2000) {
      discordContent = discordContent.substring(0, 1990) + '...';
    }

    const payload = {
      content: discordContent,
      username: 'AetherFlow Bot'
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return next(new AppError(`Discord Webhook Error: ${errorText}`, response.status));
    }

    return successResponse(res, 'Successfully posted message to Discord channel', null);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
