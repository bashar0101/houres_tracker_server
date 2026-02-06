const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const manager = require('../middleware/managerMiddleware');
const WorkSession = require('../models/WorkSession');
const User = require('../models/User'); // Import User model

// @route   GET api/manager/all-work
// @desc    Get all work sessions for all users
// @access  Private/Manager
router.get('/all-work', [auth, manager], async (req, res) => {
  try {
    const sessions = await WorkSession.find()
      .populate('userId', ['username', 'role'])
      .sort({ startTime: -1 });
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/manager/users
// @desc    Get all users
// @access  Private/Manager
router.get('/users', [auth, manager], async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/manager/users/:id/role
// @desc    Update user role
// @access  Private/Manager
router.put('/users/:id/role', [auth, manager], async (req, res) => {
    const { role } = req.body;
    if (!['user', 'manager'].includes(role)) {
        return res.status(400).json({ msg: 'Invalid role' });
    }

    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Prevent manager from demoting themselves (optional safety)
        if (req.user.id === req.params.id && role === 'user') {
             return res.status(400).json({ msg: 'Cannot demote yourself' });
        }

        user.role = role;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
