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

async function createEventForUser({ title, description, startTime, endTime, location, userId }) {
  console.log('[EventService] createEventForUser payload', {
    title,
    startTime,
    endTime,
    userId
  });

  const creator = await prisma.user.findUnique({ where: { id: userId } });
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

async function inviteParticipant({ eventId, email, inviterId }) {
  console.log('[EventService] inviteParticipant', { eventId, email, inviterId });
  const event = await prisma.event.findUnique({
    where: { id: Number(eventId) }
  });
  if (!event) {
    throw new Error('Event not found');
  }

  if (event.createdById !== inviterId) {
    const err = new Error('Only the creator can invite participants');
    err.code = 'FORBIDDEN';
    throw err;
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

async function updateEvent({ eventId, userId, payload }) {
  console.log('[EventService] updateEvent', { eventId, userId });
  const event = await prisma.event.findUnique({
    where: { id: Number(eventId) },
    include: {
      participants: true
    }
  });

  if (!event) {
    const err = new Error('Event not found');
    err.code = 'EVENT_NOT_FOUND';
    throw err;
  }

  const isCreator = event.createdById === userId;
  if (!isCreator) {
    const err = new Error('Forbidden');
    err.code = 'FORBIDDEN';
    throw err;
  }

  const data = {};
  ['title', 'description', 'startTime', 'endTime', 'location'].forEach((field) => {
    if (payload[field] !== undefined) {
      if (field === 'startTime' || field === 'endTime') {
        data[field] = new Date(payload[field]);
      } else {
        data[field] = payload[field];
      }
    }
  });

  if (Object.keys(data).length === 0) {
    const err = new Error('No fields to update');
    err.code = 'NO_UPDATES';
    throw err;
  }

  return prisma.event.update({
    where: { id: event.id },
    data,
    include: sanitizeEventInclude()
  });
}

async function updateParticipationStatus({ eventId, userId, status }) {
  console.log('[EventService] updateParticipationStatus', { eventId, userId, status });
  const participant = await prisma.eventParticipant.findUnique({
    where: {
      eventId_userId: {
        eventId: Number(eventId),
        userId: userId
      }
    }
  });
  if (!participant) {
    const err = new Error('Participation not found');
    err.code = 'PARTICIPATION_NOT_FOUND';
    throw err;
  }

  return prisma.eventParticipant.update({
    where: { id: participant.id },
    data: { status },
    include: {
      event: { select: { id: true, title: true } },
      user: { select: { id: true, email: true } }
    }
  });
}

async function deleteEvent({ eventId, userId }) {
  console.log('[EventService] deleteEvent', { eventId, userId });
  const event = await prisma.event.findUnique({ where: { id: Number(eventId) } });
  if (!event) {
    const err = new Error('Event not found');
    err.code = 'EVENT_NOT_FOUND';
    throw err;
  }

  if (event.createdById !== userId) {
    const err = new Error('Forbidden');
    err.code = 'FORBIDDEN';
    throw err;
  }

  await prisma.eventParticipant.deleteMany({ where: { eventId: event.id } });
  await prisma.event.delete({ where: { id: event.id } });
  return { success: true };
}

async function removeParticipant({ eventId, participantId, actorId }) {
  console.log('[EventService] removeParticipant', { eventId, participantId, actorId });
  const participant = await prisma.eventParticipant.findUnique({
    where: { id: Number(participantId) },
    include: {
      event: true
    }
  });

  if (!participant || participant.eventId !== Number(eventId)) {
    const err = new Error('Participation not found');
    err.code = 'PARTICIPATION_NOT_FOUND';
    throw err;
  }

  const isCreator = participant.event.createdById === actorId;
  const isSelf = participant.userId === actorId;

  if (!isCreator && !isSelf) {
    const err = new Error('Forbidden');
    err.code = 'FORBIDDEN';
    throw err;
  }

  await prisma.eventParticipant.delete({ where: { id: participant.id } });
  return { success: true };
}

module.exports = {
  listEvents,
  createEventForUser,
  inviteParticipant,
  listParticipants,
  listEventsForUser,
  getUpcomingEvents,
  getPastEvents,
  updateEvent,
  deleteEvent,
  updateParticipationStatus,
  removeParticipant
};
