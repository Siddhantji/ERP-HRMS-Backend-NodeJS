const Attendance = require("../models/attendanceModel");
const HRMEmployee = require("../models/HRMEmployeeModel");
const moment = require("moment");
const Holiday = require("../models/holidayDetailsModel");

// Get attendance summary for an employee for a month
const getAttendanceSummaryByMonth = async (req, res) => {
  const { employeeId } = req.params;
  const { month } = req.query;

  try {
    const attendance = await Attendance.findOne({
      employee: employeeId,
      month: month,
    });

    if (!attendance) {
      return res
        .status(404)
        .json({ message: "Attendance not found for this month" });
    }

    return res.status(200).json(attendance);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching attendance summary", error });
  }
};

// Mark daily attendance
const markAttendance = async (req, res) => {
  //remove leaveType
  const { employeeId, date, status } = req.body;

  try {
    if(!employeeId){
      return res.status(404).json({message:'Employee not found'})
    }
    // Determine the current month (Month Year format)
    const currentMonth = new Date().toLocaleString('default', { month: 'long' }) + ' ' + new Date().getFullYear();
    // const currentMonth = "December 2025";
    // Find the attendance record for the employee in the current month
    let attendance = await Attendance.findOne({
      employee: employeeId,
      month: currentMonth,
    });

    // If no attendance record exists for the current month, create a new one
    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        month: currentMonth,
        totalPresent: 0,
        totalLeavesTaken: 0,
      });
    }

    // Add the daily attendance for the new date
    attendance.dailyAttendance.push({ date: date || new Date(), status });

    // Update the total present/absent days based on status
    if (status === "Present") {
      attendance.totalPresent += 1;
    } else if (status === "Absent") {
      attendance.totalLeavesTaken += 1;
    }

    // Save the updated attendance document
    await attendance.save();

    return res
      .status(200)
      .json({ message: "Attendance marked successfully", attendance });
  } catch (error) {
    return res.status(500).json({ message: "Error marking attendance", error });
  }
};

const getTwoMonthAttendance = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const data = await Attendance.find(
      { employee: employeeId },
      "month totalLeavesTaken totalPresent"
    )
      .sort({ createdAt: -1 });
      // .limit(2);
    if (!data) {
     return res.status(404).json({ message: "Data not found" });
    }
   return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching data", error });
  }
};

// Get weekly attendance
const getWeeklyAttendance = async (req, res) => {
  const { employeeId } = req.params;
  
  try {
    const currentMonthData = await Attendance.find(
      { employee: employeeId },
      "dailyAttendance"
    )
      .sort({ createdAt: -1 })
      .limit(1);

    if (!currentMonthData || !currentMonthData.length) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    let weekData = [...currentMonthData[0].dailyAttendance.reverse().flat(1)];

    if (
      currentMonthData[0].dailyAttendance.length < 7 ||
      currentMonthData[0].dailyAttendance.length === 0
    ) {
      const limit = 7 - currentMonthData[0].dailyAttendance.length;

      const lastMonthData = await Attendance.find(
        { employee: employeeId },
        "dailyAttendance"
      )
        .sort({ createdAt: -1 })
        .skip(1)
        .limit(limit);

      if (lastMonthData.length) {
        weekData = [...weekData, ...lastMonthData[0].dailyAttendance.reverse()];
      }
    }

    const weekDataWithDays = weekData
      .map(record => ({
        ...record.toObject(),
        day: moment(record.date).format('dddd'),
      }))
      .sort((a, b) => - moment(a.date).valueOf() + moment(b.date).valueOf()); // Sort by date

    return res.status(200).json({
      success: true,
      data: weekDataWithDays.slice(0, 7)
    });

  } catch (error) {
    return res.status(500).json({
      success: false, 
      message: "Error fetching weekly attendance",
      error: error.message
    });
  }
};

