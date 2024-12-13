const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    candidateId: { type: String, required: true, unique: true },
    fullName: {
      type: String,
      required: true,
    },
    qualifications: {
      SSC: { type: Boolean, default: false },
      HSC: { type: Boolean, default: false },
      UG: { type: Boolean, default: false },
      PG: { type: Boolean, default: false },
      PHD: { type: Boolean, default: false },
      Diploma: { type: Boolean, default: false }
    },
    grade: { type: String, required: true },
    officialEmail: {
      type: String,
      required: true,
      unique: true,
    },
    personalEmail: { type: String },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    positionApplied: {
      type: String,
      required: true,
      enum: [
        "Software Developer",
        "Research and Development (R&D)",
        "Human Resources",
      ],
    },
    department: {
      type: String,
      required: true,
    },
    companyId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Company"
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    country: { type: String},
    joiningDate: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    panCard: {
      type: String,
      required: true,
    },
    bankAccountName: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    maritalStatus: {
      type: String,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
    },
    anniversaryDate: {
      type: Date,
      
    },
    relationWithPerson: {
      type: String,
      required: true,
    },
    aadharCardNumber: {type:String },
    city: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    employmentType: {
      type: String,
      required: true,
      enum: ["Internship", "Contract", "Full time", "Part time"],
    },
    emergencyContact: {
      type: String,
      required: true,
    },
    alternatePhoneNumber: { type: String },
    address: {
      type: String,
      required: true,
    },
    photo: {
      data: { type: String },
      date: { type: Date },
    },
    cv: {
      data: { type: String },
      date: { type: Date },
    },
    relievingLetter: {
      data: { type: String },
      date: { type: Date },
    },
    bankDetails: {
      data: { type: String },
      date: { type: Date },
    },
    branchName: {
      type: String,
      required: true,
    },
    aadharCard: {
      data: { type: String },
      date: { type: Date },
    },
    offerAcceptance: {
      type: Boolean,
      default: false,
    },
    backgroundCheck: {
      type: Boolean,
      default: false,
    },
    trainingSchedule: {
      type: Boolean,
      default: false,
    },
    itSetup: {
      type: Boolean,
      default: false,
    },
    finalReview: {
      type: Boolean,
      default: false,
    },
    documentsSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
