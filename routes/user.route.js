// routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();
const checkCompanyId = require("../middlewares/checkCompanyId.middleware");

// POST endpoint to add a user
router.post('/createUser', userController.createUser);

// Login endpoint
router.post('/login', userController.loginUser);

// Forgot password endpoint
router.post('/forgot-password', userController.forgotPassword);

//verify otp
router.post('/verify-otp', userController.verifyOtp);

// Reset password endpoint
router.post('/reset-password', userController.resetPassword);

//search_user
router.get("/search-user", userController.searchUser)

router.post("/send-message", checkCompanyId, userController.sendMessage)

//view-profile

router.get("/view-profile/:id", checkCompanyId, userController.viewProfile)

router.post("/edit-profile/:id", checkCompanyId, userController.editProfile)

// Protected routes - Apply access control middleware
// router.get('/dashboard', verifyToken, checkAccess, (req, res) => res.send('Dashboard Page'));
// router.get('/settings', verifyToken, checkAccess, (req, res) => res.send('Settings Page'));
// router.get('/profile', verifyToken, checkAccess, (req, res) => res.send('Profile Page'));


module.exports = router;
