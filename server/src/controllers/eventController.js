const {
  listEvents,
  createEventWithCreatorEmail,
  inviteParticipant,
  listParticipants,
  listEventsForUser,
  getUpcomingEvents,
  getPastEvents
} = require('../services/eventService');

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
    const { title, description, startTime, endTime, location, createdByEmail } = req.body;
    if (!title || !startTime || !endTime || !createdByEmail) {
      console.warn('[EventController] postEvent missing fields', {
        title: !!title,
        startTime,
        endTime,
        createdByEmail
      });
      return res.status(400).json({ message: 'Title, startTime, endTime, and createdByEmail are required' });
    }
    console.log('[EventController] postEvent attempt', { title, createdByEmail });
    const event = await createEventWithCreatorEmail({
      title,
      description,
      startTime,
      endTime,
      location,
      createdByEmail
    });
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
    const participant = await inviteParticipant({ eventId, email });
    return res.status(201).json(participant);
  } catch (error) {
    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (error.code === 'ALREADY_INVITED') {
      return res.status(400).json({ message: 'Already invited' });
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

module.exports = {
  getEvents,
  postEvent,
  inviteUser,
  getParticipants,
  getUserEvents,
  getUpcoming,
  getPast
};
