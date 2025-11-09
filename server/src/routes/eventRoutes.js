const express = require('express');
const { getEvents, postEvent } = require('../controllers/eventController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getEvents);
router.post('/', authenticate, postEvent);

module.exports = router;
