import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

let io: Server;
const callParticipants = new Map<string, Set<string>>();

export function initWebSocket(server: HttpServer) {
  const originEnv = process.env.CORS_ORIGIN;
  const origins = originEnv ? originEnv.split(',').map(o => o.trim()).filter(Boolean) : true;
  io = new Server(server, {
    cors: {
      origin: origins,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.id || decoded.userId;
      socket.userRole = decoded.role;
      if (!socket.userId) {
        return next(new Error('Invalid token payload'));
      }
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join all event groups the user is part of
    joinUserEventGroups(socket);

    // Send message to event group
    socket.on('send_message', async (data: { conversationId: string; content: string }) => {
      try {
        const { conversationId, content } = data;
        
        // Save message to database
        const messageId = crypto.randomUUID();
        await db.execute({
          sql: `INSERT INTO messages (id, conversation_id, sender_id, content, message_type)
                VALUES (?, ?, ?, ?, 'text')`,
          args: [messageId, conversationId, socket.userId!, content],
        });

        // Get sender info
        const userResult = await db.execute({
          sql: 'SELECT name, avatar_url FROM users WHERE id = ?',
          args: [socket.userId!],
        });
        const sender = userResult.rows[0] as any;

        // Broadcast to conversation room
        const message = {
          id: messageId,
          conversationId,
          senderId: socket.userId,
          senderName: sender?.name || 'Unknown',
          senderAvatar: sender?.avatar_url,
          content,
          createdAt: new Date().toISOString(),
        };

        io.to(`conversation:${conversationId}`).emit('new_message', message);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Join a specific conversation room
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicator
    socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping: data.isTyping,
      });
    });

    socket.on('disconnect', () => {
      if ((socket as any).callIds) {
        for (const callId of (socket as any).callIds as Set<string>) {
          const participants = callParticipants.get(callId);
          if (participants) {
            participants.delete(socket.userId!);
            socket.to(`call:${callId}`).emit('call_user_left', { callId, userId: socket.userId });
            if (participants.size === 0) {
              callParticipants.delete(callId);
            }
          }
        }
      }
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });

    // Call signaling
    socket.on('call_invite', (data: { callId: string; toUserId: string; conversationId?: string; mode?: string }) => {
      if (!socket.userId) return;
      emitToUser(data.toUserId, 'call_invite', {
        callId: data.callId,
        fromUserId: socket.userId,
        conversationId: data.conversationId,
        mode: data.mode || 'direct',
      });
    });

    socket.on('call_join', (data: { callId: string }) => {
      if (!socket.userId) return;
      const callId = data.callId;
      socket.join(`call:${callId}`);
      const participants = callParticipants.get(callId) || new Set<string>();
      participants.add(socket.userId);
      callParticipants.set(callId, participants);
      (socket as any).callIds = (socket as any).callIds || new Set<string>();
      (socket as any).callIds.add(callId);
      const others = Array.from(participants).filter(id => id !== socket.userId);
      socket.emit('call_participants', { callId, participants: others });
      socket.to(`call:${callId}`).emit('call_user_joined', { callId, userId: socket.userId });
    });

    socket.on('call_leave', (data: { callId: string }) => {
      if (!socket.userId) return;
      const callId = data.callId;
      socket.leave(`call:${callId}`);
      const participants = callParticipants.get(callId);
      if (participants) {
        participants.delete(socket.userId);
        socket.to(`call:${callId}`).emit('call_user_left', { callId, userId: socket.userId });
        if (participants.size === 0) {
          callParticipants.delete(callId);
        }
      }
      if ((socket as any).callIds) {
        (socket as any).callIds.delete(callId);
      }
    });

    socket.on('webrtc_offer', (data: { callId: string; toUserId: string; sdp: any }) => {
      if (!socket.userId) return;
      emitToUser(data.toUserId, 'webrtc_offer', {
        callId: data.callId,
        fromUserId: socket.userId,
        sdp: data.sdp,
      });
    });

    socket.on('webrtc_answer', (data: { callId: string; toUserId: string; sdp: any }) => {
      if (!socket.userId) return;
      emitToUser(data.toUserId, 'webrtc_answer', {
        callId: data.callId,
        fromUserId: socket.userId,
        sdp: data.sdp,
      });
    });

    socket.on('webrtc_ice', (data: { callId: string; toUserId: string; candidate: any }) => {
      if (!socket.userId) return;
      emitToUser(data.toUserId, 'webrtc_ice', {
        callId: data.callId,
        fromUserId: socket.userId,
        candidate: data.candidate,
      });
    });
  });

  return io;
}

async function joinUserEventGroups(socket: AuthenticatedSocket) {
  try {
    // Get all event conversations user is part of
    const result = await db.execute({
      sql: `SELECT conversation_id FROM conversation_participants WHERE user_id = ?`,
      args: [socket.userId!],
    });

    for (const row of result.rows) {
      const conversationId = (row as any).conversation_id;
      socket.join(`conversation:${conversationId}`);
    }
  } catch (error) {
    console.error('Error joining user event groups:', error);
  }
}

// Helper to emit to a specific user
export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Helper to emit to a conversation
export function emitToConversation(conversationId: string, event: string, data: any) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}

// Create event group chat and add organizer
export async function createEventGroup(eventId: string, eventTitle: string, organizerId: string): Promise<string> {
  const conversationId = crypto.randomUUID();
  
  // Create the conversation
  await db.execute({
    sql: `INSERT INTO conversations (id, title, type, event_id) VALUES (?, ?, 'event', ?)`,
    args: [conversationId, `${eventTitle} - Team Chat`, eventId],
  });

  // Add organizer as participant
  await db.execute({
    sql: `INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)`,
    args: [conversationId, organizerId],
  });

  // Send system message
  const messageId = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO messages (id, conversation_id, sender_id, content, message_type)
          VALUES (?, ?, ?, ?, 'system')`,
    args: [messageId, conversationId, organizerId, 'Event group created. Accepted team members will join automatically.'],
  });

  return conversationId;
}

// Add accepted worker to event group
export async function addWorkerToEventGroup(eventId: string, workerId: string, workerName: string) {
  try {
    // Find the event's conversation
    const convResult = await db.execute({
      sql: `SELECT id FROM conversations WHERE event_id = ? AND type = 'event'`,
      args: [eventId],
    });

    if (convResult.rows.length === 0) {
      console.log('No event group found for event:', eventId);
      return;
    }

    const conversationId = (convResult.rows[0] as any).id;

    // Check if already a participant
    const existingResult = await db.execute({
      sql: `SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`,
      args: [conversationId, workerId],
    });

    if (existingResult.rows.length > 0) {
      return; // Already a participant
    }

    // Add as participant
    await db.execute({
      sql: `INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)`,
      args: [conversationId, workerId],
    });

    // Send system message about new member
    const messageId = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO messages (id, conversation_id, content, message_type)
            VALUES (?, ?, ?, 'system')`,
      args: [messageId, conversationId, `${workerName} has joined the team!`],
    });

    // Notify the worker
    emitToUser(workerId, 'joined_event_group', { conversationId, eventId });

    // Notify the group
    emitToConversation(conversationId, 'member_joined', { 
      userId: workerId, 
      name: workerName 
    });

    console.log(`✅ Added ${workerName} to event group ${eventId}`);
  } catch (error) {
    console.error('Error adding worker to event group:', error);
  }
}

export { io };
