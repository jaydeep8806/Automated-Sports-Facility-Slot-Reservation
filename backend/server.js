import express from 'express';
process.env.TZ = 'Asia/Kolkata';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import authRouter from './routes/auth.js';
import facilitiesRouter from './routes/facilities.js';
import bookingsRouter from './routes/bookings.js';
import canteenRouter from './routes/canteen.js';
import usersRouter from './routes/users.js';
import reviewsRouter from './routes/reviews.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for all client origins & live link deployments
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// API healthcheck endpoint
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Sports Facility Booking System API is running.' });
});

// Register routers
app.use('/api/auth', authRouter);
app.use('/api/facilities', facilitiesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/canteen', canteenRouter);
app.use('/api/users', usersRouter);
app.use('/api/reviews', reviewsRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Initialize database schema and then start listener
const startServer = async () => {
  try {
    await initDb();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend Server is listening on port ${PORT} (0.0.0.0)`);
    });
  } catch (error) {
    console.error('Failed to initialize database. Server cannot start.', error);
    process.exit(1);
  }
};

startServer();
