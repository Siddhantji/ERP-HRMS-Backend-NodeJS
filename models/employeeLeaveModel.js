const mongoose = require("mongoose");

const LeaveApplicationSchema = new mongoose.Schema({
  appliedDate: {
    type: Date,
    required: true,
  },
  fromDate: {
    type: Date,
    required: true,
  },
  toDate: {
    type: Date,
    required: true,
  },
  leaveType: {
    type: String,
    required: true,
  },
  totalDays: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  applyTo: {
    type: String,
    required: true,
  },
  status: { type: String, enum: ['Approve','Pending', 'Reject'], default: 'Pending'},
  documents: {
    data: { type: String },
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId, // Reference to HRMEmployee's _id
    ref: "HRMEmployee", // Reference the HRMEmployee model
    required: true,
  },
},{timestamps:true});

module.exports = mongoose.model("LeaveApplication", LeaveApplicationSchema);