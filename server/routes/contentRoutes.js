const express = require('express');
const { protect } = require('../middleware/authMiddleware');
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

router.post('/generate', protect, async (req, res, next) => {
  try {
    const { contentType, tone, keywords, topic } = req.body;
    
    if (!contentType || !topic) {
      return next(new AppError('Please provide a contentType and topic', 400));
    }

    const keywordList = keywords ? keywords.split(',').map(k => k.trim()) : [];
    
    let generatedContent = '';

    if (groq) {
      try {
        const systemPrompt = `You are a professional AI Content Writer. Generate a highly polished, engaging piece of content.
Content Type: ${contentType}
Tone: ${tone || 'Professional'}
Keywords to incorporate: ${keywordList.join(', ') || 'None'}`;

        const prompt = `Write content about: "${topic}"`;

        const response = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        });
        generatedContent = response.choices[0].message.content;
      } catch (err) {
        console.error('Groq Error in content generation:', err);
        generatedContent = `⚠️ [Groq API Error]: ${err.message}. Falling back to demo generator:\n\n` + getMockContent(contentType, tone, topic, keywordList);
      }
    } else {
      generatedContent = getMockContent(contentType, tone, topic, keywordList);
    }

    return successResponse(res, 'Content generated successfully', {
      contentType,
      tone,
      topic,
      content: generatedContent
    });
  } catch (err) {
    next(err);
  }
});

const getMockContent = (type, tone, topic, keywords) => {
  const kwString = keywords.length > 0 ? keywords.map(k => `#${k.replace(/\s+/g, '')}`).join(' ') : '#AetherFlow';
  
  if (type.toLowerCase() === 'linkedin') {
    return `🚀 [AetherFlow Content Generator - LinkedIn Preset (Tone: ${tone})]

Let's talk about: "${topic}"!

In today's fast-paced environment, matching developer velocity with robust software architecture is one of the hardest challenges engineering teams face.

Here are 3 core takeaways:
1️⃣ Automation first: If you do it twice, script it. If you do it three times, agenticize it.
2️⃣ High-context retrieval: Giving models structured vector contexts solves hallucination.
3️⃣ Developer loops: Clean routing and fast reload speeds build premium software.

What are your thoughts on this topic? Let me know in the comments!

${kwString} #Engineering #TechLeadership #FullStack`;
  }

  if (type.toLowerCase() === 'tweet') {
    return `🔥 [AetherFlow Content Generator - Tweet Preset]
    
Struggling to optimize "${topic}"? 

The key is connecting structured pipeline data with AI routing filters. Fast, automated, and zero-headache.

Check out how we built this using React + Node! 👇
${kwString} #buildinpublic #webdev`;
  }

  if (type.toLowerCase() === 'email') {
    return `✉️ [AetherFlow Content Generator - Email Preset]

Dear Team,

I hope this email finds you well.

Regarding our focus on "${topic}", I wanted to share a quick update on how we can streamline our productivity. By introducing modular task pipelines, we can automate key summary steps and keep stakeholders in the loop.

Key points to review:
• Action 1: Extract data chunks directly from PDFs.
• Action 2: Audit text layouts using AI checks.
• Action 3: Dispatch results directly to team webhooks.

Please let me know your thoughts on this approach.

Best regards,
AetherFlow Auto-Draft`;
  }

  return `📝 [AetherFlow Content Generator - ${type} Preset (Tone: ${tone})]

Topic Analysis: "${topic}"

Automating tasks inside this domain requires structuring inputs, parsing relevant segments, and writing templates. By integrating custom filters, users can dynamically shift outputs to match professional expectations.

Keywords references: ${keywords.join(', ') || 'N/A'}`;
};

module.exports = router;
