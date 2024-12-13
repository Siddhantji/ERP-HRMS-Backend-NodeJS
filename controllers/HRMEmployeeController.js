const HRMEmployee = require("../models/HRMEmployeeModel");
const Meeting = require("../models/meeting.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const Company = require("../models/company.model");
const leave = require("../models/employeeLeaveModel");
const Attendance = require("../models/attendanceModel");

const createEmployee = async (req, res) => {
  try {
    const employeeData = req.body;
    // Validate if salary is a number
    if (typeof employeeData.salary !== 'number' || isNaN(employeeData.salary)) {
      return res.status(400).json({
        success: false,
        message: 'Salary must be a valid number',
      });
    }
    const company = await Company.findOne({
      name: employeeData.company,
    }).select("_id");
    employeeData["companyId"] = company._id;

    const hashedPassword = await bcrypt.hash(employeeData.empPassword, 10);

    employeeData.empPassword = hashedPassword;
    // Creating a new employee instance
    const newEmployee = new HRMEmployee(employeeData);

    // Update the employee's password
    // Saving the employee to the database
    await newEmployee.save();

    // Sending a success response
    return res.status(201).json({
      message: "Employee created successfully",
      data: newEmployee,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating employee",
      error: error.message,
      success: false,
    });
  }
};

// Update employee password by empId
const updatePassword = async (req, res) => {
  const { empId, newPassword } = req.body;

  try {
    // Find the employee by empId
    const employee = await HRMEmployee.findOne({ empId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the employee's password
    employee.empPassword = hashedPassword;
    await employee.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating password", error: error.message });
  }
};

const loginEmployee = async (req, res) => {
  const { officialEmailId, empPassword } = req.body;

  try {
    // Find the employee by email
    const employee = await HRMEmployee.findOne({ officialEmailId });
    if (!employee) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if the employee has a stored password
    if (!employee.empPassword) {
      return res.status(400).json({ 
        message: "Password not set for this employee" 
      });
    }

    // Check if the password is valid
    const isMatch = await bcrypt.compare(empPassword, employee.empPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const companyId = await Company.findOne({ name: employee.company });

    // Get today's attendance status
    const today = moment().startOf('day');
    const todayAttendance = await Attendance.findOne(
      {
        employee: employee._id,
        'dailyAttendance.date': {
          $gte: today.toDate(),
          $lt: moment(today).endOf('day').toDate()
        }
      },
      { 'dailyAttendance.$': 1 }
    );

    const attendanceStatus = todayAttendance?.dailyAttendance[0]?.status || 'Not Marked';

    // Generate JWT token
    const token = jwt.sign({ empId: employee.empId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Send response with attendance status
    return res.json({
      message: "Login successful",
      token,
      id: employee._id,
      name: employee.employeeName,
      companyId: companyId._id,
      companyName: employee.company,
      todayAttendance: {
        date: today.format('YYYY-MM-DD'),
        status: attendanceStatus
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};

const getAllEmployeeDetails = async (req, res) => {
  try {
    // Fetch all employee details
    const getData = await HRMEmployee.find();

    // Send a successful response with the employee data
    return res.status(200).json(getData);
  } catch (error) {
    // Log the error and send an error response
    console.error("Error fetching employee details:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch employee details from the database
    const data = await HRMEmployee.findById(id).select(
      "empId department employeeName jobTitle"
    );

    // Send both employee data and date/time in the response
    return res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching employee details:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const getEmployeeByIdForAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await HRMEmployee.findById(id).select(
      "empId employeeName jobTitle -_id"
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const current_date = moment().format("MMMM DD, YYYY");
    const indiaTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    return res
      .status(200)
      .json({
        ...employee.toObject(),
        current_date: current_date,
        indiaTime: indiaTime,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

//change it for email
const upcomingMeeting = async (req, res) => {
  const { id } = req.params;
  try {
    const today = new Date();
    const now = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const emp = await HRMEmployee.findById(id);
    // Find meetings where the participant's ID exists in the participants array
    const upcomingMeetings = await Meeting.find({
      participants: { $in: [emp.officialEmailId] },
      date: { $gte: now },
    })
      .sort({ date: 1, time: 1 })
      .lean();
    if (!upcomingMeetings || upcomingMeetings.length === 0) {
      return res
        .status(404)
        .json({ message: "No meetings found for this user" });
    }
    // Send the found meetings as a response
    return res.status(200).json(upcomingMeetings);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const getNextMeeting = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the employee by ID
    const emp = await HRMEmployee.findById(id);
    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Get current date and time in "Asia/Kolkata" timezone
    const now = moment().tz("Asia/Kolkata");

    console.log("Current Timestamp:", now.toISOString());
    console.log("Employee Email:", emp.officialEmailId);

    // Find the next meeting where the employee is a participant and the meeting is upcoming
    const upcomingMeeting = await Meeting.findOne({
      participants: { $in: [emp.officialEmailId] },
      date: { $gte: now.format("YYYY-MM-DD") },
      time: { $gte: now.format("hh:mm A") },
    })
      .sort({ date: 1, time: 1 })
      .limit(1);

    console.log("Upcoming Meetings:", upcomingMeeting);

    // Check if any meeting was found
    if (!upcomingMeeting) {
      return res
        .status(404)
        .json({ message: "No upcoming meetings found for this user" });
    }

    // Return the upcoming meeting
    return res.status(200).json(upcomingMeeting);
  } catch (error) {
    console.error("Error occurred:", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const HrmEmployeeSearching = async (req, res) => {
  try {
    const { empId, employeeName, jobTitle } = req.query;

    // Check if all required fields are provided
    if (!empId || !employeeName || !jobTitle) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: empId, employeeName, jobTitle"
      });
    }

    const data = await HRMEmployee.findOne({
      empId,
      employeeName,
      jobTitle,
    }).select(
      "empId employeeName jobTitle department officialEmailId phoneNumber startDate manager officeLocation"
    );

    if (!data) {
      return res.status(404).json({ 
        success: false,
        message: "Employee Not Found" 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: "Employee found successfully",
      data 
    });

  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server Error",
      error: error.message 
    });
  }
};

const HrmEmployeeUpdate = async (req, res) => {
  try {
    const id = req.params.id;
    const { department, manager, officeLocation } = req.body;

    if (!department && !manager && !officeLocation) {
      return res
        .status(400)
        .json({
          message:
            "At least one field is required to update: department, manager, or officeLocation.",
        });
    }

    const update = await HRMEmployee.findByIdAndUpdate(
      id,
      { department, manager, officeLocation },
      { new: true } // Include the new data in the response
    ).select(
      "empId employeeName jobTitle department officialEmailId phoneNumber startDate manager officeLocation"
    );

    if (!update) {
      return res
        .status(404)
        .json({ message: "Employee with this ID not found." });
    }

    return res.status(200).json({ message: "Updated Successfully", update });
  } catch (error) {
    console.error("Error occurred:", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const getPayslipGenerationStatus = async (req, res) => {
  try {
    const { employeeName } = req.query;
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await HRMEmployee.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const data = {};
    if (employeeName) {
      data.employeeName = employeeName
    };

    // Get paginated data
    const employees = await HRMEmployee.find(data)
      .select("empId employeeName paySlipStatus -_id")
      .skip(skip)
      .limit(limit);

    if (!employees || employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No employee data found"
      });
    }

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
    return res.status(500).json({
      success: false, 
      message: "Server Error",
      error: error.message
    });
  }
};

const getEmployeePaySlipList = async (req, res) => {
  try {
    const {employeeName} = req.query;
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    console.log(employeeName)

    // Get total count for pagination
    const totalCount = await HRMEmployee.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const data = {};
    if (employeeName) {
      data.employeeName = employeeName
    };

    // Get paginated employees with selected fields
    const employees = await HRMEmployee.find(data) 
      .select("empId salary employeeName jobTitle _id")
      .skip(skip)
      .limit(limit);

    if (!employees || employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No employee data found"
      });
    }

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
    return res.status(500).json({ 
      success: false,
      message: "Server Error", 
      error: error.message 
    });
  }
};

const getDesignations = async (req, res) => {
  try {
    const data = await HRMEmployee.distinct("jobTitle");
    return res.status(200).json(data);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const HrmCoreEmployeeUpdate = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      empPassword,
      employeeName,
      qualification,
      grade,
      company,
      address,
      maritalStatus,
      city,
      zipCode,
      state,
      phoneNumber,
      alternatePhoneNumber,
      emergencyNumber,
      relationWithPerson,
      officialEmailId,
      personalEmailId,
      department,
      jobTitle,
      salary,
      aadharCard,
      panCard,
      bankAccountName,
      officeLocation,
      accountNumber,
      bankName,
      branchName,
      ifscCode,
    } = req.body;

    const updateData = {
      empPassword,
      employeeName,
      qualification,
      grade,
      company,
      address,
      maritalStatus,
      city,
      zipCode,
      state,
      phoneNumber,
      alternatePhoneNumber,
      emergencyNumber,
      relationWithPerson,
      officialEmailId,
      personalEmailId,
      department,
      jobTitle,
      salary,
      aadharCard,
      panCard,
      bankAccountName,
      officeLocation,
      accountNumber,
      bankName,
      branchName,
      ifscCode,
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const update = await HRMEmployee.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select(
      'employeeName qualification grade company address maritalStatus city zipCode state phoneNumber alternatePhoneNumber emergencyNumber relationWithPerson officialEmailId personalEmailId department jobTitle salary aadharCard panCard bankAccountName officeLocation accountNumber bankName branchName ifscCode'
    );
    if (!update) {
      return res
        .status(404)
        .json({ message: "Employee with this ID not found." });
    }

    return res.status(200).json({ message: "Updated Successfully", update });
  } catch (error) {
    console.error("Error occurred:", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const getHrmEmployeeDetails = async(req,res)=>{
  const {id} = req.params;
  try{
    const data = await HRMEmployee.findById(id).select(
      ' startDate empId birthDate employeeName qualification grade company address maritalStatus city zipCode state phoneNumber alternatePhoneNumber emergencyNumber relationWithPerson officialEmailId personalEmailId department jobTitle salary aadharCard panCard bankAccountName officeLocation accountNumber bankName branchName ifscCode'
    );
    if (!data) {
      res.status(402).json({ message: "Data not Found" });
    }
    return res.status(200).json(data);
  }
  catch(error){
    return res
   .status(500)
   .json({ message: "Server Error", error: error.message });
  }
}

const getHrmEmployeeList = async (req, res) => {
  try {
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await HRMEmployee.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated employees
    const data = await HRMEmployee.find()
      .select("_id employeeName empId phoneNumber startDate jobTitle")
      .skip(skip)
      .limit(limit);

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No employees found"
      });
    }

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
        employees: data
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Server Error", 
      error: error.message 
    });
  }
};

const getEmployeeComprehensiveDetails = async (req, res) => {
  try {
    const today = new Date();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count first
    const totalCount = await HRMEmployee.countDocuments();
    
    const employees = await HRMEmployee.aggregate([
      {
        $lookup: {
          from: "leaveapplications",
          localField: "_id",
          foreignField: "employee",
          pipeline: [
            {
              $match: {
                fromDate: { $gte: today },
                status: "Approve"
              }
            },
            { $limit: 1 },
            {
              $project: {
                fromDate: 1,
                toDate: 1,
              }
            },
          ],
          as: "upcomingLeaves"
        }
      },
      {
        $lookup: {
          from: "attendances",
          localField: "_id",
          foreignField: "employee",
          pipeline: [
            {
              $project: {
                dailyAttendance: {
                  $filter: {
                    input: "$dailyAttendance",
                    as: "attendance",
                    cond: {
                      $eq: [
                        { $dateToString: { format: "%Y-%m-%d", date: "$$attendance.date" } },
                        today.toISOString().split('T')[0]
                      ]
                    }
                  }
                }
              }
            },
            {
              $match: { "dailyAttendance.0": { $exists: true } }
            }
          ],
          as: "todayAttendance"
        }
      },
      {
        $project: {
          employeeName: 1,
          department: 1,
          upcomingLeaves: 1,
          status: {
            $cond: {
              if: { $gt: [{ $size: "$todayAttendance" }, 0] },
              then: "Present",
              else: "Absent"
            }
          }
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);

    if (!employees.length) {
      return res.status(404).json({ message: "No employees found" });
    }

    const totalPages = Math.ceil(totalCount / limit);
    
    res.status(200).json({
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      employees
     
    });

  } catch (error) {
    console.error("Error fetching employee details:", error);
    return res.status(500).json({ 
      message: "Server Error", 
      error: error.message 
    });
  }
};

const getEmployeePayslipDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await HRMEmployee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employeePayslip = {
      EmployeeName: employee.employeeName,
      EmployeeId: employee.empId,
      Department: employee.department,
      Position: employee.jobTitle,
      Month: 'August 2024',
      PayRate: `${employee.salary.toLocaleString('en-IN')} per month`,
      GrossSalary: '70,000',
      Deductions: '5,000',
      NetSalary: '50,000'
    };

    return res.status(200).json({
      status: "success",
      data: employeePayslip
    });

  } catch (error) {
    console.error("Error fetching payslip details:", error);
    return res.status(500).json({ 
      message: "Server Error", 
      error: error.message 
    });
  }
};

module.exports = {
  createEmployee,
  updatePassword,
  loginEmployee,
  getAllEmployeeDetails,
  getEmployeeById,
  getEmployeeByIdForAttendance,
  upcomingMeeting,
  getNextMeeting,
  HrmEmployeeSearching,
  HrmEmployeeUpdate,
  getPayslipGenerationStatus,
  getEmployeePaySlipList,
  getDesignations,
  HrmCoreEmployeeUpdate,
  getHrmEmployeeList,
  getHrmEmployeeDetails,
  getEmployeeComprehensiveDetails,
  getEmployeePayslipDetails
};