const getEmployeeList = async (req, res) => {
  try {
   
    const currentMonthDay = Moment().format("YYYY-MM-DD");
    // const month = req.query.month;
    const currentMonth = Moment().format("MMMM YYYY");
    // Find attendance where both month and dailyAttendance.date match
    const employeeList = await Attendance.find({
      month: currentMonth,  // Match the month
      dailyAttendance: {
        $elemMatch: { date: currentMonthDay }  // Match the date in the dailyAttendance array
      }
    })
    .populate({
      path: 'employee',  // Populate employee details from HRMEmployee collection
      select: 'employeeName employeeType jobTitle'  // Select specific employee fields
    });

    // Map the results to only include the employee details and the matched attendance status
    const result = employeeList.map(attendance => {
      const matchedAttendance = attendance.dailyAttendance.find(day =>  
          (day.date).format("YYYY-MM-DD") === currentMonthDay
      );
    })

      // return {
      //   employee: employeeList,
      //   // status: matchedAttendance ? matchedAttendance.status : null // Get the status or null if not found
      // };
  

    // Send the result as a JSON response
    return res.json(result);
  } catch (err) {
    console.error(err);
  return  res.status(500).json({ message:err.message });
  }
};


const getAllEmployeeAttendanceDetails = async (req, res) => {
  try {
    const { employeeName, date, department } = req.query;
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const data = {};
    if (employeeName) {
      data.employeeName = employeeName
    };
    if (department) {
      data.department = department
    };

    const today = new Date().toISOString().split('T')[0];

    const employeeWithName = await HRMEmployee.find(data)  //.lean();

    if (!employeeWithName || employeeWithName.length === 0) {
      return res.status(404).json({ error: 'No employees found with the provided name.' });
    };

    const employeeIds = employeeWithName.map((employee) => employee._id);

    let AttendanceDate;
    if (date) {
      AttendanceDate = date
    } else { AttendanceDate = today };

    // Get total count
    const totalCount = await Attendance.countDocuments({
      'dailyAttendance.date': AttendanceDate, employee: { $in : employeeIds }
    });
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated records
    const employeeRecords = await Attendance.find(
      { 'dailyAttendance.date': AttendanceDate, employee: { $in : employeeIds } },
      'attendanceDate dailyAttendance'
    )
    .populate({
      path: 'employee',
      select: 'empId employeeName _id jobTitle department employeeType'
    })
    .skip(skip)
    .limit(limit);
    
    // Format the response data
    const employees = employeeRecords.map(record => {
      const todayAttendance = record.dailyAttendance.find(
        entry => entry.date.toISOString().split('T')[0] === AttendanceDate
      );

      return {
        _id: record._id,
        empId: record.employee?.empId,
        EmpObjectId: record.employee?._id,
        employeeName: record.employee?.employeeName,
        department: record.employee?.department,
        jobTitle: record.employee?.jobTitle,
        employeeType: record.employee?.employeeType,
        date: todayAttendance.date,
        status: todayAttendance.status
      };
    });

    return res.status(200).json({
      success: true,
      message: "Retrieved employees successfully",
      data: {
        pagination: {
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        employees
      }
    });

  } catch (error) {
    console.error('Error fetching employee details:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

/*
* * Show both code to sir for monthly attendance
*/

// const getMonthlyAttendance = async (req, res) => {
//   try {
//     const year = parseInt(req.query.year) || moment().year();
//     const currentMonth = moment().month(); // 0-based month index
//     const monthlyStats = [];

//     // Process each month from January up to current month
//     for (let monthIndex = 0; monthIndex <= currentMonth; monthIndex++) {
//       const monthMoment = moment().year(year).month(monthIndex);
//       const monthName = monthMoment.format('MMMM');
//       const monthYear = monthMoment.format('MMMM YYYY');
//       const daysInMonth = monthMoment.daysInMonth();
      
//       // Count Sundays
//       let sundaysCount = 0;
//       const startOfMonth = monthMoment.clone().startOf('month');
//       const endOfMonth = monthMoment.clone().endOf('month');
      
//       for (let day = startOfMonth.clone(); day.isBefore(endOfMonth); day.add(1, 'days')) {
//         if (day.day() === 0) sundaysCount++;
//       }

//       // Get holidays for the month
//       const holidays = await Holiday.find({ month: monthName });
//       const holidaysCount = holidays.length;

//       // Calculate working days
//       const totalWorkingDays = daysInMonth - sundaysCount - holidaysCount;

//       // Get attendance data
//       const monthlyAttendance = await Attendance.aggregate([
//         {
//           $match: {
//             month: monthYear,
//             'dailyAttendance.status': 'Present',
//           },
//         },
//         {
//           $project: {
//             dailyAttendance: {
//               $filter: {
//                 input: '$dailyAttendance',
//                 as: 'attendance',
//                 cond: {
//                   $and: [
//                     { $eq: ['$$attendance.status', 'Present'] },
//                     {
//                       $ne: [
//                         { $dayOfWeek: { $toDate: '$$attendance.date' } },
//                         1
//                       ]
//                     }
//                   ]
//                 },
//               },
//             },
//           },
//         },
//         {
//           $addFields: {
//             presentCount: { $size: '$dailyAttendance' },
//           },
//         },
//       ]);

//       const totalPresentCount = monthlyAttendance.reduce((sum, record) => sum + record.presentCount, 0);
//       const totalEmployees = await HRMEmployee.countDocuments();

//       const attendancePercentage = totalEmployees > 0
//         ? (totalPresentCount / (totalEmployees * totalWorkingDays)) * 100
//         : 0;

//       monthlyStats.push({
//         month: monthName,
//         attendancePercentage: attendancePercentage.toFixed(2) + '%',
//       });
//     }

//     res.status(200).json({
//       year: year,
//       monthlyAttendance: monthlyStats
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// };

//! Modified getMonthlyAttendance

const getMonthlyAttendance = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || moment().year();
    const currentMonth = moment().month();
    const today = moment();
    
    const allHolidays = await Holiday.find({
      year: year
    }).lean();
    
    const totalEmployees = await HRMEmployee.countDocuments();

    const holidaysPerMonth = {};
    allHolidays.forEach(holiday => {
      holidaysPerMonth[holiday.month] = (holidaysPerMonth[holiday.month] || 0) + 1;
    });

    const sundaysPerMonth = {};
    for (let month = 0; month <= currentMonth; month++) {
      const date = moment([year, month, 1]);
      // For current month, only count days until today
      const lastDay = month === currentMonth ? 
        today.date() : 
        date.daysInMonth();
      
      let sundayCount = 0;
      for (let day = 0; day < lastDay; day++) {
        if (date.clone().add(day, 'days').day() === 0) sundayCount++;
      }
      sundaysPerMonth[date.format('MMMM')] = sundayCount;
    }

    const monthlyAttendance = await Attendance.aggregate([
      {
        $match: {
          month: {
            $in: Array.from({length: currentMonth + 1}, (_, i) => 
              moment().month(i).year(year).format('MMMM YYYY'))
          }
        }
      },
      {
        $group: {
          _id: '$month',
          totalPresent: {
            $sum: {
              $size: {
                $filter: {
                  input: '$dailyAttendance',
                  as: 'attendance',
                  cond: {
                    $and: [
                      { $eq: ['$$attendance.status', 'Present'] },
                      { $ne: [{ $dayOfWeek: { $toDate: '$$attendance.date' } }, 1] }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    ]);

    const monthlyStats = Array.from({length: currentMonth + 1}, (_, monthIndex) => {
      const monthMoment = moment().year(year).month(monthIndex);
      const monthName = monthMoment.format('MMMM');
      const shortMonthName = monthMoment.format('MMM');
      
      // Calculate days passed in this month
      const daysInMonth = monthIndex === currentMonth ? 
        today.date() : 
        monthMoment.daysInMonth();
      
      const sundaysCount = sundaysPerMonth[monthName];
      const holidaysCount = holidaysPerMonth[monthName] || 0;
      const totalWorkingDays = daysInMonth - sundaysCount - holidaysCount;

      const monthData = monthlyAttendance.find(m => m._id === monthMoment.format('MMMM YYYY'));
      const totalPresentCount = monthData ? monthData.totalPresent : 0;

      const attendancePercentage = totalWorkingDays > 0
        ? Math.round((totalPresentCount / (totalEmployees * totalWorkingDays)) * 100)
        : 0;

      return {
        date: shortMonthName,
        percentage: attendancePercentage
      };
    });

    return res.status(200).json({
      success: true,
      data: monthlyStats
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// function getWeeklyRangesForCurrentMonth() {
//   const weeks = [];
//   const startOfMonth = moment().startOf('month');
//   const endOfMonth = moment().endOf('month');
//   let startOfWeek = startOfMonth.clone().startOf('week'); // Start from the beginning of the week

//   while (startOfWeek.isSameOrBefore(endOfMonth, 'day')) {
//       const endOfWeek = moment.min(startOfWeek.clone().endOf('week'), endOfMonth);
//       weeks.push({ start: startOfWeek.clone(), end: endOfWeek.clone() });
//       startOfWeek = endOfWeek.add(1, 'day');
//   }

//   return weeks;
// }



//* Show both code to sir for weekly attendance

// const  weeklyAttendance= async (req, res) => {
//   try {
//       const currentMonth = moment().month(); 
//       const currentYear = moment().year();

//       const weeklyRanges = getWeeklyRangesForCurrentMonth();
//       const weeklyData = [];

//       for (const week of weeklyRanges) {
        
//           let totalDays = 0;
//           let totalPresent = 0;

//           // Find attendance records within each weekly range
//           const attendanceRecords = await Attendance.find({
//               'dailyAttendance.date': { $gte: week.start.toDate(), $lte: week.end.toDate() },
//           });

//           attendanceRecords.forEach(record => {
//               record.dailyAttendance.forEach(entry => {
//                   const entryDate = moment(entry.date);

//                   // Check if the date is within the current month and is not a Sunday
//                   if (
//                       entryDate.month() === currentMonth &&
//                       entryDate.day() !== 0 && // Exclude Sundays
//                       entryDate.isBetween(week.start, week.end, null, '[]')
//                   ) {
//                       totalDays++;
//                       if (entry.status === 'Present') {
//                           totalPresent++;
//                       }
//                   }
//               });
//           });

//           // Calculate the attendance percentage for this week
//           const attendancePercentage = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;

//           // Push weekly data, even if there is no attendance record for that week
//           weeklyData.push({
//               weekStart: week.start.format('YYYY-MM-DD'),
//               weekEnd: week.end.format('YYYY-MM-DD'),
//               attendancePercentage: `${attendancePercentage.toFixed(2)}%`,
//           });
//       }

//       return res.json({ month: currentMonth + 1, year: currentYear, weeklyData });
//   } catch (error) {
//       console.error(error);
//       return res.status(500).json({ message: 'Server Error' });
//   }
// };

//! Modified weeklyAttendance

// const weeklyAttendance = async (req, res) => {
//   try {
//     const currentMonth = moment().month();
//     const currentYear = moment().year();
//     const monthName = moment().format('MMMM');
//     const weeklyRanges = getWeeklyRangesForCurrentMonth();

   
//     const holidays = await Holiday.find({ 
//       month: monthName,
//       year: currentYear 
//     }).lean();

    
//     const holidayMap = new Map(
//       holidays.map(h => [moment(h.date).format('YYYY-MM-DD'), h])
//     );

    
//     const monthStart = moment([currentYear, currentMonth, 1]).startOf('month');
//     const monthEnd = monthStart.clone().endOf('month');

//     const attendanceRecords = await Attendance.aggregate([
//       {
//         $match: {
//           'dailyAttendance.date': {
//             $gte: monthStart.toDate(),
//             $lte: monthEnd.toDate()
//           }
//         }
//       },
//       {
//         $unwind: '$dailyAttendance'
//       },
//       {
//         $match: {
//           'dailyAttendance.date': {
//             $gte: monthStart.toDate(),
//             $lte: monthEnd.toDate()
//           },
//           'dailyAttendance.status': 'Present'
//         }
//       },
//       {
//         $group: {
//           _id: {
//             $dateToString: {
//               format: '%Y-%m-%d',
//               date: '$dailyAttendance.date'
//             }
//           },
//           presentCount: { $sum: 1 }
//         }
//       }
//     ]);

//     const attendanceMap = new Map(
//       attendanceRecords.map(record => [record._id, record.presentCount])
//     );

//     const weeklyData = weeklyRanges.map(week => {
//       let totalWorkingDays = 0;
//       let totalPresent = 0;
//       let holidaysInWeek = 0;
      
//       for (let day = week.start.clone(); day.isSameOrBefore(week.end); day.add(1, 'day')) {
//         const dateStr = day.format('YYYY-MM-DD');
        
//         // Skip if it's a Sunday or not in current month
//         if (day.day() === 0 || day.month() !== currentMonth) {
//           continue;
//         }

//         // Skip if it's a holiday
//         if (holidayMap.has(dateStr)) {
//           holidaysInWeek++;
//           continue;
//         }

//         totalWorkingDays++;
//         totalPresent += attendanceMap.get(dateStr) || 0;
//       }

//       const attendancePercentage = totalWorkingDays > 0 
//         ? (totalPresent / totalWorkingDays) * 100 
//         : 0;

//       return {
//         weekStart: week.start.format('YYYY-MM-DD'),
//         weekEnd: week.end.format('YYYY-MM-DD'),
//         attendancePercentage: `${attendancePercentage.toFixed(2)}%`
//       };
//     });

//     return res.json({
//       month: currentMonth + 1,
//       year: currentYear,
//       weeklyData,
//       totalHolidays: holidays.length
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Server Error' });
//   }
// };

const getDailyAttendancePercentage = async (req, res) => {
  try {
    const today = moment().startOf('day');
    const twoWeeksAgo = moment().subtract(14, 'days').startOf('day');
    const totalEmployees = await HRMEmployee.countDocuments();

    const attendanceRecords = await Attendance.aggregate([
      {
        $match: {
          'dailyAttendance.date': {
            $gte: twoWeeksAgo.toDate(),
            $lte: today.endOf('day').toDate()
          }
        }
      },
      {
        $unwind: '$dailyAttendance'
      },
      {
        $match: {
          'dailyAttendance.status': 'Present',
          'dailyAttendance.date': {
            $gte: twoWeeksAgo.toDate(),
            $lte: today.endOf('day').toDate()
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$dailyAttendance.date'
            }
          },
          presentCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    const holidays = await Holiday.find({
      date: {
        $gte: twoWeeksAgo.format('YYYY-MM-DD'),
        $lte: today.format('YYYY-MM-DD')
      }
    }).lean();

    const holidayDates = new Set(
      holidays.map(h => moment(h.date, 'MMMM D, YYYY').format('YYYY-MM-DD'))
    );

    const dailyAttendance = [];
    let currentDate = twoWeeksAgo.clone();

    while (currentDate.isSameOrBefore(today)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      
      if (currentDate.day() !== 0 && !holidayDates.has(dateStr)) {
        const dayRecord = attendanceRecords.find(record => record._id === dateStr);
        const presentCount = dayRecord ? dayRecord.presentCount : 0;
        const percentage = totalEmployees > 0 
          ? Math.round((presentCount / totalEmployees) * 100)
          : 0;

        dailyAttendance.push({
          percentage: percentage,
          date: currentDate.format('D MMM')
        });
      }
      
      currentDate.add(1, 'day');
    }

    return res.status(200).json({
      success: true,
      data: dailyAttendance
    });

  } catch (error) {
    console.error('Error calculating daily attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating daily attendance',
      error: error.message
    });
  }
};

module.exports = {
  getWeeklyAttendance,
  markAttendance,
  getAttendanceSummaryByMonth,
  getTwoMonthAttendance,
  getEmployeeList,
  getAllEmployeeAttendanceDetails,
  getMonthlyAttendance,
  // weeklyAttendance,
  getDailyAttendancePercentage
};
