const Holiday = require('../models/holidayDetailsModel');

const createHoliday = async (req, res) => {
  try {
    const { holidayTitle, date, type, location } = req.body;

    if (!holidayTitle || !date || !type || !location) {
      return res.status(400).json({ message: "All fields are required..." });
    }

    // Extract month from date
    const dateObj = new Date(date);
    const month = dateObj.toLocaleString('default', { month: 'long' });

    const allData = new Holiday({ 
      holidayTitle, 
      date, 
      month, // Extracted month
      type, 
      location 
    });

    await allData.save();
    return res.status(200).json({
      message: "Holiday details saved successfully",
      data: allData,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error saving Holiday details",
      error: error.message,
    });
  }
};
  

  const getHolidayByDate = async(req,res)=>{
    try{
        const {date} = req.query;

       if(!date){
           return res.status(400).json({message:"Provide any Date.."});
        }

        const holiday = await Holiday.find({date})

        if(holiday.length===0){
           return res.status(404).json({message:"There are no any holiday on this date"});
        }

       return res.status(200).json(holiday);
    }catch(error){
        return res.status(500).json({
            message: "Error  Holiday details",
            error: error.message,
          });
    }
  }

// const getHolidayByDate = async (req, res) => {
//     try {
//       const { date } = req.query;
  
//       if (!date) {
//         return res.status(400).json({ message: "Please provide a date." });
//       }
  
//       const holiday = await Holiday.find({ date });
  
//       if (holiday.length === 0) {
//         return res.status(404).json({ message: "No holidays found on this date." });
//       }
  
//       return res.status(200).json(holiday);
//     } catch (error) {
//       return res.status(500).json({
//         message: "Error retrieving holiday details",
//         error: error.message,
//       });
//     }
//   };

const getAllHolidayDetails = async (req,res)=>{
  try {
    // Find all holidays and sort them by month and date within each month
    const holidays = await Holiday.find().sort({ month: 1, date: 1 });

    // Group holidays by month, allowing for multiple holidays in each month
    const holidaysByMonth = holidays.reduce((acc, holiday) => {
      // Initialize the month array if it doesn't exist
      if (!acc[holiday.month]) {
        acc[holiday.month] = [];
      }
      // Add the holiday to the month array
      acc[holiday.month].push({
        holidayTitle: holiday.holidayTitle,
        date: holiday.date,
        // type: holiday.type,
        // location: holiday.location,
      });
      return acc;
    }, {});

    // Convert the holidaysByMonth object into an array for sorting
    const sortedHolidaysByMonth = Object.keys(holidaysByMonth)
      .sort((a, b) => {
        const monthOrder = {
          January: 1,
          February: 2,
          March: 3,
          April: 4,
          May: 5,
          June: 6,
          July: 7,
          August: 8,
          September: 9,
          October: 10,
          November: 11,
          December: 12,
        };
        return monthOrder[a] - monthOrder[b];
      })
      .map(month => ({
        month,
        holidays: holidaysByMonth[month],
      }));

    return res.status(200).json({
      year: 2024,
      companyHolidays: sortedHolidaysByMonth,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving holidays', error });
  }
}
  
  module.exports={
    createHoliday,
    getHolidayByDate,
    getAllHolidayDetails
  }