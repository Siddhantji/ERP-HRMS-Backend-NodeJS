const express = require("express");
const connectDB = require("./config/db");
const employeeRoutes = require("./routes/employeeRoutes");
const notificationRoutes = require("./routes/notification.route");
const companyRoutes = require("./routes/company.route");
const dashboardRoutes = require("./routes/dashboard.route");
const userRoutes = require("./routes/user.route");
const hrmEmployee = require("./routes/HRMEmployeeRoute");
const leaveRoutes = require("./routes/leaveRoute");
const attendance = require("./routes/attendanceRoute");
const EducationDetailsRoutes = require("./routes/EducationDetailsRoute");
const event = require('./routes/eventRoute')
const mangeExpenseRoute = require("./routes/mangeExpenseRoute");
const holidayDetailsRoute = require('./routes/holidayDetailsRoute')
const cors = require("cors");
const User = require("./models/user.model");
// Connect to MongoDB
connectDB();

const app = express();
app.use(express.json()); // Handles JSON payloads

app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200, // Allow all origins (for development purposes; adjust for production)
  })
);

//data
const usersData = [
  {
    name: "John Doe",
    qualification: "Bachelor's in Marketing",
    email: "john.doe@example.com",
    grade: "A",
    birthdate: "1990-05-20",
    address: "123 Main St",
    marital_status: "single",
    city: "New York",
    state: "New York",
    zip_code: "10001",
    anniversary_date: "2022-06-15",
    role: "user",
    password_hash: "hashed_password_1", // Replace with hashed password
    department: "marketing",
    company: "66d82e9c10ad580a646b7ac3", // Replace with a valid ObjectId for Company
    active_projects: [], // This will reference ActiveProject model entries
    upcoming_leaves: [], // This will reference Leave model entries
    status: "working",
    notes: [
      {
        text: "Completed orientation and initial training.",
      },
    ],
  },
  {
    name: "Jane Smith",
    qualification: "Master's in Finance",
    email: "jane.smith@example.com",
    grade: "B",
    birthdate: "1985-08-14",
    address: "456 Elm St",
    marital_status: "married",
    city: "San Francisco",
    state: "California",
    zip_code: "94107",
    anniversary_date: "2020-04-18",
    role: "finance",
    password_hash: "hashed_password_2", // Replace with hashed password
    department: "finance",
    company: "66d82e9c10ad580a646b7ac2", // Replace with a valid ObjectId for Company
    active_projects: [],
    upcoming_leaves: [],
    status: "on leave",
    notes: [
      {
        text: "On leave for maternity.",
        author: "hr_user_id_2", // Replace with a valid ObjectId for User
      },
    ],
  },
  {
    name: "Michael Johnson",
    qualification: "Bachelor's in Sales Management",
    email: "michael.johnson@example.com",
    grade: "C",
    birthdate: "1982-01-05",
    address: "789 Maple St",
    marital_status: "divorced",
    city: "Chicago",
    state: "Illinois",
    zip_code: "60605",
    anniversary_date: "2019-11-30",
    role: "hr",
    password_hash: "hashed_password_3", // Replace with hashed password
    department: "sales",
    company: "66d82e9c10ad580a646b7ac1", // Replace with a valid ObjectId for Company
    active_projects: [],
    upcoming_leaves: [],
    status: "working",
    notes: [
      {
        text: "Currently handling three major accounts.",
        author: "admin_user_id_3", // Replace with a valid ObjectId for User
      },
    ],
  },
  {
    name: "Emily Brown",
    qualification: "Master's in Environmental Science",
    email: "emily.brown@example.com",
    grade: "A",
    birthdate: "1995-03-22",
    address: "101 Oak St",
    marital_status: "single",
    city: "Seattle",
    state: "Washington",
    zip_code: "98101",
    anniversary_date: "2021-09-15",
    role: "user",
    password_hash: "hashed_password_4", // Replace with hashed password
    department: "marketing",
    company: "66d82e9c10ad580a646b7ac0", // Replace with a valid ObjectId for Company
    active_projects: [],
    upcoming_leaves: [],
    status: "working",
    notes: [
      {
        text: "Initiated a new environmental campaign.",
        author: "admin_user_id_4", // Replace with a valid ObjectId for User
      },
    ],
  },
];

app.get("/", (req, res) => {
  res.send("Welcome to surgisol");
});

//seed data
app.post("/seed_data", async (req, res) => {
  try {
    // Loop through each user data, hash the password, and update the object
    const hashedUsersData = await Promise.all(
      usersData.map(async (user) => {
        // Hash the password before saving
        // console.log(user)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(
          user.password_hash,
          saltRounds
        ); // Hash the password with a salt round of 10
        return { ...user, password: hashedPassword }; // Return the user data with hashed password
      })
    );

    // Insert the users with hashed passwords into the database
    let result = await User.insertMany(hashedUsersData);

    return res.status(201).json({ message: "Data seeding successful", data: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.use("/api/users", userRoutes);
// Middleware

app.use(express.urlencoded({ extended: true })); // Handles URL-encoded form data
app.use("/uploads", express.static("uploads")); // Make uploads publicly accessible

// Routes
app.use("/api/employees", employeeRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/hrmEmployee", hrmEmployee);
app.use("/api/leave", leaveRoutes);
app.use("/api/attendance", attendance);
app.use('/api/eductionDetails',EducationDetailsRoutes)
app.use('/api/event',event)
app.use('/api/manageExpense',mangeExpenseRoute)
app.use("/api/holiday",holidayDetailsRoute)
// Error handling
app.use((err, req, res, next) => {
  return res.status(500).json({ error: err.message });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
