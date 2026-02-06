const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    let manager = await User.findOne({ username: 'manager' });
    
    // Always ensure default company exists
    let company = await Company.findOne({ name: 'company' });
    if (!company) {
        company = new Company({ name: 'company' });
        await company.save();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);

    if (manager) {
        manager.password = hashedPassword;
        manager.company = company._id; // Ensure link
        manager.status = 'active'; // Ensure active
        manager.role = 'manager'; // Ensure role
        await manager.save();
        console.log('Manager account updated: username=manager, password=password');
        return;
    }

    const newManager = new User({
      username: 'manager',
      password: hashedPassword,
      role: 'manager',
      company: company._id,
      status: 'active'
    });

    await newManager.save();
    
    company.owner = newManager.id;
    await company.save();

    console.log('Default Manager account created: username=manager, password=password, company=company');
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
};

module.exports = seedAdmin;
