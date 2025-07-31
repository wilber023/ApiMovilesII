const express = require('express');
const router = express.Router();
const {
  sendNotificationToAll,
  sendNotificationToUser,
  getNotifications,
  markAsRead
} = require('../controllers/notificationController');
const { protect, isAdmin } = require('../middleware/isAdmin');

// Rutas para admin
router.post('/send-all', protect, isAdmin, sendNotificationToAll);
router.post('/send-user/:userId', protect, isAdmin, sendNotificationToUser);
router.get('/history', protect, isAdmin, getNotifications);

// Rutas para usuarios
router.put('/read/:notificationId', protect, markAsRead);

module.exports = router;