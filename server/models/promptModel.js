const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // null for global presets
  },
  title: {
    type: String,
    required: [true, 'Prompt must have a title'],
    trim: true,
  },
  promptText: {
    type: String,
    required: [true, 'Prompt must contain prompt text'],
  },
  category: {
    type: String,
    enum: ['General', 'Marketing', 'Development', 'Productivity', 'Writing'],
    default: 'General',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Prompt = mongoose.model('Prompt', promptSchema);
module.exports = Prompt;
