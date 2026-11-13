const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number], // array of floats (embeddings vectors)
    required: true,
  },
});

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Document must belong to a user'],
  },
  filename: {
    type: String,
    required: [true, 'Document must have a filename'],
  },
  sizeBytes: {
    type: Number,
  },
  chunks: [chunkSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
