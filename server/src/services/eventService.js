const { prisma } = require('../config/prisma');

function listEvents() {
  console.log('[EventService] listEvents invoked');
  return prisma.event.findMany({
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }
    },
    orderBy: { startTime: 'asc' }
  });
}

function createEvent({ title, description, startTime, endTime, location, createdById }) {
  console.log('[EventService] createEvent payload', {
    title,
    startTime,
    endTime,
    createdById
  });
  return prisma.event.create({
    data: {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      createdBy: { connect: { id: createdById } }
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      participants: true
    }
  });
}

module.exports = { listEvents, createEvent };
