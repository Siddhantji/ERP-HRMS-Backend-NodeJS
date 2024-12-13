const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HRMEmployee',
    required: true,
  },
  month: {
    type: String,
    default: new Date().toLocaleString('default', { month: 'long' }) + ' ' + new Date().getFullYear(),
  },
  totalLeavesTaken: { type: Number, default: 0 },
  totalPresent: { type: Number, default: 0 },
  dailyAttendance: [
    {
      date: { type: Date, default: Date.now },
      status: { type: String, enum: ['Present', 'Absent'], required: true },
      leaveType: { type: String, enum: ['None', 'Casual Leave', 'Sick Leave', 'Festival Leave'], default: 'None' },
    },
  ],
},
{timestamps:true}
);

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
