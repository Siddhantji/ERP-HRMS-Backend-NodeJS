const express = require("express");
const router = express.Router();
const path = require("path");
const EducationDetailsController = require("../controllers/EducationDetailsController"); // Correct import
const multer = require("multer");

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Directory to store uploaded documents
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname); // Unique file name with timestamp
  },
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

// Route for saving education details with document upload
router.post("/saveEducationDetails", upload.single("document"), EducationDetailsController.saveEducationDetails);
router.get("/showEducationDetails/:id",  EducationDetailsController.getEducationDetails);
router.delete("/deleteEducationDetails/:id",  EducationDetailsController.deleteEducationDetails);
router.put("/updateEducationDetails/:id", upload.single("document"), EducationDetailsController.updateEducationDetails);
router.get("/documentDetails/:id",  EducationDetailsController.documentDetails);
router.get('/document/:id',EducationDetailsController.getDataForUpdate)
router.put("/updateAllEducationDetails/:id",  EducationDetailsController.updateAllEducationDetails); 
router.get('/programSelection', EducationDetailsController.getProgramSelection);
router.get('/specializations', EducationDetailsController.getSpecializations);


module.exports = router;