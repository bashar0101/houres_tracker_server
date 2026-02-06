const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const WorkSession = require('../models/WorkSession');

// @route   POST api/work/start
// @desc    Start a work session
// @access  Private
router.post('/start', auth, async (req, res) => {
  try {
    // Check if there is already an active session
    const activeSession = await WorkSession.findOne({ 
      userId: req.user.id, 
      endTime: null 
    });

    if (activeSession) {
        return res.status(400).json({ msg: 'Session already active' });
    }

    const newSession = new WorkSession({
      userId: req.user.id,
      startTime: Date.now()
    });

    const session = await newSession.save();
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/work/stop
// @desc    Stop a work session
// @access  Private
router.post('/stop', auth, async (req, res) => {
  try {
    const session = await WorkSession.findOne({ 
        userId: req.user.id, 
        endTime: null 
    }).sort({ startTime: -1 });

    if (!session) {
      return res.status(404).json({ msg: 'No active session found' });
    }

    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime; // Duration in ms

    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/work
// @desc    Get all work sessions for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await WorkSession.find({ userId: req.user.id }).sort({ startTime: -1 });
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/work/active
// @desc    Get active session if exists
// @access  Private
router.get('/active', auth, async (req, res) => {
    try {
        const session = await WorkSession.findOne({ 
            userId: req.user.id, 
            endTime: null 
        });
        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
