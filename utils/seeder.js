const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const manager = await User.findOne({ username: 'manager' });
    if (manager) {
      console.log('Manager account already exists.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash('password', salt);
    const hashedPassword = 'password';

    const newManager = new User({
      username: 'manager',
      password: hashedPassword,
      role: 'manager'
    });

    await newManager.save();
    console.log('Default Manager account created: username=manager, password=password');
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
};

module.exports = seedAdmin;
