const mongoose = require("mongoose")

const calendarSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true },
    holidays: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Holiday' }],
    leaves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Leave' }],
    meetings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' }],
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
  });
  
  const Calendar = mongoose.model('Calendar', calendarSchema);

  module.exports = Calendar;
  