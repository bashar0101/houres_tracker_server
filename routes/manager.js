const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const manager = require('../middleware/managerMiddleware');
const WorkSession = require('../models/WorkSession');
const User = require('../models/User'); // Import User model

// @route   GET api/manager/all-work
// @desc    Get all work sessions for all users in company
// @access  Private/Manager
router.get('/all-work', [auth, manager], async (req, res) => {
  try {
    // Find users in the same company
    const companyUsers = await User.find({ company: req.user.company }).select('_id');
    const userIds = companyUsers.map(user => user._id);

    const sessions = await WorkSession.find({ userId: { $in: userIds } })
      .populate('userId', ['username', 'role'])
      .sort({ startTime: -1 });
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/manager/users
// @desc    Get all users in company
// @access  Private/Manager
router.get('/users', [auth, manager], async (req, res) => {
    try {
        const users = await User.find({ company: req.user.company }).select('-password');
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
        let user = await User.findOne({ _id: req.params.id, company: req.user.company });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Prevent manager from demoting themselves
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

// @route   GET api/manager/requests
// @desc    Get pending user requests
// @access  Private/Manager
router.get('/requests', [auth, manager], async (req, res) => {
    try {
        const users = await User.find({ company: req.user.company, status: 'pending' }).select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/manager/requests/:id
// @desc    Approve or Reject user
// @access  Private/Manager
router.put('/requests/:id', [auth, manager], async (req, res) => {
    const { status } = req.body; // 'active' or 'rejected'
    if (!['active', 'rejected'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status' });
    }

    try {
        let user = await User.findOne({ _id: req.params.id, company: req.user.company });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.status = status;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
