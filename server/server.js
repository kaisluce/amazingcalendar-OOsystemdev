const express = require('express');
const cors = require('cors');
const { env } = require('./src/config/env');
const authRoutes = require('./src/routes/authRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const { requestLogger } = require('./src/middleware/requestLogger');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'amazing-calendar-node' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`Amazing Calendar Node API running on port ${env.port}`);
});
