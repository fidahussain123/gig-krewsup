import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all conversations for user
router.get('/conversations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT c.*, 
            (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = ?
            ORDER BY last_message_at DESC NULLS LAST`,
      args: [req.user!.id],
    });

    // Get participants for each conversation
    const conversations = await Promise.all(
      result.rows.map(async (conv: any) => {
        const participants = await db.execute({
          sql: `SELECT u.id, u.name, u.avatar_url 
                FROM conversation_participants cp
                JOIN users u ON cp.user_id = u.id
                WHERE cp.conversation_id = ?`,
          args: [conv.id],
        });
        return { ...conv, participants: participants.rows };
      })
    );

    res.json({ conversations });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages in a conversation
router.get('/conversations/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Verify user is participant
    const participantCheck = await db.execute({
      sql: 'SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      args: [req.params.id, req.user!.id],
    });

    if (participantCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not a participant of this conversation' });
      return;
    }

    const messages = await db.execute({
      sql: `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC`,
      args: [req.params.id],
    });

    // Update last read
    await db.execute({
      sql: 'UPDATE conversation_participants SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND user_id = ?',
      args: [req.params.id, req.user!.id],
    });

    res.json({ messages: messages.rows });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation info with participants
router.get('/conversations/:id/info', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Get conversation
    const convResult = await db.execute({
      sql: 'SELECT * FROM conversations WHERE id = ?',
      args: [req.params.id],
    });

    if (convResult.rows.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Get participants
    const participantsResult = await db.execute({
      sql: `SELECT u.id as user_id, u.name, u.avatar_url 
            FROM conversation_participants cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.conversation_id = ?`,
      args: [req.params.id],
    });

    res.json({ 
      conversation: convResult.rows[0], 
      participants: participantsResult.rows 
    });
  } catch (error: any) {
    console.error('Get conversation info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message
router.post('/conversations/:id/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content, messageType } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    // Verify user is participant
    const participantCheck = await db.execute({
      sql: 'SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      args: [req.params.id, req.user!.id],
    });

    if (participantCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not a participant of this conversation' });
      return;
    }

    const messageId = uuidv4();

    await db.execute({
      sql: 'INSERT INTO messages (id, conversation_id, sender_id, content, message_type) VALUES (?, ?, ?, ?, ?)',
      args: [messageId, req.params.id, req.user!.id, content, messageType || 'text'],
    });

    res.status(201).json({ message: 'Message sent', messageId });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start new conversation (direct message)
router.post('/conversations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { participantId, title, initialMessage } = req.body;

    if (!participantId) {
      res.status(400).json({ error: 'Participant ID is required' });
      return;
    }

    // Check if direct conversation already exists
    const existingConv = await db.execute({
      sql: `SELECT c.id FROM conversations c
            JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
            JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
            WHERE c.type = 'direct' AND cp1.user_id = ? AND cp2.user_id = ?`,
      args: [req.user!.id, participantId],
    });

    if (existingConv.rows.length > 0) {
      res.json({ conversationId: (existingConv.rows[0] as any).id, existing: true });
      return;
    }

    const conversationId = uuidv4();

    await db.execute({
      sql: 'INSERT INTO conversations (id, title, type) VALUES (?, ?, ?)',
      args: [conversationId, title, 'direct'],
    });

    // Add both participants
    await db.execute({
      sql: 'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
      args: [conversationId, req.user!.id],
    });

    await db.execute({
      sql: 'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
      args: [conversationId, participantId],
    });

    // Send initial message if provided
    if (initialMessage) {
      const messageId = uuidv4();
      await db.execute({
        sql: 'INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)',
        args: [messageId, conversationId, req.user!.id, initialMessage],
      });
    }

    res.status(201).json({ conversationId, existing: false });
  } catch (error: any) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
