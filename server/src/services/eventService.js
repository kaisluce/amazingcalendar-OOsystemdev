const { Prisma } = require('@prisma/client');
const { prisma } = require('../config/prisma');

function sanitizeEventInclude() {
  return {
    createdBy: { select: { id: true, name: true, email: true } },
    participants: {
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    }
  };
}

async function listEvents() {
  console.log('[EventService] listEvents invoked');
  return prisma.event.findMany({
    include: sanitizeEventInclude(),
    orderBy: { startTime: 'asc' }
  });
}

async function createEventWithCreatorEmail({ title, description, startTime, endTime, location, createdByEmail }) {
  console.log('[EventService] createEventWithCreatorEmail payload', {
    title,
    startTime,
    endTime,
    createdByEmail
  });

  const creator = await prisma.user.findUnique({ where: { email: createdByEmail } });
  if (!creator) {
    throw new Error('Creator not found');
  }

  return prisma.event.create({
    data: {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      createdBy: { connect: { id: creator.id } }
    },
    include: sanitizeEventInclude()
  });
}

async function inviteParticipant({ eventId, email }) {
  console.log('[EventService] inviteParticipant', { eventId, email });
  const event = await prisma.event.findUnique({ where: { id: Number(eventId) } });
  if (!event) {
    throw new Error('Event not found');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  const existing = await prisma.eventParticipant.findUnique({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: user.id
      }
    }
  });
  if (existing) {
    const err = new Error('User already invited');
    err.code = 'ALREADY_INVITED';
    throw err;
  }

  return prisma.eventParticipant.create({
    data: {
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      status: 'INVITED'
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, title: true } }
    }
  });
}

async function listParticipants(eventId) {
  console.log('[EventService] listParticipants', { eventId });
  const event = await prisma.event.findUnique({
    where: { id: Number(eventId) }
  });
  if (!event) {
    throw new Error('Event not found');
  }

  return prisma.eventParticipant.findMany({
    where: { eventId: event.id },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
}

async function listEventsForUser(email) {
  console.log('[EventService] listEventsForUser', { email });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  const createdEvents = await prisma.event.findMany({
    where: { createdById: user.id },
    include: sanitizeEventInclude()
  });

  const invitedEvents = await prisma.eventParticipant.findMany({
    where: { userId: user.id },
    include: {
      event: {
        include: sanitizeEventInclude()
      }
    }
  });

  return {
    user: { id: user.id, name: user.name, email: user.email },
    created: createdEvents,
    invited: invitedEvents.map((participant) => ({
      status: participant.status,
      event: participant.event
    }))
  };
}

async function getUpcomingEvents(userId) {
  console.log('[EventService] getUpcomingEvents', { userId });
  const now = new Date();
  return prisma.event.findMany({
    where: {
      AND: [
        {
          OR: [
            { createdById: userId },
            { participants: { some: { userId } } }
          ]
        },
        { startTime: { gte: now } }
      ]
    },
    orderBy: { startTime: 'asc' },
    include: sanitizeEventInclude()
  });
}

async function getPastEvents(userId) {
  console.log('[EventService] getPastEvents', { userId });
  const now = new Date();
  return prisma.event.findMany({
    where: {
      AND: [
        {
          OR: [
            { createdById: userId },
            { participants: { some: { userId } } }
          ]
        },
        { endTime: { lt: now } }
      ]
    },
    orderBy: { startTime: 'desc' },
    include: sanitizeEventInclude()
  });
}

module.exports = {
  listEvents,
  createEventWithCreatorEmail,
  inviteParticipant,
  listParticipants,
  listEventsForUser,
  getUpcomingEvents,
  getPastEvents
};
