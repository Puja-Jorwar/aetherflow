const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  courseName: { type: String, required: true },
  timings: { type: String, required: true }, // e.g. "Mon-Wed-Fri 4PM - 6PM"
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);
