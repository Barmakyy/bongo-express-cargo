import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/authRoutes.js';
import dashboardRouter from './routes/dashboardRoutes.js';
import shipmentRouter from './routes/shipmentRoutes.js';
import customerRouter from './routes/customerRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
import staffRouter from './routes/staffRoutes.js';
import staffDashboardRouter from './routes/staffDashboardRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import settingRouter from './routes/settingRoutes.js';
import uploadRouter from './routes/uploadRoutes.js';
import customerDashboardRouter from './routes/customerDashboardRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import trackingRouter from './routes/trackingRoutes.js';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/shipments', shipmentRouter);
app.use('/api/customers', customerRouter);
app.use('/api/staff', staffRouter);
app.use('/api/staff-dashboard', staffDashboardRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/messages', messageRouter);
app.use('/api/settings', settingRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/customer-dashboard', customerDashboardRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/track', trackingRouter);

// A simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Connection to MongoDB failed:', error.message);
  });