const express = require('express');
const {
  getEvents,
  postEvent,
  inviteUser,
  getParticipants,
  getUserEvents,
  getUpcoming,
  getPast
} = require('../controllers/eventController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getEvents);
router.post('/', postEvent);
router.get('/user', getUserEvents);
router.get('/upcoming', authenticate, getUpcoming);
router.get('/past', authenticate, getPast);
router.post('/:eventId/invite', inviteUser);
router.get('/:eventId/participants', getParticipants);

module.exports = router;
