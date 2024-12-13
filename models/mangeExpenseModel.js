const mongoose = require("mongoose");

const travel = {
  date: { type: Date },
  city: { type: String },
  modeOfTransport: {
    type: String,
  },
  amount: {
    cash: { type: Number },
    online: { type: Number },
  },
  placeVisited: { type: String },
  departure: { type: String },
  destination: { type: String },
  billNumber: { type: String },
  workingRemark: { type: String },
  travelDate: { type: String },
  receipt: { type: String },
  limitExceed: {
    explanation: { type: String },
    amount: { type: Number },
    message: { type: String },
  },
  status: { type: String, default: "pending" },
};

const food = {
  date: { type: Date },
  city: { type: String },
  mealType: {
    type: String,
  },
  amount: {
    cash: { type: Number },
    online: { type: Number },
  },
  billNumber: { type: String },
  receipt: { type: String },
  limitExceed: {
    explanation: { type: String },
    amount: { type: Number },
    message: { type: String },
  },
  status: { type: String, default: "pending" },
};

const gift = {
  date: { type: Date },
  amount: {
    cash: { type: Number },
    online: { type: Number },
  },
  billNumber: { type: String },
  description: { type: String },
  receiverName: { type: String },
  receiverNumber: { type: String },
  purpose: { type: String },
  receipt: { type: String },
  limitExceed: {
    explanation: { type: String },
    amount: { type: Number },
    message: { type: String },
  },
  status: { type: String, default: "pending" },
};

const stationary = {
  date: { type: Date },
  amount: {
    cash: { type: Number },
    online: { type: Number },
  },
  billNumber: { type: String },
  description: { type: String },
  receipt: { type: String },
  limitExceed: {
    explanation: { type: String },
    amount: { type: Number },
    message: { type: String },
  },
  status: { type: String, default: "pending" },
};

const other = {
  date: { type: Date },
  amount: {
    cash: { type: Number },
    online: { type: Number },
  },
  billNumber: { type: String },
  description: { type: String },
  receipt: { type: String },
  limitExceed: {
    explanation: { type: String },
    amount: { type: Number },
    message: { type: String },
  },
  status: { type: String, default: "pending" },
};

const expenseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HRMEmployee",
    required: true,
  },
  place: { type: String, required: true },
  month: {
    type: String,
    default:
      new Date().toLocaleString("default", { month: "long" }) +
      " " +
      new Date().getFullYear(),
  },
  dailyExpenses: [
    {
      date: { type: Date, default: Date.now },
      travels: [travel],
      foods: [food],
      gifts: [gift],
      stationeries: [stationary],
      others: [other],
    },
  ],
});

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;