const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  marksObtained: { type: Number, required: true },
  remarks: { type: String }
});

const examSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  testName: { type: String, required: true },
  subject: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  date: { type: Date, required: true },
  scores: [scoreSchema]
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
