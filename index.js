const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/work', require('./routes/work'));
app.use('/api/manager', require('./routes/manager'));
app.use('/api/companies', require('./routes/companies'));

const seedAdmin = require('./utils/seeder');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hours_calculator')
  .then(async () => {
    console.log('MongoDB Connected');
    await seedAdmin();
  })
  .catch(err => console.log(err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
