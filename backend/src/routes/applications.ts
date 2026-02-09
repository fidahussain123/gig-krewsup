import { Router, Response } from 'express';
import { db } from '../config/database.js';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js';
import { addWorkerToEventGroup } from '../websocket/socket.js';

const router = Router();

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';

async function sendFcmNotification(tokens: string[], title: string, body: string, data: Record<string, string>) {
  if (!FCM_SERVER_KEY || tokens.length === 0) return;
  await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      registration_ids: tokens,
      notification: { title, body },
      data,
      priority: 'high',
    }),
  });
}

// Update application status (accept/reject)
router.put('/:id', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!status || !['accepted', 'rejected', 'pending'].includes(status)) {
      res.status(400).json({ error: 'Valid status (accepted/rejected/pending) is required' });
      return;
    }

    // Get application with user info and verify organizer owns the event
    const appResult = await db.execute({
      sql: `SELECT a.id, a.event_id, a.user_id, e.organizer_id, u.name as worker_name
            FROM applications a
            JOIN events e ON a.event_id = e.id
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?`,
      args: [req.params.id],
    });

    if (appResult.rows.length === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const application = appResult.rows[0] as any;
    if (application.organizer_id !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to update this application' });
      return;
    }

    // Update status
    await db.execute({
      sql: 'UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [status, req.params.id],
    });

    // If accepted, add worker to event group and send push
    if (status === 'accepted') {
      await addWorkerToEventGroup(
        application.event_id,
        application.user_id,
        application.worker_name || 'Team Member'
      );

      const convResult = await db.execute({
        sql: `SELECT id FROM conversations WHERE event_id = ? AND type = 'event'`,
        args: [application.event_id],
      });
      const conversationId = (convResult.rows[0] as any)?.id;

      const tokenResult = await db.execute({
        sql: `SELECT token FROM device_tokens WHERE user_id = ?`,
        args: [application.user_id],
      });
      const tokens = tokenResult.rows.map(row => (row as any).token).filter(Boolean);

      await sendFcmNotification(
        tokens,
        'Application accepted',
        'You have been added to the event chat.',
        {
          conversationId: conversationId || '',
          eventId: application.event_id || '',
          type: 'application_accepted',
        }
      );
    }

    res.json({ message: 'Application status updated', status });
  } catch (error: any) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single application
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT a.*, u.name, u.email, u.phone, u.avatar_url,
            wp.skills, wp.bio, wp.hourly_rate
            FROM applications a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN worker_profiles wp ON u.id = wp.user_id
            WHERE a.id = ?`,
      args: [req.params.id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.json({ application: result.rows[0] });
  } catch (error: any) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
