const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});

const upload = multer({ storage: storage });

// POST route to create a new employee
router.get("/leaveTaken/:id", leaveController.leavesTaken);
router.get("/leavePending/:id", leaveController.pendingLeaves);
router.get("/totalLeaves/:id", leaveController.totalLeaves);
router.post(
  "/applyLeave",
  upload.fields([{ name: "document", maxCount: 1 }]),
  leaveController.uploadLeaveData
);
router.get("/allLeaveData/:leaveId", leaveController.getLeaveWithEmployeeData);
router.get("/getEmployeeLeave",leaveController.getEmployeeLeave);
router.get("/getEmployeeLeaveSummary/:id",leaveController.getEmployeeLeaveSummary);
router.get("/getEmployeeLeaveStatusAndApproval/:id",leaveController.getEmployeeLeaveStatusAndApproval);
router.get("/getLeaveTypes",leaveController.getLeaveTypes);
router.get("/getUserForLeaveApply",leaveController.getUserForLeaveApply);
router.post("/leaveApproval/:leaveId",leaveController.leaveApproval);
router.get("/getAllLeaves/:id",leaveController.getAllLeavesOfEmployee);
router.get("/getUpComingLeave",leaveController.getUpComingLeave);
router.get("/todayLeave",leaveController.todayLeave);
router.get("/searchEmployees",leaveController.searchEmployees);
router.get("/getApprovedLeavesOfEmployee/:id",leaveController.getApprovedLeavesOfEmployee);
module.exports = router;
