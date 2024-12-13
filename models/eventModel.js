const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventTitle: {
    type: String,
    required: true,
  },
  eventDescription: {
    type: String,
    required: true,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String, // You can use 'Date' type as well if you want a full datetime value
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  organizer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
   // enum: ['Conference', 'Meetup', 'Workshop', 'Seminar', 'Other'], // Customize categories as needed
  },
});

module.exports = mongoose.model('Event', eventSchema);