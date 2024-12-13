const Expense = require("../models/mangeExpenseModel");
const HRMEmployee = require("../models/HRMEmployeeModel");

const getExpenseCategory=(req, res) => {
  const Categories = ["Travel", "Food", "Gifts", "Stationary", "Other"];
  try {
    return res.status(200).json(Categories);
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    return res.status(500).json({ message: "Server error", error: error.message});
  }
};

const addTravelExpense = async (req, res) => {
  try {
    const {
      name,
      employeeId,
      place,
      date,
      city,
      outSideOfCity,
      modeOfTransport,
      amount,
      placeVisited,
      departure,
      destination,
      billNumber,
      workingRemark,
      travelDate,
    } = req.body;

    if (!name || !place || !date || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Name, place, date and employeeId are required",
      });
    }

    // Validate and parse dates
    const expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Generate month string from date
    const month =
      expenseDate.toLocaleString("default", { month: "long" }) +
      " " +
      expenseDate.getFullYear();

    const travelExpense = {
      date: expenseDate,
      city,
      outSideOfCity,
      modeOfTransport,
      amount: amount || { cash: 0, online: 0 },
      placeVisited,
      departure,
      destination,
      billNumber,
      workingRemark,
      travelDate,
      receipt: req.file ? req.file.path : null,
      status: "pending",
    };

    const startOfDay = new Date(expenseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(expenseDate);
    endOfDay.setHours(23, 59, 59, 999);

    let expense = await Expense.findOne({
      employeeId,
      month,
    });

    if (expense) {
      // Find if there's already an expense for this date
      let dayExpense = expense.dailyExpenses.find(
        (day) =>
          new Date(day.date) >= startOfDay && new Date(day.date) <= endOfDay
      );

      if (dayExpense) {
        dayExpense.travels.push(travelExpense);
      } else {
        expense.dailyExpenses.push({
          date: expenseDate,
          travels: [travelExpense],
        });
      }
    } else {
      expense = new Expense({
        name,
        employeeId,
        place,
        month,
        dailyExpenses: [
          {
            date: expenseDate,
            travels: [travelExpense],
          },
        ],
      });
    }

    expense.dailyExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

    await expense.save();

    return res.status(201).json({
      success: true,
      message: "Travel expense added successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error adding travel expense:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addFoodExpense = async (req, res) => {
  try {
    const {
      name,
      employeeId,
      place,
      date,
      city,
      outSideOfCity,
      // modeOfTransport,
      amount,
      mealType,
      billNumber,
    } = req.body;

    // Check for required fields
    if (!name || !place || !date || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Name, place, date, and employeeId are required",
      });
    }

    // Validate and parse date
    const expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Generate month string from date
    const month =
      expenseDate.toLocaleString("default", { month: "long" }) +
      " " +
      expenseDate.getFullYear();

    // Define travel expense object
    const foodExpense = {
      date: expenseDate,
      city,
      outSideOfCity,
      //modeOfTransport,
      amount: amount || { cash: 0, online: 0 },
      mealType,
      billNumber,
      receipt: req.file ? req.file.path : null,
      status: "pending",
    };

    // Define the start and end of the day for the expense date
    const startOfDay = new Date(expenseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(expenseDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find or create an expense entry
    let expense = await Expense.findOne({
      employeeId,
      month,
    });

    if (expense) {
      // Check if a daily expense already exists for the specified date
      let dayExpense = expense.dailyExpenses.find(
        (day) =>
          new Date(day.date) >= startOfDay && new Date(day.date) <= endOfDay
      );

      if (dayExpense) {
        dayExpense.foods.push(foodExpense);
      } else {
        expense.dailyExpenses.push({
          date: expenseDate,
          foods: [foodExpense],
        });
      }
    } else {
      // Create a new expense entry
      expense = new Expense({
        name,
        employeeId,
        place,
        month,
        dailyExpenses: [
          {
            date: expenseDate,
            foods: [foodExpense],
          },
        ],
      });
    }

    // Sort daily expenses by date
    expense.dailyExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

    await expense.save();

    return res.status(201).json({
      success: true,
      message: "Food expense added successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error adding food expense:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// api for getting name, manager, and department from HRMEmployee model

const getEmployeeNameAndDepartment = async (req, res) => {
  try {
    const {id} = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
    }
    const employees = await HRMEmployee.findById(id)
      .select('employeeName department manager -_id')
      .lean();
 

    return res.status(200).json({
      success: true,
      data: employees
    });

  } catch (error) {
    console.error("Error fetching employee details:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const manageExpenseForStationary = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      place,
      date,
      amount,
      billNumber,
      description,
      itemName,
      quantity,
      purpose
    } = req.body;

    // Validate required fields
    if (!name || !place || !date || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Name, place, date, and employeeId are required"
      });
    }

    // Validate date format
    const expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    // Generate month string from date
    const month = expenseDate.toLocaleString('default', { month: 'long' }) + ' ' + expenseDate.getFullYear();

    // Define the stationary expense object
    const stationaryExpense = {
      date: expenseDate,
      amount: amount || { cash: 0, online: 0 },
      billNumber,
      description,
      itemName,
      quantity,
      purpose,
      receipt: req.file ? req.file.path : null,
      status: "pending"
    };

    // Define start and end of the day for date comparison
    const startOfDay = new Date(expenseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(expenseDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find existing expense entry for the employee
    let expense = await Expense.findOne({
      employeeId,
      month
    });

    // If expense exists, update daily expenses
    if (expense) {
      let dayExpense = expense.dailyExpenses.find(day => 
        new Date(day.date) >= startOfDay && new Date(day.date) <= endOfDay
      );
      if (dayExpense) {
        dayExpense.stationeries.push(stationaryExpense); // Add the stationery expense to the existing day
      } else {
        expense.dailyExpenses.push({
          date: expenseDate,
          stationeries: [stationaryExpense] // Add a new entry for the day if it doesn't exist
        });
      }
    } else {
      // If no expense record, create a new one
      expense = new Expense({
        name,
        employeeId,
        place,
        month,
        dailyExpenses: [{
          date: expenseDate,
          stationeries: [stationaryExpense]
        }]
      });
    }

    // Sort daily expenses by date
    expense.dailyExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Save the expense record
    await expense.save();

    res.status(200).json({ success: true, message: "Stationery expense saved successfully", data: expense });
  } catch (error) {
    console.error("Error saving stationery expense:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const manageExpenseForGifts = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      place,
      date,
      amount,
      billNumber,
      description,
      receiverName,
      receiverNumber,
      purpose,
    } = req.body;

    // Validate required fields
    if (!name || !place || !date || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Name, place, date and employeeId are required"
      });
    }
    
    // Validate date format
    const expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    // Get the month for the expense record
    const month = expenseDate.toLocaleString('default', { month: 'long' }) + ' ' + expenseDate.getFullYear();

    // Define the gift expense object
    const giftsExpense = {
      date: expenseDate,
      amount: amount || { cash: 0, online: 0 },
      billNumber,
      description,
      receiverName,
      receiverNumber,
      purpose,
      receipt: req.file ? req.file.path : null,
      status: "pending"
    };

    // Define start and end of the day
    const startOfDay = new Date(expenseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(expenseDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find existing expense entry for the employee
    let expense = await Expense.findOne({
      employeeId,
      month
    });

    // If expense exists, update daily expenses
    if (expense) {
      let dayExpense = expense.dailyExpenses.find(day => 
        new Date(day.date) >= startOfDay && new Date(day.date) <= endOfDay
      );
      if (dayExpense) {
        dayExpense.gifts.push(giftsExpense); // Add the gift expense to the existing day
      } else {
        expense.dailyExpenses.push({
          date: expenseDate,
          gifts: [giftsExpense] // Add a new entry for the day if it doesn't exist
        });
      }
    } else {
      // If no expense record, create a new one
      expense = new Expense({
        name,
        employeeId,
        place,
        month,
        dailyExpenses: [{
          date: expenseDate,
          gifts: [giftsExpense]
        }]
      });
    }

    // Sort daily expenses by date
    expense.dailyExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Save the expense record
    await expense.save();

    res.status(200).json({ message: "Gift expense saved successfully", data: expense });
  } catch (error) {
    console.error("Error saving gift expense:", error);
    res.status(500).json({ message: error.message });
  }
};


const manageExpenseForOther = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      place,
      date,
      amount,
      billNumber,
      description,
    } = req.body;

    // Validate required fields
    if (!name || !place || !date || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Name, place, date, and employeeId are required"
      });
    }

    // Validate date format
    const expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    // Get the month for the expense record
    const month = expenseDate.toLocaleString('default', { month: 'long' }) + ' ' + expenseDate.getFullYear();

    // Define the other expense object
    const otherExpense = {
      date: expenseDate,
      amount: amount || { cash: 0, online: 0 },
      billNumber,
      description,
      receipt: req.file ? req.file.path : null,
      status: "pending"
    };

    // Define start and end of the day
    const startOfDay = new Date(expenseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(expenseDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find existing expense entry for the employee
    let expense = await Expense.findOne({
      employeeId,
      month
    });

    // If expense exists, update daily expenses
    if (expense) {
      let dayExpense = expense.dailyExpenses.find(day => 
        new Date(day.date) >= startOfDay && new Date(day.date) <= endOfDay
      );
      if (dayExpense) {
        dayExpense.others.push(otherExpense); // Add the other expense to the existing day
      } else {
        expense.dailyExpenses.push({
          date: expenseDate,
          others: [otherExpense] // Add a new entry for the day if it doesn't exist
        });
      }
    } else {
      // If no expense record, create a new one
      expense = new Expense({
        name,
        employeeId,
        place,
        month,
        dailyExpenses: [{
          date: expenseDate,
          others: [otherExpense]
        }]
      });
    }

    // Sort daily expenses by date
    expense.dailyExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Save the expense record
    await expense.save();

    res.status(200).json({ message: "Other expense saved successfully", data: expense });
  } catch (error) {
    console.error("Error saving other expense:", error);
    res.status(500).json({ message: error.message });
  }
};

const getExpenseHistory = async (req, res) => {
  const { employeeId } = req.params;
  const expenseDate = new Date();
  const month = expenseDate.toLocaleString('default', { month: 'long' }) + ' ' + expenseDate.getFullYear();
  try {
    
    const expenses = await Expense.find({ month:month, employeeId }).select("dailyExpenses");
   
    const expenseHistory = expenses.flatMap((expense) => 
      expense.dailyExpenses.flatMap((dailyExpense) =>
        ['travels', 'foods', 'gifts', 'stationeries', 'others'].flatMap((category) =>
          dailyExpense[category].map((item) => {
              const amount = (item.amount?.cash || 0) + (item.amount?.online || 0);
              let status="";
              switch (category) {
                case 'gifts':
                 
                   status=item.status || " ";
                  break;
                case 'stationeries':
                 
                   status=item.status || " ";
                  break;
                case 'others':
                 
                  status=item.status || " ";
                  break;
                case 'travels':
                 
                  status=item.status || " ";
                  break;
                case 'foods':
                 
                  status=item.status || " ";
                  break;
              }

              return {
                id:item.id,
                date: (item.date),
                category,
                amount,
                status
              };
            
            
          })
        )
      )
    );
    const totalExpenseHistory = expenseHistory.filter(expense => expense.status === "approved");

   const totalExpense = totalExpenseHistory.reduce((accumulator, item) => accumulator + item.amount, 0);
    return res.status(200).json({ totalExpenseHistory, totalExpense });
  } catch (error) {
    console.error("Error fetching expense history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getExpenseStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.query; // Get optional filters from query parameters

    // Fetch expenses for the given employee ID
    const expensesArray = await Expense.find({ employeeId }).select("dailyExpenses")  //.lean();

    if (!expensesArray || expensesArray.length === 0) {
      return res.status(404).json({ message: "No expenses found for this employee." });
    }

    // Reduce across all records in the expensesArray to collect daily expenses
    let expenseDetails = expensesArray.reduce((acc, expenses) => {
      expenses.dailyExpenses.forEach(dailyExpense => {
        const categories = [
          { category: "Travel", expenses: dailyExpense.travels },
          { category: "Food", expenses: dailyExpense.foods },
          { category: "Gift", expenses: dailyExpense.gifts },
          { category: "Stationary", expenses: dailyExpense.stationeries },
          { category: "Other", expenses: dailyExpense.others }
        ];

        // Collect all expenses into acc
        categories.forEach(({ category, expenses }) => {
          expenses.forEach(item => {
            acc.push({
              date: item.date,
              expenseCategory: category,
              amount: (item.amount?.cash || 0) + (item.amount?.online || 0),
              status: item.status,
            });
          });
        });
      });
      return acc;
    }, []);

    // Apply default sorting by date in ascending order
    expenseDetails = expenseDetails.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Apply optional filters
    if (status) {
      expenseDetails = expenseDetails.filter(expense => expense.status === status);
    }

    return res.status(200).json(expenseDetails);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getEmployeeListsForSales = async (req, res) => {
  try {
    const { employeeName } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const data = { department: "Sales" };
    if (employeeName) {
      data.employeeName = employeeName;
    }

    // Get total count
    const totalCount = await HRMEmployee.countDocuments(data);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated employees
    const employees = await HRMEmployee.find(
      data,
      "_id employeeName empId jobTitle"
    )
    .skip(skip)
    .limit(limit);

    if (!employees || employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No employees found in Sales."
      });
    }

    const employeesId = employees.map(employee => employee._id);
    const expenseDate = new Date();
    const month = expenseDate.toLocaleString("default", { month: "long" }) + " " + expenseDate.getFullYear();

    const expensesArray = await Expense.find({
      month: month,
      employeeId: { $in: employeesId }
    });

    // Calculate total amount per employee
    const summary = employees.map(employee => {
      const employeeExpenses = expensesArray.filter(
        expense => expense.employeeId.toString() === employee._id.toString()
      );

      const totalAmount = employeeExpenses.reduce((total, expense) => {
        let expenseTotal = 0;
        expense.dailyExpenses.forEach(daily => {
          ['travels', 'foods', 'gifts', 'stationeries', 'others'].forEach(category => {
            if (daily[category]) {
              daily[category].forEach(item => {
                expenseTotal += (item.amount?.cash || 0) + (item.amount?.online || 0);
              });
            }
          });
        });
        return total + expenseTotal;
      }, 0);

      return {
        name: employee.employeeName,
        empId: employee.empId,
        jobTitle: employee.jobTitle,
        totalAmount
      };
    });

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
        summary
      }
    });

  } catch (error) {
    console.error("Error fetching employee expenses:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getEmployeeListsForScreening = async (req, res) => {
  try {
    const { employeeName } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const data = { department: "Screening" };
    if (employeeName) {
      data.employeeName = employeeName;
    }

    // Get total count
    const totalCount = await HRMEmployee.countDocuments(data);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated employees
    const employees = await HRMEmployee.find(
      data,
      "_id employeeName empId jobTitle"
    )
    .skip(skip)
    .limit(limit);

    if (!employees || employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No employees found in Screening."
      });
    }

    const employeesId = employees.map(employee => employee._id);
    const expenseDate = new Date();
    const month = expenseDate.toLocaleString("default", { month: "long" }) + " " + expenseDate.getFullYear();

    const expensesArray = await Expense.find({
      month: month,
      employeeId: { $in: employeesId }
    });

    // Calculate total amount per employee
    const summary = employees.map(employee => {
      const employeeExpenses = expensesArray.filter(
        expense => expense.employeeId.toString() === employee._id.toString()
      );

      const totalAmount = employeeExpenses.reduce((total, expense) => {
        let expenseTotal = 0;
        expense.dailyExpenses.forEach(daily => {
          ['travels', 'foods', 'gifts', 'stationeries', 'others'].forEach(category => {
            if (daily[category]) {
              daily[category].forEach(item => {
                expenseTotal += (item.amount?.cash || 0) + (item.amount?.online || 0);
              });
            }
          });
        });
        return total + expenseTotal;
      }, 0);

      return {
        name: employee.employeeName,
        empId: employee.empId,
        jobTitle: employee.jobTitle,
        totalAmount
      };
    });

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
        summary
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
  addFoodExpense,
  getExpenseCategory,
  addTravelExpense,
  getEmployeeNameAndDepartment,
  manageExpenseForStationary,
  manageExpenseForGifts,
  manageExpenseForOther,
  getExpenseHistory,
  getExpenseStatus,
  getEmployeeListsForSales,
  getEmployeeListsForScreening,
};