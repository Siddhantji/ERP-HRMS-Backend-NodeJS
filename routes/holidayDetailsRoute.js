const express = require('express');
const router = express.Router();
const holidayDetailsController = require('../controllers/holidayDetailsController');

//post api for creating holiday details

router.post('/createHoliday',holidayDetailsController.createHoliday);
router.get('/getHolidayByDate',holidayDetailsController.getHolidayByDate);
router.get('/getAllHolidayDetails',holidayDetailsController.getAllHolidayDetails);

module.exports =router;