const mongoose = require('mongoose');

const classLeadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  parentPhone: { type: String, required: true },
  email: { type: String },
  courseOfInterest: { type: String, required: true },
  source: { type: String, enum: ['Google Business', 'Facebook Ads', 'Website', 'Walk-in'], default: 'Website' },
  status: { type: String, enum: ['New', 'Contacted', 'Demo Scheduled', 'Enrolled'], default: 'New' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ClassLead', classLeadSchema);
