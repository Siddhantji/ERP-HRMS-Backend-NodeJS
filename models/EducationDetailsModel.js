const mongoose = require("mongoose");


const EducationDetailsSchema = new mongoose.Schema(
  {
    programSelection: { type: String, required: true },
    specialization: { type: String, required: true },
    startingDate: { type: Date, required: true },
    endingDate: { type: Date, required: true },
    document: { type: String }, // For storing the file path or URL
    degree: { type: String },
    year: { type: String },
    institute: { type: String },
    grade: { type: String },
    hrmEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "HRMEmployee" }, // Corrected to hrmEmployeeId
  },
  { timestamps: true }
);

const EducationDetails = mongoose.model("EducationDetails", EducationDetailsSchema);

module.exports = EducationDetails;