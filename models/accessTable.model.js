// models/accessTableModel.js
const mongoose = require('mongoose');

const accessTableSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  role: { type: String, required: true, enum: ['user', 'admin', 'moderator'] }, // Adjust roles as needed
  allowedPages: [{ type: String }], // List of allowed pages (e.g., ['dashboard', 'settings', 'profile'])
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, {
  timestamps: true
});

const AccessTable = mongoose.model('AccessTable', accessTableSchema);

module.exports = AccessTable;
