const { Notification } = require("../models/notifications.model");

const createNotification = async (body) => {
  const { title, message, user, type, companyId } = body; // Extract companyId from the request body

  // Validate required fields
  if (!title || !message || !user || !companyId) {
    return { status: 400, message: "Title, message, user, and companyId are required." };
  }
  try {
    // Create a new notification document
    const newNotification = new Notification({
      title,
      message,
      user,
      type,
      companyId, 
      isRead: false, 
    });

    
    await newNotification.save();

    
    return { status: 201, message: "Notification created successfully", notification: newNotification };

  } catch (error) {
    // Handle error case
    console.log(error);
    
    return { status: 500, message: "Error creating notification", error: error.message };
  }
};


module.exports = createNotification;