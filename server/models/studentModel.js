const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Tenant Owner
  studentName: { type: String, required: true },
  parentName: { type: String },
  parentPhone: { type: String, required: true },
  email: { type: String },
  admissionNumber: { type: String, required: true },
  joinedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Suspended', 'Completed'], default: 'Active' }
}, { timestamps: true });

// Compound index to ensure uniqueness of admissionNumber per user/tenant
studentSchema.index({ userId: 1, admissionNumber: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
