import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import authRouter from './routes/auth.js';
import facilitiesRouter from './routes/facilities.js';
import bookingsRouter from './routes/bookings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for development credentials
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Initialize database schema and then start listener
const startServer = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Backend Server is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database. Server cannot start.', error);
    process.exit(1);
  }
};

startServer();
