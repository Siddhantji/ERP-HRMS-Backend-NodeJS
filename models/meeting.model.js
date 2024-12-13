const mongoose = require("mongoose")


const meetingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    reminder:{
      type: Number,
      required: true, // Use Date type, but we will only manipulate minutes
    },
    organizer:{
      id:String,
      name:String
    },
    participants: [
      {
        type: String,
        required: true
      }
    ],
    date: { type: Date, required: true },
    time:{type:String,required:true},
    location: { type: String },
    status:{type:String,
      enum:['Pending','Completed',"Canceled"],
      default:'Pending'
    },
    description: { type: String, trim: true },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
  }, {
    timestamps: true // Adds createdAt and updatedAt fields
  });
  
  const Meeting = mongoose.model('Meeting', meetingSchema);
  
  module.exports = Meeting;
  