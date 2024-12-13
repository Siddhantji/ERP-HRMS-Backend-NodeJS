const HRMEmployee = require("../models/HRMEmployeeModel");
const addLeave = require("../models/employeeLeaveModel");
const User = require('../models/user.model');

const totalLeaves = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await HRMEmployee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const totalleaves = employee.totalLeave;
    return res.status(200).json(totalleaves);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const pendingLeaves = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await HRMEmployee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const pendingleaves = employee.pendingLeaves;
    return res.status(200).json(pendingleaves);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const leavesTaken = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await HRMEmployee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const leavestaken = employee.leavesTaken;
    return res.status(200).json(leavestaken);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const uploadLeaveData = async (req, res) => {
  const {
    appliedDate,
    fromDate,
    toDate,
    leaveType,
    reason,
    applyTo,
    employee,
  } = req.body;

  try {
    const { document } = req.files;
    let data;
    if (document) {
      data = document[0]?.originalname;
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    const diffTime = endDate - startDate;

    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const add = new addLeave({
      appliedDate,
      fromDate,
      toDate,
      totalDays,
      leaveType,
      reason,
      applyTo,
      employee,
      documents: {
        data: data,
      },
    });

    await add.save();
    return res.status(201).json({ message: "Applied for leave", addLeave });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getLeaveWithEmployeeData = async (req, res) => {
  const { leaveId } = req.params;
  try {
    const leave = await addLeave.findById(leaveId).populate("employee");
    if (!leave) {
      return res.status(404).json({ message: "Leave application not found" });
    }
    return res.status(200).json({ leave });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching leave application", error });
  }
};

const getAllEmployeeLeaves = async (req, res) => {
  try {
    const data = await addLeave.find().populate("employee");
    if (!data) {
      return res.status(404).json({ message: "No leaves found" });
    }
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching leaves" });
  }
};

const getEmployeeLeave = async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const today = new Date();

    // Get total count
    const totalCount = await addLeave.countDocuments({
      status: "Pending",
      fromDate: { $gte: today }
    });
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await addLeave.find({
      status: "Pending",
      fromDate: { $gte: today }
    })
    .populate("employee")
    .skip(skip)
    .limit(limit);

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No employee leaves found"
      });
    }
    
    const employees = data.map((leave) => ({
      _id: leave._id,
      employeeName: leave.employee.employeeName,
      EmpObjectId: leave.employee._id,
      leaveType: leave.leaveType,
      startDate: leave.fromDate,
      endDate: leave.toDate,
      status: leave.status,
      totalDays: leave.totalDays,
    }));

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
      message: error.message
    });
  }
};

