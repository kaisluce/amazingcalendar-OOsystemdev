const { listNotifications } = require('../services/notificationService');

async function getNotifications(req, res) {
  try {
    const notifications = await listNotifications();
    return res.json(notifications);
  } catch (error) {
    console.error('[NotificationController] getNotifications error', error.message);
    return res.status(500).json({ message: 'Unable to fetch notifications' });
  }
}

module.exports = { getNotifications };
