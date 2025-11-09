const { createEvent, listEvents } = require('../services/eventService');

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
    const { title, description, startTime, endTime, location } = req.body;
    if (!title || !startTime || !endTime) {
      console.warn('[EventController] postEvent missing fields', { title: !!title, startTime, endTime });
      return res.status(400).json({ message: 'Title, startTime, and endTime are required' });
    }
    console.log('[EventController] postEvent attempt', {
      title,
      creator: req.user?.sub
    });
    const event = await createEvent({
      title,
      description,
      startTime,
      endTime,
      location,
      createdById: req.user?.sub
    });
    return res.status(201).json(event);
  } catch (error) {
    console.error('[EventController] postEvent error', error.message);
    return res.status(400).json({ message: error.message });
  }
}

module.exports = { getEvents, postEvent };
