const User = require("../models/user.model");
const Attendance = require("../models/attendanceModel");
const moment = require("moment");
const Calendar = require("../models/calender.model");
const Meeting = require("../models/meeting.model");
const setReminder = require("../utils/meetingReminder");
const HRMEmployee = require("../models/HRMEmployeeModel");
const Holiday = require("../models/holidayDetailsModel");

// Endpoint to get weekly attendance record

const createCalendarEntry = async (req, res) => {
  try {
    const { date, holidays, leaves, meetings, companyId } = req.body;

    // Check if a calendar entry already exists for the given date and company
    const existingEntry = await Calendar.findOne({ date, companyId });
    if (existingEntry) {
      return res.status(400).json({
        message: "Calendar entry already exists for this date and company.",
      });
    }

    // Create a new calendar entry
    const newCalendarEntry = new Calendar({
      date,
      holidays,
      leaves,
      meetings,
      companyId,
    });

    // Save the calendar entry to the database
    await newCalendarEntry.save();

    // Respond with a success message and the newly created entry
    return res.status(201).json({
      message: "Calendar entry created successfully",
      calendarEntry: newCalendarEntry,
    });
  } catch (error) {
    console.error("Error creating calendar entry:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createCalendarEntry };

const getWeeklyAttendanceById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get the user object by ID
    const user = await User.findById(userId);

    // Get the current week's date range
    const startDate = moment().startOf("week").toDate();
    const endDate = moment().endOf("week").toDate();

    // Find all attendance records within the specified date range
    const attendanceRecords = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Calculate the total number of days worked and the total hours worked
    let totalDaysWorked = 0;
    let totalHoursWorked = 0;

    attendanceRecords.forEach((record) => {
      totalDaysWorked += record.daysWorked;
      totalHoursWorked += record.hoursWorked;
    });

    res.json({ totalDaysWorked, totalHoursWorked, user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// const getWeeklyAttendanceByDepartment = async (weekStart, weekEnd) => {
//   try {
//     // Find attendance records for the specified week, including user data
//     const attendanceRecords = await Attendance.find({
//       date: {
//         $gte: weekStart.toDate(),
//         $lte: weekEnd.toDate(),
//       },
//     })
//       .populate("userId")
//       .lean();

//     // Group attendance records by employee and department
//     const employeeAttendanceByDepartment = attendanceRecords.reduce(
//       (acc, attendance) => {
//         const department = attendance.userId.department;
//         const employeeId = attendance.userId._id;
//         if (!acc[department]) {
//           acc[department] = {};
//         }
//         if (!acc[department][employeeId]) {
//           acc[department][employeeId] = {
//             name: attendance.userId.name,
//             totalAttendance: 1,
//           };
//         } else {
//           acc[department][employeeId].totalAttendance++;
//         }
//         return acc;
//       },
//       {}
//     );

//     return employeeAttendanceByDepartment;
//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// };

// Controller to fetch all calendar events (leaves, holidays, and meetings) month-wise

const getMonthlyCalendarEvents = async (req, res) => {
  try {
    const { month, year } = req.params;

    // Convert month and year to numbers
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (isNaN(monthNum) || isNaN(yearNum)) {
      return res.status(400).json({ error: "Invalid month or year provided." });
    }

    // Create start and end dates for the month
    const startDate = new Date(yearNum, monthNum - 1, 1); // Start of the month
    const endDate = new Date(yearNum, monthNum, 0); // End of the month

    // Query the Calendar collection for the events within the specified month
    const calendarEvents = await Calendar.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate("holidays")
      .populate("leaves")
      .populate({
        path: "meetings",
        populate: { path: "participants" }, // Populate meeting participants
      })
      .lean();

    // Respond with the fetched events
    return res.status(200).json(calendarEvents);
  } catch (err) {
    console.error("Error fetching monthly calendar events:", err);
    res
      .status(500)
      .json({ error: "An error occurred while fetching calendar events." });
  }
};

const todaySpecialDays = async (req, res) => {
  try {
    const currentMonthDay = moment().format("MM-DD"); // Get current month and day in MM-DD format

    // Find users with either a matching birthdate or anniversary_date
    const todaySpecialEvents = await User.find({
      $or: [
        {
          $expr: {
            $eq: [
              { $dateToString: { format: "%m-%d", date: "$birthdate" } },
              currentMonthDay,
            ], // Match month and day for birthdate
          },
        },
        {
          $expr: {
            $eq: [
              { $dateToString: { format: "%m-%d", date: "$anniversary_date" } },
              currentMonthDay,
            ], // Match month and day for anniversary_date
          },
        },
      ],
    });

    // Modify the results to include the "eventCelebration" field
    const modifiedEvents = todaySpecialEvents.map((event) => {
      let eventCelebration = "";

      // Determine if the event is a birthdate or anniversary based on matching field
      const isBirthdayMatch =
        moment(event.birthdate).format("MM-DD") === currentMonthDay;
      const isAnniversaryMatch =
        moment(event.anniversary_date).format("MM-DD") === currentMonthDay;

      if (isBirthdayMatch) {
        eventCelebration = "Birthday";
      } else if (isAnniversaryMatch) {
        eventCelebration = "Anniversary";
      }

      // Return the original event data along with the eventCelebration field
      return {
        name: event.name, // Include the name field properly
        eventCelebration, // Add eventCelebration field
      };
    });

    // Return the special days as a structured response
    return res.status(200).json({
      success: true,
      todaySpecialEvents: modifiedEvents, // Send modified events with eventCelebration field
    });
  } catch (error) {
    console.error("Error fetching special days:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching special days.",
    });
  }
};

const createMeeting = async (req, res) => {
  try {
    const {
      title,
      participants,
      time,
      date,
      location,
      description,
      reminder,
      userId,
    } = req.body;
    // const name = await
    // Validate required fields
    console.log(title, participants, time, userId);

    if (!title || !participants || !time || !userId) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    let organizer = await HRMEmployee.findById(userId).select(
      "employeeName -_id"
    );
    organizer = organizer ? organizer.employeeName : "Unknown";

    const companyId = req.headers["companyid"];

    // Create a new meeting object
    const newMeeting = new Meeting({
      title,
      participants,
      date,
      time,
      location,
      description,
      companyId,
      reminder,
      organizer: {
        id: userId,
        name: organizer,
      },
    });

    // Save the meeting to the database
    const savedMeeting = await newMeeting.save();
    setReminder(newMeeting);
    return res.status(200).json({ success: true, savedMeeting , message: "Meeting created successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error creating meeting", error: error.message });
  }
};

const getEmailAndName = async (req, res) => {
  try {
    const attendeesdata = await HRMEmployee.find().select(
      "employeeName officialEmailId -_id"
    );
    return res.status(200).json(attendeesdata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error getting attendees data" });
  }
};

const getOverallMeetingStatus = async (req, res) => {
  const { id } = req.params;

  const currentDateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
  const sevenDaysAgo = moment()
    .tz("Asia/Kolkata")
    .subtract(7, "days")
    .format("YYYY-MM-DD");
  console.log(sevenDaysAgo);
  console.log(currentDateTime);

  try {
    const emp = await HRMEmployee.findById(id);
    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const nextMeeting = await Meeting.find({
      date: { $gte: currentDateTime },
    })
      .sort({ date: 1, time: 1 })
      .select("title date -_id")
      .limit(1);
      
 

    const lastMeeting = await Meeting.find({
      date: { $gte: sevenDaysAgo, $lte: currentDateTime },
      status: { $eq: "Completed" },
    })
      .sort({ date: -1, time: -1 })
      .select("title date -_id")
      .limit(1);

    const totalscheduleMeetings = await Meeting.countDocuments({
      date: { $gte: sevenDaysAgo, $lte: currentDateTime },
      status: { $eq: "Completed" },
    });

    const completedMettings = await Meeting.countDocuments({
      date: { $gte: sevenDaysAgo, $lte: currentDateTime },
      status: "Completed",
    });
    const canceledMettings = await Meeting.countDocuments({
      date: { $gte: sevenDaysAgo, $lte: currentDateTime },
      status: "Canceled",
    });
    const pendingMettings = await Meeting.countDocuments({
      date: { $gte: sevenDaysAgo, $lte: currentDateTime },
      status: "Pending",
    });

    const response = {
      nextMeeting: nextMeeting[0],
      lastMeeting: lastMeeting[0],
      totalscheduleMeetings,
      completedMettings,
      canceledMettings,
      pendingMettings,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error occurred:", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const getDepartmentChart = async (req, res) => {
  try {
    const result = await HRMEmployee.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 }, // Count the number of employees in each department
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$count" }, // Calculate the total number of employees
          departments: {
            $push: {
              department: "$_id",
              count: "$count",
            },
          },
        },
      },
      {
        $unwind: "$departments", // Unwind to access each department
      },
      {
        $project: {
          _id: 0,
          department: "$departments.department",
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$departments.count", "$total"] }, // Calculate percentage
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
    ]);

    console.log(result);
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json("Error calculating department percentage:", error.message);
  }
};

const totalEmployeesPercentage= async (req, res) => {
  try {
    // Get the current month and previous month
    const currentMonthStart = moment().startOf('month');
    const currentMonthEnd = moment().endOf('month');
    const previousMonthStart = moment().subtract(1, 'months').startOf('month');
    const previousMonthEnd = moment().subtract(1, 'months').endOf('month');
    

    // Count employees for the current month
    const currentMonthCount = await HRMEmployee.countDocuments({
      startDate: {
        $gte: currentMonthStart.toDate(),
        $lte: currentMonthEnd.toDate(),
      },
    });

    // Count employees for the previous month
    const previousMonthCount = await HRMEmployee.countDocuments({
      startDate: {
        $gte: previousMonthStart.toDate(),
        $lte: previousMonthEnd.toDate(),
      },
    });

    // Calculate percentage increase
    let percentageIncrease = 0;
    if (previousMonthCount > 0) {
      percentageIncrease = ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100;
    } else if (currentMonthCount > 0) {
      // If there were no employees in the previous month but some in the current month
      percentageIncrease = 100; // 100% increase from 0 to some number
    }

    if( percentageIncrease > 100 ){
      percentageIncrease = 100;
    }
    if (percentageIncrease < 100){
      percentageIncrease = -100;
    }

    // Respond with the results
    res.status(200).json({
       empCount: currentMonthCount,
      // previousMonthCount,
      percentageIncrease
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const dailyAttendance = async (req, res) => {
  try {
    const today = moment().startOf("day");

    // Get total number of employees
    const totalEmployees = await HRMEmployee.countDocuments();

    // Fetch today's attendance records with 'Present' status
    const attendanceToday = await Attendance.aggregate([
      { $unwind: "$dailyAttendance" },
      {
        $match: {
          "dailyAttendance.date": {
            $gte: today.toDate(),
            $lt: moment(today).endOf("day").toDate()
          },
          "dailyAttendance.status": "Present"
        }
      }
    ]);

    const todayCount = attendanceToday.length;
    
    // Calculate percentage of employees present today
    const presentPercentage = totalEmployees > 0 
      ? ((todayCount / totalEmployees) * 100).toFixed(2)
      : 0;

    return res.json({
      presentToday: todayCount,
      presentPercentage: presentPercentage
    });

  } catch (error) {
    console.error("Error calculating attendance percentage:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//not added in postman as frontend guys don't want it
const getMeetingDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await Meeting.findById(id).populate(
      "organizer",
      "employeeName"
    );
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    return res.status(200).json(meeting);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};
// ask from sir
const getAllUpcomingMeets = async (req, res) => {
  try {
    const currentDay = moment().add(1, "days").format("YYYY-MM-DD");
    const today = moment();
    const endOfMonth = today.isSame(today.clone().endOf("month"), "day")
      ? today.clone().add(1, "month").endOf("month").format("YYYY-MM-DD")
      : today.endOf("month").format("YYYY-MM-DD");

    const upcomingMeetings = await Meeting.find({
      date: { $gte: currentDay, $lte: endOfMonth },
    })
      .select("title date time location participants organizer description")
      .lean();
    
    const sortedMeetings = upcomingMeetings.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;

      const timeA = moment(a.time, ["h:mm A"]).format("HH:mm");
      const timeB = moment(b.time, ["h:mm A"]).format("HH:mm");

      if (timeA < timeB) return -1;
      if (timeA > timeB) return 1;

      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    if (sortedMeetings.length === 0) {
      return res
        .status(404)
        .json({ message: "No meetings found for this month" });
    }

    return res.status(200).json(sortedMeetings);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const getAllTodaysMeetings = async (req, res) => {
  try {
    const currentDay = moment().format('YYYY-MM-DD');
    const todaysMeetings = await Meeting.find({
      date: currentDay,
    }).select('title date time location participants').lean();

    const sortedMeetings = todaysMeetings.sort((a, b) => {
      const timeA = moment(a.time, ["h:mm A"]).format("HH:mm");
      const timeB = moment(b.time, ["h:mm A"]).format("HH:mm");

      if (timeA < timeB) return -1;
      if (timeA > timeB) return 1;

      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    if (sortedMeetings.length === 0) {
      return res.status(404).json({ message: "No meetings found for today" });
    }

    return res.status(200).json(sortedMeetings);
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const getWeeklyAttendanceByDepartment = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    // Find all attendance records for employees in the current week
    const attendanceRecords = await Attendance.find({
      'dailyAttendance.date': { $gte: startOfWeek, $lte: endOfWeek }
    })
      .populate({
        path: 'employee',
        select: 'department',
      })
      .lean();

    // Group by department and calculate the weekly attendance percentage
    const departmentAttendance = {};

    attendanceRecords.forEach(record => {
      const department = record.employee.department;

      if (!departmentAttendance[department]) {
        departmentAttendance[department] = { totalDays: 0, presentDays: 0 };
      }

      record.dailyAttendance.forEach(day => {
        if (day.date >= startOfWeek && day.date <= endOfWeek) {
          departmentAttendance[department].totalDays++;
          if (day.status === "Present") {
            departmentAttendance[department].presentDays++;
          }
        }
      });
    });

   
    const departmentAttendancePercentage = Object.keys(departmentAttendance).map(department => {
      const data = departmentAttendance[department];
      const percentage = (data.presentDays / data.totalDays) * 100 || 0;
      return {
        department,
        weeklyAttendancePercentage: percentage.toFixed(2) + '%'
      };
    });

    return res.status(200).json(departmentAttendancePercentage);
  } catch (error) {
    console.error("Error fetching weekly attendance:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const getAllUpcomingMeetsAndHolidays = async (req, res) => {
  try {
    const today = moment().startOf('day');

    const meetings = await Meeting.find({
      date: { $gte: today.toDate() }
    }).select('title date time description location participants organizer status');

   
    const holidays = await Holiday.find({
      date: { 
        $gte: today.format('YYYY-MM-DD')
      }
    }).select('holidayTitle date type location');

    const formattedMeetings = meetings.map(meeting => ({
      type: 'meeting',
      title: meeting.title,
      date: moment(meeting.date).format('YYYY-MM-DD'),
      time: meeting.time,
      description: meeting.description || '',
      location: meeting.location || '',
      status: meeting.status,
      organizer: meeting.organizer,
      participants: meeting.participants
    }));

   
    const formattedHolidays = holidays.map(holiday => {
      
      const parsedDate = moment(holiday.date, 'MMMM D, YYYY');
      return {
      type: 'holiday',
      title: holiday.holidayTitle,
      date: parsedDate.format('YYYY-MM-DD'),
      location: holiday.location,
      holidayType: holiday.type
    }});

    
    const allEvents = [...formattedMeetings, ...formattedHolidays]
      .sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());

    return res.status(200).json({
      success: true,
      totalEvents: allEvents.length,
      data: allEvents
    });

  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching upcoming events',
      error: error.message
    });
  }
};

const getHierarchy =(req,res)=>{
  const organization = {
    admin: {
      image: "https://res.cloudinary.com/dd8f3ggi2/image/upload/v1728671506/bgm7hkezfxeob5az3e1k.png",
      name: "Mr. John",
      designation: "Admin",
      managers: [
        {
          designation: "Manager",
          name: "Mr. Negi",
          image: "https://res.cloudinary.com/dd8f3ggi2/image/upload/v1728671506/bgm7hkezfxeob5az3e1k.png",
          employees: [
            { name: "Karan",  designation: "Employee", image: "https://res.cloudinary.com/dd8f3ggi2/image/upload/v1728671506/bgm7hkezfxeob5az3e1k.png" },
            { name: "Krishna",designation: "Employee", image: "https://res.cloudinary.com/dd8f3ggi2/image/upload/v1728671506/bgm7hkezfxeob5az3e1k.png" },
          ],
        },
        {
          designation: "Manager",
          name: "Mr. Chataurbhuj",
          image: "https://res.cloudinary.com/dd8f3ggi2/image/upload/v1728671506/bgm7hkezfxeob5az3e1k.png",
          employees: [
            {name: "Shalu", designation: "Employee",  image: "https://res.cloudinary.com/dd8f3ggi2/image/upload/v1728671506/bgm7hkezfxeob5az3e1k.png" },
            {name: "Vishal", designation: "Employee",  image: "https://res.cloudinary.com/dd8f3ggi2/image/upload/v1728671506/bgm7hkezfxeob5az3e1k.png" },
          ],
        },
        {
          designation: "Manager",
          name: "Mr. Kareem",
          image: "https://res.cloudinary.com/dd8f3ggi2/image/upload/v1728671506/bgm7hkezfxeob5az3e1k.png",
          employees: [
            { name: "Ankit", designation: "Employee", image: "https://res.cloudinary.com/dd8f3ggi2/image/upload/v1728671506/bgm7hkezfxeob5az3e1k.png" },
            {  name: "Prince",designation: "Employee" ,image: "https://res.cloudinary.com/dd8f3ggi2/image/upload/v1728671506/bgm7hkezfxeob5az3e1k.png" },
          ],
        },
      ],
    },
  };
  res.json(organization);
}

module.exports = {
  createCalendarEntry,
  getWeeklyAttendanceById,
  getWeeklyAttendanceByDepartment,
  getMonthlyCalendarEvents,
  todaySpecialDays,
  createMeeting,
  getOverallMeetingStatus,
  getEmailAndName,
  getDepartmentChart,
  totalEmployeesPercentage,
  dailyAttendance,
  getMeetingDetail,
  getAllUpcomingMeets,
  getAllTodaysMeetings,
  getAllUpcomingMeetsAndHolidays,
  getHierarchy
};
