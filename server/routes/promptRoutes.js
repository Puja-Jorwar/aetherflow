const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const db = require('../config/pgDb');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

// Preset/System default prompts
const SYSTEM_PRESETS = [
  {
    _id: 'preset-1',
    id: 'preset-1',
    title: 'LinkedIn Post Builder',
    promptText: 'Write an engaging, professional LinkedIn post about [Topic] using relevant formatting, emojis, and hashtags. Keep the tone inspiring and highlight key challenges and solutions.',
    category: 'Marketing',
    isPreset: true,
  },
  {
    _id: 'preset-2',
    id: 'preset-2',
    title: 'Professional Email Refiner',
    promptText: 'Refine the following rough text into a polite, clear, and professional email: \n\n"[Input text]"',
    category: 'Writing',
    isPreset: true,
  },
  {
    _id: 'preset-3',
    id: 'preset-3',
    title: 'Python/JS Code Explainer',
    promptText: 'Analyze the following code snippet and explain its functionality step-by-step in simple language. Also point out potential optimizations: \n\n[Insert code]',
    category: 'Development',
    isPreset: true,
  },
  {
    _id: 'preset-4',
    id: 'preset-4',
    title: 'ATS Resume Keyword Matcher',
    promptText: 'Compare my resume skills list: "[Skills]" against this target job description: "[Job Description]". Identify missing keywords and suggest formatting adjustments to bypass ATS screens.',
    category: 'Productivity',
    isPreset: true,
  },
];

// GET ALL PROMPTS
router.get('/', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM prompts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    const userPrompts = result.rows.map(row => ({
      _id: row.id,
      id: row.id,
      title: row.title,
      promptText: row.prompt_text,
      category: row.category,
      createdAt: row.created_at
    }));
    const allPrompts = [...SYSTEM_PRESETS, ...userPrompts];
    return successResponse(res, 'Prompts fetched successfully', allPrompts);
  } catch (err) {
    next(err);
  }
});

// CREATE NEW PROMPT
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, promptText, category } = req.body;
    
    if (!title || !promptText) {
      return next(new AppError('Please provide a title and prompt text', 400));
    }
    
    const result = await db.query(
      `INSERT INTO prompts (user_id, title, prompt_text, category)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, title, promptText, category || 'General']
    );
    const newPrompt = result.rows[0];

    const responsePayload = {
      _id: newPrompt.id,
      id: newPrompt.id,
      title: newPrompt.title,
      promptText: newPrompt.prompt_text,
      category: newPrompt.category,
      createdAt: newPrompt.created_at
    };
    
    return successResponse(res, 'Prompt saved successfully', responsePayload, 201);
  } catch (err) {
    next(err);
  }
});

// DELETE PROMPT
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM prompts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return next(new AppError('No prompt found with that ID or unauthorized', 404));
    }
    
    return successResponse(res, 'Prompt deleted successfully');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
