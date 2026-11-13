const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  question: { type: String, required: true },
  aiResponse: { type: String },
  resolved: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Doubt', doubtSchema);
