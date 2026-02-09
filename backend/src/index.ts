import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, ensureSchema } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import eventsRoutes from './routes/events.js';
import gigsRoutes from './routes/gigs.js';
import messagesRoutes from './routes/messages.js';
import uploadsRoutes from './routes/uploads.js';
import applicationsRoutes from './routes/applications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/gigs', gigsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/applications', applicationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
import { createServer } from 'http';
import { initWebSocket } from './websocket/socket.js';

async function start() {
  console.log('🚀 Starting KrewsUp Backend Server...\n');
  
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  await ensureSchema();
  
  // Create HTTP server and attach WebSocket
  const server = createServer(app);
  initWebSocket(server);
  
  server.listen(PORT, () => {
    console.log(`\n✨ Server running at http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket server ready`);
    console.log('\nAvailable routes:');
    console.log('  POST   /api/auth/register');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/auth/me');
    console.log('  POST   /api/auth/set-role');
    console.log('  POST   /api/auth/onboarding');
    console.log('  GET    /api/users/profile');
    console.log('  PUT    /api/users/profile');
    console.log('  GET    /api/events');
    console.log('  POST   /api/events');
    console.log('  GET    /api/gigs/browse/all');
    console.log('  POST   /api/gigs/:id/apply');
    console.log('  GET    /api/messages/conversations');
    console.log('  ...and more\n');
  });
}

start();
