const Holiday = require('../models/holiday.model')
const Leave = require("../models/leave.model")
const Meeting = require("../models/meeting.model")
const Calendar = require("../models/calender.model")

const mongoose = require('mongoose');

// Replace this with your MongoDB URI
const MONGODB_URI = "mongodb+srv://technokrate_dev:technokrate123@surgisol.qdafw.mongodb.net/main?retryWrites=true&w=majority&appName=surgisol"

async function connectDB () {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Exit process with failure
  }
};



const seedHolidays = async () => {
    const holidays = [
      { name: "New Year's Day", date: "2024-01-01", type: "Public" },
      { name: "Republic Day", date: "2024-01-26", type: "Public" },
      { name: "Maha Shivaratri", date: "2024-03-08", type: "Public" },
      // Add more holidays as needed...
    ];
  
    try {
      await Holiday.insertMany(holidays);
      console.log('Holidays seeded successfully');
    } catch (err) {
      console.error('Error seeding holidays:', err);
    }
  };

  
  const seedLeaves = async () => {
    const leaves = [
      {
        start_date: "2024-01-02",
        end_date: "2024-01-05",
        reason: "Personal Work",
        status: "approved",
        user: "66deb39249dc3a9e27492eb2" // Replace with actual user IDs
      },
      {
        start_date: "2024-02-15",
        end_date: "2024-02-16",
        reason: "Fever",
        status: "pending",
        user: "66deb39249dc3a9e27492eb8" // Replace with actual user IDs
      },
      // Add more leaves as needed...
    ];
  
    try {
      await Leave.insertMany(leaves);
      console.log('Leaves seeded successfully');
    } catch (err) {
      console.error('Error seeding leaves:', err);
    }
  };

  const seedMeetings = async () => {
    const meetings = [
      {
        title: "Project Kickoff Meeting",
        participants: ["66deb39249dc3a9e27492eb6", "66deb39249dc3a9e27492eb8"], // Replace with actual user IDs
        startTime: "2024-01-03T10:00:00",
        endTime: "2024-01-03T11:30:00",
        location: "Conference Room A",
        agenda: "Discuss project kickoff details"
      },
      {
        title: "Monthly Review Meeting",
        participants: ["66deb39249dc3a9e27492eb8", "66deb39249dc3a9e27492eb6"], // Replace with actual user IDs
        startTime: "2024-02-01T09:00:00",
        endTime: "2024-02-01T10:30:00",
        location: "Conference Room B",
        agenda: "Monthly performance review"
      },
      // Add more meetings as needed...
    ];
  
    try {
      await Meeting.insertMany(meetings);
      console.log('Meetings seeded successfully');
    } catch (err) {
      console.error('Error seeding meetings:', err);
    }
  };

  
  const seedCalendar = async () => {
    try {
      const holidays = await Holiday.find({});
      const leaves = await Leave.find({});
      const meetings = await Meeting.find({});
  
      const calendarData = [
        {
          date: "2024-01-01",
          holidays: holidays.filter(holiday => holiday.date.toISOString().startsWith("2024-01-01")).map(holiday => holiday._id),
          leaves: leaves.filter(leave => leave.start_date.toISOString().startsWith("2024-01-01")).map(leave => leave._id),
          meetings: meetings.filter(meeting => meeting.startTime.toISOString().startsWith("2024-01-01")).map(meeting => meeting._id)
        },
        // Repeat for other dates...
      ];
  
      await Calendar.insertMany(calendarData);
      console.log('Calendar seeded successfully');
    } catch (err) {
      console.error('Error seeding calendar:', err);
    }
  };

  
  const main = async () => {
    await connectDB();
    // await seedHolidays();
    // await seedLeaves();
    // await seedMeetings();
    await seedCalendar();
  };
  
  main();
  