const getEmployeeLeaveSummary = async (req, res) => {
  const { id } = req.params;

  try {
    const leaveDetails = await addLeave
      .find({ employee: id })
      .populate("employee")
      .populate({
        path: "employee",
        select: "leavesTaken totalLeave",
      });

    if (!leaveDetails || leaveDetails.length === 0) {
      return res
        .status(404)
        .json({ message: "No leave records found for this employee." });
    }

    const leaveSummary = leaveDetails.reduce(
      (acc, leave) => {
        acc.casualLeavesTaken += leave.employee.leavesTaken.casualLeaves || 0;
        acc.sickLeavesTaken += leave.employee.leavesTaken.sickLeaves || 0;
        acc.festivalsTaken += leave.employee.leavesTaken.festivals || 0;
        acc.totalCasualLeaves =
          leave.employee.totalLeave.casualLeaves || acc.totalCasualLeaves;
        acc.totalSickLeaves =
          leave.employee.totalLeave.sickLeaves || acc.totalSickLeaves;
        acc.totalFestivalLeaves =
          leave.employee.totalLeave.festivals || acc.totalFestivalLeaves;
        acc.leaveTypeSet.add(leave.leaveType);

        return acc;
      },
      {
        casualLeavesTaken: 0,
        sickLeavesTaken: 0,
        festivalsTaken: 0,
        totalCasualLeaves: 0,
        totalSickLeaves: 0,
        totalFestivalLeaves: 0,
        leaveTypeSet: new Set(),
      }
    );

    const totalLeavesTaken =
      leaveSummary.casualLeavesTaken +
      leaveSummary.sickLeavesTaken +
      leaveSummary.festivalsTaken;
    const leaveBalance =
      leaveSummary.totalCasualLeaves +
      leaveSummary.totalSickLeaves +
      leaveSummary.totalFestivalLeaves -
      totalLeavesTaken;

    const leaveType = Array.from(leaveSummary.leaveTypeSet).join(", ");

    const response = {
      totalLeavesTaken,
      leaveBalance,
      leaveType,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

// const getEmployeeLeaveStatusAndApproval = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const leaveDetails = await addLeave
//       .find({ employee: id })
//       .populate({
//         path: "employee",
//         select: "employeeName",
//       })
//       .limit(1)
//       .select("leaveType fromDate toDate  updatedAt reason appliedDate");

//     if (!leaveDetails) {
//       return res
//         .status(404)
//         .json({ message: "No leave records found for this employee." });
//     }
//     const response = leaveDetails.map((leave) => ({
//       employeeName: leave.employee.employeeName,
//       leaveType: leave.leaveType,
//       startDate: leave.fromDate,
//       endDate: leave.toDate,
//       reason: leave.reason,
//       appliedDate: leave.appliedDate,
//       lastupdated: leave.updatedAt,
//     }));
   
//     return res.status(200).json(response);
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: "Server Error", error: error.message });
//   }
// };

const getEmployeeLeaveStatusAndApproval = async (req, res) => {
  const { id } = req.params;

  try {
    const leaveDetails = await addLeave.find({ employee: id })
    .populate({
      path: 'employee', 
      select: 'employeeName' 
    })
    .select('leaveType fromDate toDate  updatedAt reason status appliedDate')
    .limit(1) 
    
    
    if (!leaveDetails) {
      return res.status(404).json({ message: 'No leave records found for this employee.' });
    }

    
    const response = {
      employeeName: leaveDetails[0].employee.employeeName,
      leaveType: leaveDetails[0].leaveType,
      startDate: leaveDetails[0].fromDate,
      endDate: leaveDetails[0].toDate,
      reason: leaveDetails[0].reason,
      appliedDate: leaveDetails[0].appliedDate,
      lastUpdated: leaveDetails[0].updatedAt,
      status: leaveDetails[0].status
    };
   
    return res.status(200).json(response);

  } catch (error) {
     return res.status(500).json({ message: "Server Error", error: error.message});
  }
};

const getLeaveTypes = async (req, res) => {
  const leaves = ["Sick", "Casual", "Festivals"];
  try {
    res.status(200).json(leaves);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const getUserForLeaveApply = async (req, res) => {
  try {
    const users = await User.find().select('name -_id');

   
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    const names = users.map(user => user.name);

    res.status(200).json(names);
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const leaveApproval= async(req,res) =>{
  const {leaveId}= req.params;
  const {status}= req.body;
  try {
    const leave = await addLeave.findById(leaveId);
    if(!leave){
      return res.status(404).json({message:"Leave not found"});
    }
    leave.status =  status;
    await leave.save();
    return res.status(200).json({message:"Leave status updated successfully"});
  } catch (error) {
    return res.status(500).json({message:"Server Error", error:error.message});
  }
}


const getAllLeavesOfEmployee = async(req,res)=>{
  const id = req.params.id;
  try {    
    const data = await addLeave.find({employee:id}).sort({fromDate:-1}).select('leaveType fromDate toDate status _id');
    if (!data) {
      return res.status(404).json({ message: "No employee leaves found" });
    }
  
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

const getUpComingLeave = async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await addLeave.countDocuments({ 
      toDate: { $gt: new Date() } 
    });
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch paginated upcoming leaves
    const upcomingLeaves = await addLeave.find({ 
      toDate: { $gt: new Date() } 
    })
      .populate("employee", "employeeName department")
      .select("leaveType fromDate toDate")
      .sort({ fromDate: 1 })
      .skip(skip)
      .limit(limit);

    if (!upcomingLeaves.length) {
      return res.status(404).json({
        success: false,
        message: "No upcoming leaves found"
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
        employees: upcomingLeaves
      }
    });

  } catch (error) {
    console.error("Error retrieving upcoming leaves:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving upcoming leaves",
      error: error.message
    });
  }
};

const todayLeave = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const currentDate = new Date();

    // Get total count for pagination
    const totalCount = await addLeave.countDocuments({
      $or: [
        {
          fromDate: { $lte: currentDate },
          toDate: { $gte: currentDate }
        },
        { fromDate: currentDate },
        { toDate: currentDate }
      ]
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Find leave applications with pagination
    const leaveApplications = await addLeave.find({
      $or: [
        {
          fromDate: { $lte: currentDate },
          toDate: { $gte: currentDate }
        },
        { fromDate: currentDate },
        { toDate: currentDate }
      ]
    })
    .populate("employee", "employeeName department")
    .select("leaveType fromDate toDate")
    .skip(skip)
    .limit(limit);

    if (!leaveApplications.length) {
      return res.status(404).json({
        success: false,
        message: "No leaves found for today"
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
        employees: leaveApplications
      }
    });

  } catch (error) {
    console.error("Error fetching leave applications:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const searchEmployees = async (req, res) => {
  try {
    const { name, empId, department } = req.query;

    if (!name && !empId && !department) {
      return res.status(400).json({
        success: false,
        message: "At least one search parameter is required"
      });
    }

    // Build search query with exact matches
    let searchQuery = {};

    if (name) {
      searchQuery.employeeName = name;
    }
    if (empId) {
      searchQuery.empId = empId;
    }
    if (department) {
      searchQuery.department = department;
    }

    const employee = await HRMEmployee.findOne(searchQuery)
      .select('_id');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "No employee found matching all criteria"
      });
    }

    return res.status(200).json({
      success: true,
      data: { _id: employee._id }
    });

  } catch (error) {
    console.error('Error searching employee:', error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const getApprovedLeavesOfEmployee = async(req,res)=>{
  const id = req.params.id;
  try {    
    const data = await addLeave.find({
      employee: id,
      status: 'Approve'
    })
    .sort({fromDate: -1})
    .select('leaveType fromDate toDate status _id reason');

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "No approved leaves found" 
      });
    }
  
    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};



module.exports = {
  totalLeaves,
  pendingLeaves,
  leavesTaken,
  uploadLeaveData,
  getLeaveWithEmployeeData,
  getAllEmployeeLeaves,
  getEmployeeLeave,
  getEmployeeLeaveSummary,
  getEmployeeLeaveStatusAndApproval,
  getLeaveTypes,
  getUserForLeaveApply,
  leaveApproval,
  getAllLeavesOfEmployee,
  getUpComingLeave,
  todayLeave,
  searchEmployees,
  getApprovedLeavesOfEmployee

};
