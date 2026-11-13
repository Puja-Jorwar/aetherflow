const mongoose = require('mongoose');

const feeInstallmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Paid', 'Unpaid', 'Overdue'], default: 'Unpaid' },
  razorpayPaymentLinkId: { type: String },
  paidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('FeeInstallment', feeInstallmentSchema);
