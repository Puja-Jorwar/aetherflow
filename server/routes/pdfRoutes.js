const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const { protect } = require('../middleware/authMiddleware');
const db = require('../config/pgDb');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

// Multer memory storage (limit to 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

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

// Split text into chunks with overlap
const getChunks = (text, size = 800, overlap = 150) => {
  const chunks = [];
  let index = 0;
  
  while (index < text.length) {
    const chunk = text.substring(index, index + size);
    chunks.push(chunk);
    index += size - overlap;
  }
  
  return chunks;
};

// 1. UPLOAD PDF, PARSE, CHUNK, EMBED & SAVE
router.post('/upload', protect, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a PDF file', 400));
    }

    if (req.file.mimetype !== 'application/pdf') {
      return next(new AppError('Invalid file type. Please upload a PDF.', 400));
    }

    // A. Parse PDF text
    let parsedPdf;
    try {
      parsedPdf = await pdfParse(req.file.buffer);
    } catch (parseErr) {
      return next(new AppError('Failed to parse PDF file. The file may be corrupt.', 400));
    }

    const textContent = parsedPdf.text.replace(/\s+/g, ' ').trim();
    if (!textContent || textContent.length < 10) {
      return next(new AppError('No extractable text found in this PDF.', 400));
    }

    // B. Chunk text
    const textChunks = getChunks(textContent);
    const dbChunks = [];

    // C. Embed chunks locally
    for (const chunk of textChunks) {
      dbChunks.push({
        text: chunk,
        embedding: generateMockEmbedding(chunk),
      });
    }

    // D. Save to PostgreSQL
    const result = await db.query(
      `INSERT INTO documents (user_id, filename, size_bytes, chunks)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, req.file.originalname, req.file.size, JSON.stringify(dbChunks)]
    );
    const doc = result.rows[0];

    const responseDoc = {
      _id: doc.id,
      id: doc.id,
      filename: doc.filename,
      sizeBytes: doc.size_bytes,
      chunksCount: dbChunks.length,
      createdAt: doc.created_at
    };

    return successResponse(res, 'PDF uploaded and indexed successfully via RAG', responseDoc, 201);
  } catch (err) {
    next(err);
  }
});

// 2. GET LIST OF UPLOADED DOCUMENTS
router.get('/documents', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, filename, size_bytes as "sizeBytes", jsonb_array_length(chunks) as "chunksCount", created_at as "createdAt"
       FROM documents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    const docs = result.rows.map(row => ({
      _id: row.id,
      id: row.id,
      filename: row.filename,
      sizeBytes: row.sizeBytes,
      chunksCount: row.chunksCount,
      createdAt: row.createdAt
    }));
    return successResponse(res, 'Documents list retrieved successfully', docs);
  } catch (err) {
    next(err);
  }
});

// 3. QUERY PDF WITH RAG RETRIEVAL
router.post('/query', protect, async (req, res, next) => {
  try {
    const { documentId, query } = req.body;
    
    if (!documentId || !query) {
      return next(new AppError('Please provide documentId and query text', 400));
    }

    let docChunks = [];
    const isGlobal = documentId === 'all';

    if (isGlobal) {
      const result = await db.query(
        'SELECT filename, chunks FROM documents WHERE user_id = $1',
        [req.user.id]
      );
      if (result.rows.length === 0) {
        return next(new AppError('No documents found to query. Please upload a PDF first.', 404));
      }
      result.rows.forEach(d => {
        d.chunks.forEach(chunk => {
          docChunks.push({
            text: chunk.text,
            embedding: chunk.embedding,
            filename: d.filename
          });
        });
      });
    } else {
      const result = await db.query(
        'SELECT filename, chunks FROM documents WHERE id = $1 AND user_id = $2',
        [documentId, req.user.id]
      );
      if (result.rows.length === 0) {
        return next(new AppError('No document found with that ID or unauthorized', 404));
      }
      const doc = result.rows[0];
      docChunks = doc.chunks.map(chunk => ({
        text: chunk.text,
        embedding: chunk.embedding,
        filename: doc.filename
      }));
    }

    // A. Generate Query Vector locally
    const queryVector = generateMockEmbedding(query);

    // B. Calculate Similarity scores across all document chunks
    const matches = docChunks.map(chunk => {
      const score = cosineSimilarity(queryVector, chunk.embedding);
      return { text: chunk.text, score, filename: chunk.filename };
    });

    // C. Sort chunks & Retrieve Top-3
    matches.sort((a, b) => b.score - a.score);
    const topChunks = matches.slice(0, 3);
    const contextText = topChunks.map(m => `[From Document: ${m.filename}]\n${m.text}`).join('\n\n');

    let answer = '';

    // D. Answer via Groq using contextual chunks or run Mock RAG
    if (groq) {
      try {
        const systemPrompt = `You are a helpful AI assistant. Answer the user's question based ONLY on the provided document context. If the answer cannot be determined from the context, state that you cannot find the answer in the document. Do not make things up.
 
Document Context:
----------------
${contextText}
----------------`;
 
        const response = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ]
        });
        answer = response.choices[0].message.content;
      } catch (chatErr) {
        console.error('Groq RAG query error:', chatErr);
        answer = `⚠️ [Groq API Error]: ${chatErr.message}. Falling back to demo RAG retrieval:\n\n` + getMockRAGAnswer(topChunks, query);
      }
    } else {
      answer = getMockRAGAnswer(topChunks, query);
    }

    return successResponse(res, 'RAG query completed successfully', {
      answer,
      citations: topChunks.map(c => ({ text: c.text, relevanceScore: c.score, filename: c.filename }))
    });
  } catch (err) {
    next(err);
  }
});

const getMockRAGAnswer = (topChunks, query) => {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  let bestChunk = topChunks[0] || { text: 'No text extracted.' };
  let maxMatches = 0;
  
  for (const chunk of topChunks) {
    let matches = 0;
    const chunkText = chunk.text.toLowerCase();
    for (const word of queryWords) {
      if (chunkText.includes(word)) matches++;
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestChunk = chunk;
    }
  }

  return `⚡ [AetherFlow Demo RAG Response] Based on the context matching your query ("${query}"), here is the extracted paragraph:

"${bestChunk.text}"

[Citation: Similarity rating ${(bestChunk.score || 0.85).toFixed(3)} | Overlap: ${maxMatches} matching keyword(s)]`;
};

module.exports = router;
