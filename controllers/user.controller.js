// controllers/userController.js
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const AccessTable = require('../models/accessTable.model');
const Company = require("../models/company.model");



// Nodemailer setup for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use any email service
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASSWORD  // Your email password or app-specific password
  }
});

// Function to generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString(); // Generates a 6-digit OTP
};


// Forgot Password Controller
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if(!email) {
      return res.status(400).json({message : "please enter valid email"})
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    user.otp = otp;
    user.forgotPassword = otpExpiry;
    await user.save();

    // Email message
    const message = `
      <h1>Password Reset Request</h1>
      <p>Hi ${user.name},</p>
      <p>You have requested to reset your password. Please use otp to reset your password:</p>
      <b> ${otp} </b>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // Send email with reset link
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      // to: user.email,
      to :email,
      subject: 'Password Reset Request',
      html: message
    });

    return res.status(200).json({ message: 'Password reset OTP sent to email' });
  } catch (error) {
    return res.status(500).json({ message: 'Error sending password reset email', error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    let userDetails = await User.findOne({ email });
    if (!userDetails) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    if(otp !== userDetails.otp){
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    return res.status(200).json({ message : 'OTP matched successfull' })
  } catch (error) {
    return res.status(500).json({ message : error.message })
  }
}

// Reset Password Controller
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user's password and save
    user.password = passwordHash;
    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const { name, qualification, email, grade, birthdate, address, 
      marital_status, city, state, zip_code, anniversary_date, role, password, companyId,department } = req.body;
    
    // Hash the password before saving
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create a new user object
    const newUser = new User({
      name,
      qualification,
      email,
      grade,
      birthdate:new Date(birthdate),
      address,
      marital_status,
      city,
      state,
      zip_code,
      department,
      anniversary_date:new Date(anniversary_date),
      role,
      password:password_hash,
      companyId
    });

    // Save the user to the database
    await newUser.save();
    return res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

const loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find user by username
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check if password is correct
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Fetch user's access permissions
      // const accessRecord = await AccessTable.findOne({ email });
      // if (!accessRecord) {
      //   return res.status(403).json({ message: 'Access denied: No access record found for user' });
      // }
  
      // Generate a JWT token
      const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Set the cookie with the token
      res.cookie('authToken', token, {
        httpOnly: true,        // Prevents JavaScript from accessing the cookie
        secure: true,          // Ensures the cookie is sent over HTTPS only
        sameSite: 'Strict',    // Ensures the cookie is not sent with cross-site requests
        maxAge: 3600000        // Cookie expiration time (1 hour in milliseconds)
      });
      const company = await Company.findById(user.companyId);
      // Send a response with user details or redirect URL
      // const redirectUrl = accessRecord.allowedPages.length ? accessRecord.allowedPages[0] : '/default'; // Default or first allowed page
      return res.status(200).json({ message: 'Login successful',token,id: user._id, companyId:user.companyId , companyName:company.name });
    } catch (error) {
      return res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};


async function searchUser(req, res) {
  try {
    // Extract the search query from the request
    const searchQuery = req.query.search;

    // Search for users by name or email using a case-insensitive regex
    const users = await User.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },  // Match name (case-insensitive)
        { email: { $regex: searchQuery, $options: 'i' } }  // Match email (case-insensitive)
      ]
    });

    // Return the matching users as a JSON response
    return res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

//send message email to user

const sendMessage = async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Configure the transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Configure mail options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: message
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email sent successfully' });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

//view user profile

async function viewProfile(req, res) {
  try {
    const { id } = req.params;
    
    // Fetch user and exclude sensitive fields
    const user = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Standardized success response
    return res.status(200).json({ success: true, data: user });
    
  } catch (error) {
    console.error(`Error viewing user profile for ID ${req.params.id}:`, error);

    // Standardized error response
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}


//edit profile
const editProfile = async (req, res) => {
  try {
    // Validate request body (optional)
    // You can add validation rules for specific fields here

    const { id } = req.params;
    const { name, qualification, email, grade, birthdate, address, marital_status, city, state, zip_code, anniversary_date, role, password, companyId } = req.body;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    user.name = name;
    user.qualification = qualification;
    user.email = email;
    user.grade = grade;
    user.birthdate = birthdate; // Assuming birthdate is a Date object
    user.address = address;
    user.marital_status = marital_status;
    user.city = city;
    user.state = state;
    user.zip_code = zip_code;
    user.anniversary_date = anniversary_date; // Assuming anniversary_date is a Date object
    user.role = role;
    user.companyId = companyId;

    // Handle password update separately (optional)
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    // Save the updated user
    await user.save();

    res.json({ message: 'User profile updated successfully',data:user });
  } catch (error) {
    console.error('Error editing user profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


  

module.exports = {
  createUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  searchUser,
  sendMessage,
  viewProfile,
  editProfile
};
