const { prisma } = require('../config/prisma');

function listNotifications() {
  return prisma.notification.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

module.exports = { listNotifications };
