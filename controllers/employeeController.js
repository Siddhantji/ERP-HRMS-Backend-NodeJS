const Employee = require("../models/Employee");
const nodemailer = require("nodemailer");
const moment = require("moment");
const { State, City } = require("country-state-city");
const Company = require("../models/company.model");

// Create new employee

// change name to
const addNewCandidate = async (req, res) => {
  //   const {
  //     candidateId,
  //     fullName,
  //     positionAppliedFor,
  //     department,
  //     qualification,
  //     grade,
  //     company,
  //     dateOfBirth,
  //     address,
  //     maritalStatus,
  //     country,
  //     anniversaryDate,
  //     state,
  //     city,
  //     phoneNumber,

  //     alternatePhoneNumber,
  //     officialEmail,
  // personalEmail,
  // emergencyContact,
  //     relationshipWithPerson,
  //     salary,
  //     addharCardNumber,
  //     joiningDate,
  //     bankAccountName,
  //     pancard,

  //     employmentType,
  //     residentialAddress,
  //   } = req.body;
  const data = req.body;

  try {
    const { photo } = req.files;
    let ph;
    if (photo) {
      ph = photo[0]?.originalname;
    }
    const companyId = Company.find(data.company).select("_id");
    data.company = companyId;
    const employee = new Employee({
      ...data,
      photo: {
        data: ph,
        date: new Date(),
      },
    });

    await employee.save();
    return res
      .status(201)
      .json({ message: "Employee created successfully", employee });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const searchEmployees = async (req, res) => {
  const allowedFields = ["fullName", "positionApplied", "department"];
  const query = {};

  // Add only the allowed fields to the query object
  allowedFields.forEach((field) => {
    if (req.query[field]) {
      query[field] = { $regex: new RegExp(req.query[field], "i") };
    }
  });

  // Check if query object is empty (no search criteria)
  if (Object.keys(query).length === 0) {
    return res.status(400).json({
      message:
        "Please provide at least one search criterion (name, designation, or department)",
    });
  }

  try {
    const employees = await Employee.find(query);

    if (!employees.length) {
      return res.status(404).json({ message: "No employees found" });
    }

    return res.status(200).json({ message: "Found employees", employees });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error searching for employees", error });
  }
};

// View profile for an employee
const viewProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res
      .status(201)
      .json({ message: "Retrieved employee profile", employee });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving employee profile", error });
  }
};

const uploadDocuments = async (req, res) => {
  const { id } = req.params;
  const files = req.files; // Expecting multiple files with specific field names

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Define the document fields in the schema
    const documentFields = [
      "cv",
      "relievingLetter",
      "bankDetails",
      "aadharCard",
      "postalAddress",
      "permanentAddress",
      "photo",
    ];

    // Update document fields if a file is provided for them
    documentFields.forEach((field) => {
      if (files[field]) {
        employee[field] = {
          data: files[field][0].path, // Set file path
          date: new Date(), // Set upload date
        };
      }
    });

    // Check if all required fields are now available
    const allFieldsAvailable = documentFields.every(
      (field) => employee[field]?.data
    );

    // Set documentsSubmitted to true if all fields are present
    if (allFieldsAvailable) {
      employee.documentsSubmitted = true;
    }

    await employee.save();
    return res.status(201).json({
      message: "Files uploaded successfully",
      documentsSubmitted: employee.documentsSubmitted,
      employee,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error uploading files", error });
  }
};

//get all candidate names
//change to query
const getCandidateName = async (req, res) => {
  const { department } = req.query;
  try {
    const employees = await Employee.find(
      { department: department },
      { fullName: 1, _id: 0 }
    );
    if (employees.length === 0) {
      return res
        .status(404)
        .json({ message: "No employees found in this department" });
    }

    return res.status(200).json(employees);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching employees",
      error: error.message,
    });
  }
};

//get candidate data on basis of fullName and department
const getCandidate = async (req, res) => {
  try {
    const employee = await Employee.findOne(req.query);

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    return res.status(200).json({ success: true, employee});
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Employee.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated employees
    const employees = await Employee.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!employees.length) {
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
        employees
        
      }
    });

  } catch (error) {
    console.error("Error retrieving employees:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error retrieving employees",
      error: error.message 
    });
  }
}; 

const getAllDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await Employee.findById(id).select({
      "fullName":1,
      'photo': 1,
      'cv': 1,
      'relievingLetter': 1,
      'bankDetails': 1,
      'aadharCard': 1
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Employee not found" 
      });
    }

    const documentFields = {
      id: user._id,
      fullName: user.fullName,
    };

    // Helper function to get file type from path or base64
    const getFileType = (data) => {
      if (!data) return null;
      
      // Check if it's a base64 string
      if (data.startsWith('data:')) {
        const matches = data.match(/^data:([A-Za-z-+\/]+);base64,/);
        if (matches && matches.length > 1) {
          return matches[1];
        }
      }
      
      // Check file extension if it's a path
      if (typeof data === 'string') {
        const extension = data.split('.').pop().toLowerCase();
        switch(extension) {
          case 'pdf':
            return 'pdf';
          case 'jpg':
          case 'jpeg':
            return 'jpeg';
          case 'png':
            return 'png';
          default:
            return 'octet-stream';
        }
      }
      
      return 'octet-stream';
    };

    const addDocumentIfExists = (fieldName) => {
      if (user[fieldName] && user[fieldName].data) {
        const fileType = getFileType(user[fieldName].data);
        documentFields[fieldName] = {
          data: user[fieldName].data,
          date: user[fieldName].date || null,
          exists: true,
          fileType: fileType
        };
      } else {
        documentFields[fieldName] = {
          data: null,
          date: null,
          exists: false,
          fileType: null
        };
      }
    };

    ['photo', 'cv', 'relievingLetter', 'bankDetails', 'aadharCard'].forEach(doc => {
      addDocumentIfExists(doc);
    });

    return res.status(200).json({
      success: true,
      message: "Documents retrieved successfully",
      documents: documentFields
    });

  } catch (error) {
    console.error("Error fetching documents:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error retrieving documents",
      error: error.message 
    });
  }
};

