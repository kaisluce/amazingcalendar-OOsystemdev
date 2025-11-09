const express = require('express');
const {
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
} = require('../controllers/eventController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getEvents);
router.post('/', authenticate, postEvent);
router.get('/user', getUserEvents);
router.get('/upcoming', authenticate, getUpcoming);
router.get('/past', authenticate, getPast);
router.put('/:eventId', authenticate, putEvent);
router.delete('/:eventId', authenticate, removeEvent);
router.post('/:eventId/invite', authenticate, inviteUser);
router.post('/:eventId/respond', authenticate, respondInvitation);
router.get('/:eventId/participants', getParticipants);
router.delete('/:eventId/participants/:participantId', authenticate, removeParticipant);

module.exports = router;
