const express = require('express');
const router = express.Router();
const notificationController = require("../controllers/notification.controller")
const checkCompanyId = require("../middlewares/checkCompanyId.middleware");



// Route to create a notification
router.post('/notifications', checkCompanyId, notificationController.createNotification);

// Route to get notifications for a specific user
router.get('/notifications/:userId', checkCompanyId, notificationController.getNotificationsForUser);

// Route to mark a notification as read
router.patch('/notifications/:notificationId/read', checkCompanyId, notificationController.markNotificationAsRead);

// Route to delete a notification
router.delete('/notifications/:notificationId', checkCompanyId, notificationController.deleteNotification);



module.exports = router;