const {
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
  removeParticipant: removeParticipantService
} = require('../services/eventService');
const { notifyEventCreated, notifyInvitation } = require('../../../grpc/grpc-client');

async function getEvents(req, res) {
  try {
    console.log('[EventController] getEvents requested by', req.user ? req.user.sub : 'anonymous');
    const events = await listEvents();
    return res.json(events);
  } catch (error) {
    console.error('[EventController] getEvents error', error.message);
    return res.status(500).json({ message: 'Failed to fetch events' });
  }
}

async function postEvent(req, res) {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { title, description, startTime, endTime, location } = req.body;
    if (!title || !startTime || !endTime) {
      console.warn('[EventController] postEvent missing fields', {
        title: !!title,
        startTime,
        endTime
      });
      return res.status(400).json({ message: 'Title, startTime, and endTime are required' });
    }
    console.log('[EventController] postEvent attempt', { title, userId });
    const event = await createEventForUser({
      title,
      description,
      startTime,
      endTime,
      location,
      userId: Number(userId)
    });
    notifyEventCreated(event.title, event.createdBy?.email || event.createdBy?.name || String(event.createdById))
      .catch((err) => console.error('[EventController] notifyEventCreated failed', err.message || err));
    return res.status(201).json(event);
  } catch (error) {
    console.error('[EventController] postEvent error', error.message);
    const status = error.message === 'Creator not found' ? 404 : 400;
    return res.status(status).json({ message: error.message });
  }
}

async function inviteUser(req, res) {
  try {
    const { eventId } = req.params;
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const participant = await inviteParticipant({ eventId, email, inviterId: Number(userId) });
    notifyInvitation(email, participant.event?.title || 'Unknown event')
      .catch((err) => console.error('[EventController] notifyInvitation failed', err.message || err));
    return res.status(201).json(participant);
  } catch (error) {
    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (error.code === 'ALREADY_INVITED') {
      return res.status(400).json({ message: 'Already invited' });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Seul le créateur ou un participant ayant accepté peut inviter' });
    }
    if (error.message === 'Event not found') {
      return res.status(404).json({ message: 'Event not found' });
    }
    console.error('[EventController] inviteUser error', error.message);
    return res.status(400).json({ message: 'Unable to invite user' });
  }
}

async function getParticipants(req, res) {
  try {
    const { eventId } = req.params;
    const participants = await listParticipants(eventId);
    return res.json(participants);
  } catch (error) {
    const status = error.message === 'Event not found' ? 404 : 400;
    console.error('[EventController] getParticipants error', error.message);
    return res.status(status).json({ message: error.message });
  }
}

async function getUserEvents(req, res) {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' });
    }
    const payload = await listEventsForUser(email);
    return res.json(payload);
  } catch (error) {
    const status = error.code === 'USER_NOT_FOUND' ? 404 : 400;
    console.error('[EventController] getUserEvents error', error.message);
    return res.status(status).json({ message: error.message });
  }
}

async function getUpcoming(req, res) {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const events = await getUpcomingEvents(Number(userId));
    return res.json(events);
  } catch (error) {
    console.error('[EventController] getUpcoming error', error.message);
    return res.status(500).json({ message: 'Unable to fetch upcoming events' });
  }
}

async function getPast(req, res) {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const events = await getPastEvents(Number(userId));
    return res.json(events);
  } catch (error) {
    console.error('[EventController] getPast error', error.message);
    return res.status(500).json({ message: 'Unable to fetch past events' });
  }
}

async function putEvent(req, res) {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { eventId } = req.params;
    const payload = req.body || {};

    if (!payload.title && !payload.description && !payload.startTime && !payload.endTime && !payload.location) {
      return res.status(400).json({ message: 'At least one field is required to update' });
    }

    const updated = await updateEvent({
      eventId,
      userId: Number(userId),
      payload
    });
    return res.json(updated);
  } catch (error) {
    if (error.code === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Seul le créateur ou un participant ayant accepté peut modifier cet évènement' });
    }
    if (error.code === 'NO_UPDATES') {
      return res.status(400).json({ message: 'No fields to update' });
    }
    console.error('[EventController] putEvent error', error.message);
    return res.status(400).json({ message: 'Unable to update event' });
  }
}

async function respondInvitation(req, res) {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { eventId } = req.params;
    const { status } = req.body;
    if (!['ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be ACCEPTED or DECLINED' });
    }

    const participation = await updateParticipationStatus({
      eventId,
      userId: Number(userId),
      status
    });
    return res.json(participation);
  } catch (error) {
    if (error.code === 'PARTICIPATION_NOT_FOUND') {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    console.error('[EventController] respondInvitation error', error.message);
    return res.status(400).json({ message: 'Unable to update participation' });
  }
}

async function removeEvent(req, res) {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { eventId } = req.params;
    await deleteEvent({ eventId, userId: Number(userId) });
    return res.json({ message: 'Event deleted' });
  } catch (error) {
    if (error.code === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Only the creator can delete this event' });
    }
    console.error('[EventController] removeEvent error', error.message);
    return res.status(400).json({ message: 'Unable to delete event' });
  }
}

async function removeParticipant(req, res) {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { eventId, participantId } = req.params;
    await removeParticipantService({
      eventId,
      participantId,
      actorId: Number(userId)
    });
    return res.json({ message: 'Participant removed' });
  } catch (error) {
    if (error.code === 'PARTICIPATION_NOT_FOUND') {
      return res.status(404).json({ message: 'Participant not found' });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Action non autorisée' });
    }
    console.error('[EventController] removeParticipant error', error.message);
    return res.status(400).json({ message: 'Unable to remove participant' });
  }
}

module.exports = {
  getEvents,
  postEvent,
  inviteUser,
  getParticipants,
  getUserEvents,
  getUpcoming,
  getPast,
  putEvent,
  respondInvitation,
  removeEvent,
  removeParticipant
};
