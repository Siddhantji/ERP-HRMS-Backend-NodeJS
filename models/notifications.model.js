const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true // Removes extra whitespace from the beginning and end
  },
  message: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, // Reference to a User document
    ref: 'User', // Assuming you have a User model
    required: true
  },
  type: {
    type: String,
    enum: ['reminder', 'alert', 'update', 'info'], // Only allows specific types
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false // By default, the notification is not read
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now // Automatically sets the date when a notification is created
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Set `updatedAt` field to the current date whenever a notification is updated
notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification };
