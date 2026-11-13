const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const db = require('../config/pgDb');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/apiResponse');
const { OpenAI } = require('openai');

const router = express.Router();

const groq = process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_')
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    })
  : null;

const mapChat = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    title: row.title,
    messages: row.messages || [],
    createdAt: row.created_at
  };
};

const getMockResponse = (message) => {
  const msg = message.toLowerCase();
  
  if (msg.includes('email')) {
    return `⚡ [AetherFlow Demo Response] Here is a professional internship email draft:

Subject: Application for Software Engineering Internship - [Your Name]

Dear Hiring Team,

I am writing to express my interest in the Software Engineering Internship position at your company. As a computer science student with hands-on experience building full-stack applications (such as a multi-agent AI productivity platform built with React, Node, and PostgreSQL), I am eager to contribute to your engineering goals.

In my recent projects, I developed:
• Scalable backend architectures with Express.js and PostgreSQL.
• RAG-based search services matching embeddings against documents.
• Premium, glassmorphic dashboard layouts using Tailwind CSS.

I would love the opportunity to discuss how my skill set aligns with your team's needs. Thank you for your time and consideration.

Best regards,
[Your Name]
[Your Phone]
[Your GitHub Link]`;
  }
  
  if (msg.includes('linkedin') || msg.includes('post') || msg.includes('tweet')) {
    return `⚡ [AetherFlow Demo Response] Here is an engaging LinkedIn post template:

🚀 How do you move from building "basic chatbots" to engineering scalable "AI workflow automation engines"?

This week, I focused on implementing Retrieval-Augmented Generation (RAG) from scratch. Here's the pipeline:
1️⃣ Text extraction from PDF documents using Node.
2️⃣ Splitting paragraphs into optimized semantic chunks.
3️⃣ Generating vector embeddings.
4️⃣ Storing and performing cosine similarity lookups inside PostgreSQL.

The result? An AI agent that answers queries using ONLY custom document context. No generic training data, no hallucinations—just high-context answers.

Check out my portfolio project "AetherFlow" if you're interested in full-stack AI orchestration!

#AI #WebDevelopment #SoftwareEngineering #PostgreSQL #React`;
  }

  if (msg.includes('summarize')) {
    return `⚡ [AetherFlow Demo Response] Here is a structured summary of the text:

• **Primary Goal:** Consolidate data into actionable insights.
• **Core Action Item:** Build out modular route segments (Auth, Chats, Prompts, RAG PDFs).
• **Technical Focus:** Attach authentication guards to protect workspace details.
• **Outcome:** Accelerated workflow pipelines that boost user productivity.`;
  }

  return `⚡ [AetherFlow Demo Response] Hello! I am your AetherFlow AI assistant. 

Since no Groq API key was configured in the server's \`.env\` file, I am running in **Interactive Demo Mode**. 

Try asking me to:
• "Write an **email** for my internship application"
• "Draft a **LinkedIn post** about AI development"
• "**Summarize** my meeting notes"

Once you copy \`.env.example\` to \`.env\` and add your \`GROQ_API_KEY\`, I will automatically switch to live Llama completions!`;
};

// GET ALL CHATS FOR LOGGED-IN USER
router.get('/', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM chats WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    const chats = result.rows.map(mapChat);
    return successResponse(res, 'Chats retrieved successfully', chats);
  } catch (err) {
    next(err);
  }
});

// CREATE NEW CHAT
router.post('/', protect, async (req, res, next) => {
  try {
    const { title } = req.body;
    const result = await db.query(
      `INSERT INTO chats (user_id, title, messages)
       VALUES ($1, $2, '[]'::jsonb) RETURNING *`,
      [req.user.id, title || 'New Conversation']
    );
    return successResponse(res, 'Chat created successfully', mapChat(result.rows[0]), 201);
  } catch (err) {
    next(err);
  }
});

// GET SINGLE CHAT HISTORY
router.get('/:id', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM chats WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return next(new AppError('No chat found with that ID', 404));
    }
    return successResponse(res, 'Chat retrieved successfully', mapChat(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// SEND MESSAGE & GET AI RESPONSE
router.post('/:id/messages', protect, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return next(new AppError('Message content cannot be empty', 400));
    }

    const result = await db.query(
      'SELECT * FROM chats WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return next(new AppError('No chat found with that ID', 404));
    }
    const chat = result.rows[0];
    const messages = chat.messages || [];

    // 1. Add User Message
    messages.push({
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    });

    let reply = '';

    // 2. Call Groq or Fallback to Mock
    if (groq) {
      try {
        const groqMessages = [
          { role: 'system', content: 'You are AetherFlow, a premium AI productivity assistant designed to help with email drafting, content generation, document analysis, and prompt engineering.' },
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        ];

        const response = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: groqMessages
        });
        reply = response.choices[0].message.content;
      } catch (err) {
        console.error('Groq Error:', err);
        reply = `⚠️ [Groq API Error]: ${err.message}. Falling back to demo mode:\n\n${getMockResponse(content)}`;
      }
    } else {
      reply = getMockResponse(content);
    }

    // 3. Add Assistant Message
    messages.push({
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString()
    });

    // 4. Dynamically update chat title if it's the first message
    let title = chat.title;
    if (title === 'New Conversation' || title === 'New Chat') {
      title = content.length > 30 ? content.substring(0, 27) + '...' : content;
    }

    // 5. Update DB
    const updateResult = await db.query(
      'UPDATE chats SET messages = $1, title = $2 WHERE id = $3 RETURNING *',
      [JSON.stringify(messages), title, chat.id]
    );

    return successResponse(res, 'Message processed successfully', {
      chat: mapChat(updateResult.rows[0]),
      reply
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
