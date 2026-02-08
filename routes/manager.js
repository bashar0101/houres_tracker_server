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
      .populate('userId', ['username', 'role', 'hourlyRate'])
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
const PDFDocument = require('pdfkit');

// @route   PUT api/manager/users/:id/salary
// @desc    Update user salary
// @access  Private/Manager
router.put('/users/:id/salary', [auth, manager], async (req, res) => {
    const { hourlyRate } = req.body;
    try {
        let user = await User.findOne({ _id: req.params.id, company: req.user.company });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.hourlyRate = hourlyRate;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/manager/users/:id/report
// @desc    Generate PDF report for user
// @access  Private/Manager
router.get('/users/:id/report', [auth, manager], async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, company: req.user.company });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const { month, year } = req.query;
        if (!month || !year) return res.status(400).send('Month and Year are required');

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const sessions = await WorkSession.find({
            userId: user._id,
            startTime: { $gte: startDate, $lte: endDate }
        }).sort({ startTime: 1 });

        const doc = new PDFDocument();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-${user.username}-${month}-${year}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text(`Work Report: ${user.username}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${month}/${year}`);
        doc.text(`Hourly Rate: $${user.hourlyRate || 0}/hr`);
        // doc.text(`Company: ${req.user.company}`); // req.user.company is ID, would need populate
        doc.moveDown();

        // Table Header
        doc.fontSize(10);
        let y = doc.y;
        doc.text('Date', 50, y);
        doc.text('Start Time', 150, y);
        doc.text('End Time', 250, y);
        doc.text('Duration', 350, y);
        doc.text('Earnings', 450, y);
        
        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        doc.moveDown();

        let totalDuration = 0;
        let totalEarnings = 0;

        sessions.forEach(session => {
            if (!session.endTime) return; // Skip active sessions
            doc.moveDown(0.5);
            y = doc.y;

            if (y > 700) { // New page
                doc.addPage();
                y = 50;
            }

            const date = new Date(session.startTime).toLocaleDateString();
            const start = new Date(session.startTime).toLocaleTimeString();
            const end = new Date(session.endTime).toLocaleTimeString();
            
            const durationMs = session.duration;
            const hours = durationMs / (1000 * 60 * 60);
            const earnings = hours * (user.hourlyRate || 0);

            totalDuration += durationMs;
            totalEarnings += earnings;

            const durationStr = `${Math.floor(hours)}h ${Math.floor((durationMs / (1000 * 60)) % 60)}m`;

            doc.text(date, 50, y);
            doc.text(start, 150, y);
            doc.text(end, 250, y);
            doc.text(durationStr, 350, y);
            doc.text(`$${earnings.toFixed(2)}`, 450, y);
        });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Totals
        const totalHours = totalDuration / (1000 * 60 * 60);
        doc.fontSize(12).text(`Total Hours: ${totalHours.toFixed(2)} hrs`, { align: 'right' });
        doc.text(`Total Earnings: $${totalEarnings.toFixed(2)}`, { align: 'right' });

        doc.end();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