const getCandidateDepartment = async (req, res) => {
  try {
    // Using the distinct method to get unique department names
    const departments = await Employee.distinct("department");
    return res.status(200).json(departments);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching department names",
      error: error.message,
    });
  }
};

const updateCandidateData = async (req, res) => {
  const { id } = req.params;
  const {
    offerAcceptance,
    backgroundCheck,
    trainingSchedule,
    itSetup,
    finalReview,
    documentsSubmitted,
  } = req.body;

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (offerAcceptance !== undefined)
      employee.offerAcceptance = !employee.offerAcceptance;
    if (backgroundCheck !== undefined)
      employee.backgroundCheck = !employee.backgroundCheck;
    if (trainingSchedule !== undefined)
      employee.trainingSchedule = !employee.trainingSchedule;
    if (itSetup !== undefined) employee.itSetup = !employee.itSetup;
    if (finalReview !== undefined) employee.finalReview = !employee.finalReview;
    if (documentsSubmitted !== undefined)
      employee.documentsSubmitted = !employee.documentsSubmitted;

    // Save the updated employee document to the database
    await employee.save();

    return res.status(200).json({
      message: "Employee data updated successfully",
      employee,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

const getAllDepartment = async (req, res) => {
  try {
    // Use distinct method to get unique department names from Employee collection
    const departments = [
      "Sales",
      "Screening",
    ];
    return res.status(200).json({ departments: departments });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching department names",
      error: error.message,
    });
  }
};

const getEmployeetype = async (req, res) => {
  try {
    // Use distinct method to get unique department names from Employee collection
    const employeetype = ["Internship", "Contract", "Full time", "Part time"];
    return res.status(200).json({ employeetype: employeetype });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching employee types",
      error: error.message,
    });
  }
};

const getPositiontype = async (req, res) => {
  try {
    // Hardcoded array of position types
    const positiontypes = [
      "Software Developer",
      "Research and Development (R&D)",
      "Human Resources",
    ];

    // Return the position types as a JSON response
    return res.status(200).json({ positiontypes });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching employee types",
      error: error.message,
    });
  }
};

const sendMail = async (req, res) => {
  try {
    const { email, emailBody, subject } = req.body;

    // Validate the email
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find the employee with the given email
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({ message: "User not found" });
    }

    // Set up the email transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Environment variable for email
        pass: process.env.EMAIL_PASSWORD, // Environment variable for password or app password
      },
    });

    // Mail options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: emailBody,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    return res
      .status(200)
      .json({ message: "Email has been sent successfully" });
  } catch (err) {
    console.error("Error sending email:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

const viewNotUploadedDocuments = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const missingDocuments = [];

    // Check for missing documents
    if (!employee.photo.data) missingDocuments.push("Photo");
    if (!employee.cv.data) missingDocuments.push("CV");
    if (!employee.relievingLetter.data)
      missingDocuments.push("Relieving Letter");
    if (!employee.bankDetails.data) missingDocuments.push("Bank Details");
    if (!employee.aadharCard.data) missingDocuments.push("Aadhar Card");
    if (!employee.postalAddress.data) missingDocuments.push("Postal Address");
    if (!employee.permanentAddress.data)
      missingDocuments.push("Permanent Address");

    if (missingDocuments.length > 0) {
      return res.status(200).json({
        missingDocuments,
      });
    }

    return res.status(200).json({ message: "All documents are available." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

const getEmployeeCountForCurrentMonth = async (req, res) => {
  try {
    const currentMonthStart = moment().startOf("month").toDate();
    const currentMonthEnd = moment().endOf("month").toDate();

    const currentMonthCount = await Employee.countDocuments({
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
    });

    return res.json({
      empCount: currentMonthCount,
    });
  } catch (error) {
    console.error("Error calculating employee percentage:", error);
    return res.status(500).json({ message: error.message });
  }
};



const getCountry =(req,res)=>{
  try{
    // const countries = State.getCountryList().map((country) => ({
    //   name: country.name,
    //   isoCode: country.isoCode,
    // }));
    const countries = [
      {
        name: "India",
        isoCode: "IN",
      }
    ]
    return res.status(200).json({
      success: true,
      data: countries,
    });
  }catch(error){
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

const getStates = async (req, res) => {
  try {
    const countries = req.query.country;
    const states = State.getStatesOfCountry(countries).map((state) => ({
      name: state.name,
      isoCode: state.isoCode,
    }));

    return res.status(200).json({
      success: true,
      data: states,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCities = async (req, res) => {
  try {
    const { stateCode, country } = req.query;

    if (!stateCode) {
      return res.status(400).json({
        success: false,
        message: "State code is required",
      });
    }

    const cities = City.getCitiesOfState(country, stateCode).map((city) => ({
      name: city.name,
    }));

    return res.status(200).json({
      success: true,
      data: cities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



module.exports = {
  addNewCandidate,
  getCandidateName,
  getCandidateDepartment,
  searchEmployees,
  uploadDocuments,
  getAllEmployees,
  viewProfile,
  getCandidate,
  getAllDocuments,
  updateCandidateData,
  getAllDepartment,
  getEmployeetype,
  getPositiontype,
  sendMail,
  viewNotUploadedDocuments,
  getEmployeeCountForCurrentMonth,
  getStates,
  getCities,
  getCountry
};
