const express = require('express');
const {
  getEvents,
  postEvent,
  inviteUser,
  getParticipants,
  getUserEvents,
  getUpcoming,
  getPast,
  putEvent
} = require('../controllers/eventController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getEvents);
router.post('/', authenticate, postEvent);
router.get('/user', getUserEvents);
router.get('/upcoming', authenticate, getUpcoming);
router.get('/past', authenticate, getPast);
router.put('/:eventId', authenticate, putEvent);
router.post('/:eventId/invite', inviteUser);
router.get('/:eventId/participants', getParticipants);

module.exports = router;
