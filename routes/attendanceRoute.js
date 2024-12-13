const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Attendance summary
router.get('/getAttendanceSummaryByMonth/:employeeId', attendanceController.getAttendanceSummaryByMonth);

// Mark attendance
router.post('/mark', attendanceController.markAttendance);
//Weekly attendance
router.get('/weeklyAttendance/:employeeId', attendanceController.getWeeklyAttendance);

router.get('/getTwoMonthAttendance/:employeeId',attendanceController.getTwoMonthAttendance)

router.get('/getEmployeeList',attendanceController.getEmployeeList)

router.get('/getAllEmployeeAttendanceDetails',attendanceController.getAllEmployeeAttendanceDetails)
router.get('/getMonthlyAttendance', attendanceController.getMonthlyAttendance);
// router.get('/weeklyAttendance',attendanceController.weeklyAttendance)
router.get('/getDailyAttendancePercentage',attendanceController.getDailyAttendancePercentage)

module.exports = router;