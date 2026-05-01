const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, maxlength: 120 },
  email:   { type: String, required: true, trim: true, maxlength: 254 },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status:  { type: String, enum: ['unread', 'read', 'replied'], default: 'unread' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', ContactSchema);
