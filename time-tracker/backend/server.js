const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const timeEntryRoutes = require('./routes/timeEntries');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const teamRoutes = require('./routes/teams');
const breakRoutes = require('./routes/breaks');
const organizationRoutes = require('./routes/organizations');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('short'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/breaks', breakRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
