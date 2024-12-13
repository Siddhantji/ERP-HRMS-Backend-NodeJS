const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const multer = require("multer");
const fs = require('fs');

// Set up storage engine for photo uploads
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Create new employee
router.post(
  "/create",
  upload.fields([{ name: "photo", maxCount: 1 }]),
  employeeController.addNewCandidate
);

// Search employees
router.get("/search", employeeController.searchEmployees);//d

// Upload documents for employees
//router.post('/upload/:id', upload.single('file'), employeeController.uploadDocuments);

router.put(
  "/upload/:id",
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "relievingLetter", maxCount: 1 },
    { name: "bankDetails", maxCount: 1 },
    { name: "aadharCard", maxCount: 1 },
    { name: "postalAddress", maxCount: 1 },
    { name: "permanentAddress", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  employeeController.uploadDocuments
);

// View profile of an employee
router.get("/profile/:id", employeeController.viewProfile);//d

//Get Candidate Name
router.get("/getCandidateNameByDepartment", employeeController.getCandidateName);//d

//get candidate data on basis of fullName and department
router.get("/viewcandidate", employeeController.getCandidate);//d

// Get all employees
router.get("/", employeeController.getAllEmployees);//d

//get all  in true or false
//router.get('/checkAllFields/:id',employeeController.checkAllFields);
// get all documents
router.get("/getallDocument/:id", employeeController.getAllDocuments);//d

router.put("/changedata/:id", employeeController.updateCandidateData);// d

router.get("/getDepartment", employeeController.getCandidateDepartment);//d

router.get("/allDepartments", employeeController.getAllDepartment);//d

router.get("/employeeType", employeeController.getEmployeetype);//d

router.get("/positiontype", employeeController.getPositiontype);//done

//send mail
router.post("/sendMail", employeeController.sendMail); //done

router.get("/viewNotUploadedDocuments/:id",employeeController.viewNotUploadedDocuments)

router.get("/getEmployeeCountForCurrentMonth",employeeController.getEmployeeCountForCurrentMonth);

// route for getStates  getCities
router.get("/getStates", employeeController.getStates);
router.get("/getCities", employeeController.getCities);
router.get("/getCountries", employeeController.getCountry);

module.exports = router;
