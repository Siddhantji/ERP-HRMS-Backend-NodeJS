const EducationDetails = require("../models/EducationDetailsModel");

const saveEducationDetails = async (req, res) => {
  try {
    const {
      programSelection,
      specialization,
      startingDate,
      endingDate,
      degree,
      year,
      institute,
      grade,
      document,
      hrmEmployeeId, // Use correct name from model
    } = req.body;

  

    // Create a new education details record
    const newEducationDetails = new EducationDetails({
      programSelection,
      specialization,
      startingDate,
      endingDate,
      degree,
      year,
      institute,
      grade,
      document,
      hrmEmployeeId,
      document: req.file ? req.file.path : null, // Save file path if uploaded
    });

    // Save to database
    await newEducationDetails.save();

    return res.status(201).json({
      message: "Education details saved successfully",
      data: newEducationDetails,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error saving education details",
      error: error.message,
    });
  }
};

const getEducationDetails = async (req, res) => {
  const id = req.params.id
  try {
    const getData = await EducationDetails.find({hrmEmployeeId:id}).select(
      "degree year institute grade"
    );
    if(!getData){
      return res.status(404).json({ message: "Education Details not found" });
    }
   return res.status(200).json(getData);
  } catch (error) {
    return res.status(500).json({
      message: "Error showing education details",
      error: error.message,
    });
  }
};

const deleteEducationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await EducationDetails.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Education Details not found" });
    }

    // Respond with a success message
    return res.status(200).json({ message: "EducationDetails deleted successfully" });
  } catch (error) {
    console.error("Error deleting EducationDetails:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update EducationDetails by ID
const updateEducationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      programSelection,
      specialization,
      startingDate,
      endingDate,
      degree,
      year,
      institute,
      grade,
      hrmEmployeeId,
    } = req.body;

    // Validate required fields
    if (!programSelection || !specialization || !startingDate || !endingDate) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    // Find and update the record
    const updatedEducationDetails = await EducationDetails.findByIdAndUpdate(
      id,
      {
        programSelection,
        specialization,
        startingDate,
        endingDate,
        degree,
        year,
        institute,
        grade,
        hrmEmployeeId,
        document: req.file ? req.file.path : undefined // Only update if new file
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validations
      }
    );

    if (!updatedEducationDetails) {
      return res.status(404).json({
        success: false,
        message: "Education details not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Education details updated successfully",
      data: updatedEducationDetails
    });

  } catch (error) {
    console.error("Error updating education details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const documentDetails = async(req,res)=>{
  const id = req.params.id;
 
  try{
    const data = await EducationDetails.findById(id).select('fullName programSelection updatedAt document');
    if(!data){
    return  res.json({message:"User not Exist"});
    }

    return res.status(200).json(data);
  }catch(error){
    return res.status(500).json({
      message: "Server error"
    })    
}}

const getDataForUpdate= async(req,res)=>{
  const id = req.params.id;
  try{
    const data = await EducationDetails.findById(id)
    return res.status(200).json(data)
  }catch(error){
    return res.status(500).json({message:'Server error',error:error.message})
  }
}


const updateAllEducationDetails = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      programSelection,
      specialization,
      emailAddress,
      startingDate,
      address,
      endingDate,
      city,
      nomineeDetails,
      pincode,
      relation,
    } = req.body;


    const {id} = req.params;

    if (
      !fullName &&
      !phoneNumber &&
      !programSelection &&
      !specialization &&
      !emailAddress &&
      !startingDate &&
      !address &&
      !endingDate &&
      !city &&
      !nomineeDetails &&
      !pincode &&
      !relation
    ) {
      return res.status(400).json({ message: "Enter fields first" });
    }

    // Find the record by ID
    const educationDetails = await EducationDetails.findById(id);

    if (!educationDetails) {
      return res.status(404).json({
        message: "Id not found",
      });
    }
    // Update the fields if they are provided
    if (fullName) educationDetails.fullName = fullName;
    if (phoneNumber) educationDetails.phoneNumber = phoneNumber;
    if (programSelection) educationDetails.programSelection = programSelection;
    if (emailAddress) educationDetails.emailAddress = emailAddress;
    if (startingDate) educationDetails.startingDate = startingDate;
    if (address) educationDetails.address = address;
    if (endingDate) educationDetails.endingDate = endingDate;
    if (city) educationDetails.city = city;
    if (nomineeDetails) educationDetails.nomineeDetails = nomineeDetails;
    if (pincode) educationDetails.pincode = pincode;
    if (relation) educationDetails.relation = relation;

    // Save the updated document to the database
    await educationDetails.save();

    return res.status(200).json({
      message: "All EducationDetails updated successfully",
      data: educationDetails,
    });

  } catch (error) {
    console.error("Error updating EducationDetails:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getProgramSelection = (req, res) => {
  const programs = [
    "SSC",
    "HSC",
      "B.Tech / B.E.",
      "B.Sc",
      "B.Com",
      "BBA",
      "BA",
      "M.Tech / M.S.",
      "M.Sc",
      "MBA",
      "MA",
      "PhD",
      "Diploma in Engineering",
      "Diploma in Management",
      "Diploma in Computer Science",
      "Diploma in Arts",
      "Diploma in Hospitality Management",
      "Diploma in Nursing",
      "Diploma in Pharmacy"
    ];

  return res.status(200).json(programs);
};

const getSpecializations = (req, res) => {
  const specializations = {
      "B.Tech / B.E.": [
        "Computer Science and Engineering",
        "Electrical Engineering",
        "Mechanical Engineering",
        "Civil Engineering",
        "Electronics and Communication Engineering",
        "Information Technology",
        "Chemical Engineering",
        "Aerospace Engineering",
        "Biotechnology",
        "Industrial Engineering",
        "Environmental Engineering",
        "Petroleum Engineering",
        "Automobile Engineering",
        "Mining Engineering"
      ],
      "B.Sc": [
        "Computer Science",
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biology",
        "Environmental Science",
        "Agricultural Science",
        "Biotechnology",
        "Data Science",
        "Zoology",
        "Botany",
        "Microbiology"
      ],
      "B.Com": [
        "General",
        "Accounting",
        "Finance",
        "Banking and Insurance",
        "Taxation",
        "Business Analytics",
        "E-Commerce",
        "International Business"
      ],
      "BBA": [
        "Marketing",
        "Finance",
        "Human Resource Management",
        "International Business",
        "Entrepreneurship",
        "Supply Chain Management",
        "Retail Management",
        "Hospitality Management"
      ],
      "BA": [
        "English Literature",
        "Political Science",
        "Psychology",
        "Sociology",
        "History",
        "Economics",
        "Philosophy",
        "Geography",
        "Journalism and Mass Communication",
        "Fine Arts",
        "Public Administration",
        "Education",
        "Law"
      ],
      "M.Tech / M.S.": [
        "Software Engineering",
        "Artificial Intelligence",
        "Data Science",
        "Machine Learning",
        "Cybersecurity",
        "Robotics",
        "Embedded Systems",
        "VLSI Design",
        "Power Systems",
        "Structural Engineering",
        "Environmental Engineering",
        "Aerospace Engineering",
        "Telecommunication Engineering",
        "Renewable Energy"
      ],
      "M.Sc": [
        "Computer Science",
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biochemistry",
        "Biotechnology",
        "Microbiology",
        "Zoology",
        "Botany",
        "Environmental Science",
        "Geology",
        "Data Science",
        "Applied Mathematics",
        "Genetics",
        "Forensic Science"
      ],
      "MBA": [
        "Marketing Management",
        "Finance Management",
        "Human Resource Management",
        "Operations Management",
        "International Business",
        "Supply Chain Management",
        "Digital Marketing",
        "Entrepreneurship",
        "Information Technology Management",
        "Banking and Financial Services",
        "Retail Management",
        "Hospitality Management",
        "Tourism Management"
      ],
      "MA": [
        "English Literature",
        "Political Science",
        "Sociology",
        "Economics",
        "Psychology",
        "History",
        "Public Administration",
        "Philosophy",
        "Geography",
        "Linguistics",
        "Education",
        "Journalism and Mass Communication",
        "Fine Arts",
        "Social Work"
      ],
      "PhD": [
        "Computer Science and Engineering",
        "Electrical Engineering",
        "Mechanical Engineering",
        "Civil Engineering",
        "Chemical Engineering",
        "Biotechnology",
        "Artificial Intelligence",
        "Data Science",
        "Mathematics",
        "Physics",
        "Environmental Science",
        "Business Administration",
        "Psychology",
        "Literature and Languages",
        "Medical Sciences",
        "Law"
      ],
      "Diploma in Engineering": [
        "Civil Engineering",
        "Mechanical Engineering",
        "Electrical Engineering",
        "Computer Science Engineering",
        "Electronics Engineering",
        "Automobile Engineering",
        "Textile Engineering",
        "Fashion Designing",
        "Graphic Designing",
        "Hospitality Management",
        "Hotel Management",
        "Pharmacy",
        "Nursing",
        "Web Development",
        "Animation and Multimedia",
        "Accounting and Finance"
      ],
      "Diploma in Management": [
        "Business Administration",
        "Marketing",
        "Human Resource Management",
        "Finance",
        "Retail Management",
        "Hospitality Management",
        "Tourism Management",
        "Event Management"
      ],
      "Diploma in Computer Science": [
        "Web Development",
        "Software Engineering",
        "Networking",
        "Cybersecurity",
        "Data Science",
        "Artificial Intelligence",
        "Mobile App Development",
        "Cloud Computing",
        "Database Management",
        "Game Development"
      ],
      "Diploma in Arts": [
        "Fine Arts",
        "Graphic Design",
        "Fashion Designing",
        "Interior Designing",
        "Animation",
        "Photography",
        "Music",
        "Film Making",
        "Theatre Arts"
      ],
      "Diploma in Hospitality Management": [
        "Hotel Management",
        "Tourism Management",
        "Event Management",
        "Food and Beverage Management",
        "Catering Management",
        "Travel and Tourism",
        "Leisure and Recreation"
      ],
      "Diploma in Nursing": [
        "General Nursing",
        "Mental Health Nursing",
        "Pediatric Nursing",
        "Obstetric Nursing",
        "Community Health Nursing",
        "Critical Care Nursing"
      ],
      "Diploma in Pharmacy": [
        "Pharmaceutical Chemistry",
        "Pharmacology",
        "Pharmaceutical Technology",
        "Clinical Pharmacy",
        "Medicinal Chemistry"
      ]

    // Add other programs and their specializations here...
  };

  const program = req.query.program;
  if (specializations[program]) {
    return res.status(200).json(specializations[program]);
  } else {
    return res.status(404).json({ message: "Program not found" });
  }
};

module.exports = {
  saveEducationDetails,
  getEducationDetails,
  deleteEducationDetails,
  updateEducationDetails,
  documentDetails,
  getDataForUpdate,
  updateAllEducationDetails,
  getProgramSelection,
  getSpecializations
};
