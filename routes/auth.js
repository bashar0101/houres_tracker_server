const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const auth = require('../middleware/authMiddleware');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password, type, companyName, companyId } = req.body;

  try {
    let user = await User.findOne({ username });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    let company;
    let role = 'user';
    let status = 'pending';

    if (type === 'create') {
        if (!companyName) {
            return res.status(400).json({ msg: 'Company name is required' });
        }
        let existingCompany = await Company.findOne({ name: companyName });
        if (existingCompany) {
            return res.status(400).json({ msg: 'Company already exists' });
        }
        
        company = new Company({ name: companyName });
        role = 'manager';
        status = 'active';

    } else if (type === 'join') {
        if (!companyId) {
            return res.status(400).json({ msg: 'Company selection is required' });
        }
        company = await Company.findById(companyId);
        if (!company) {
             return res.status(404).json({ msg: 'Company not found' });
        }
    } else {
        return res.status(400).json({ msg: 'Invalid registration type' });
    }

    user = new User({
      username,
      password,
      role,
      company: company._id,
      status
    });

    const salt = await bcrypt.genSalt(10);
    // user.password = await bcrypt.hash(password, salt);
    // using plain text as per user request
    user.password = password;

    await user.save();
    
    if (type === 'create') {
        company.owner = user.id;
        await company.save();
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        company: user.company
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        // If pending, maybe don't return token or client handles it?
        // Let's return token but client will check status
        res.json({ token, role: user.role, status: user.status });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    if (user.status === 'pending') {
        return res.status(403).json({ msg: 'Account is pending approval' });
    }
    if (user.status === 'rejected') {
        return res.status(403).json({ msg: 'Account has been rejected' });
    }

    // i do not want to use bcrypt
    // const isMatch = await bcrypt.compare(password, user.password);
    const isMatch = password === user.password;
    
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        company: user.company
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role, company: user.company });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
});
