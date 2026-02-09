import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js';
import { createEventGroup } from '../websocket/socket.js';

const router = Router();

// Get all events for organizer
router.get('/', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT * FROM events WHERE organizer_id = ? ORDER BY created_at DESC`,
      args: [req.user!.id],
    });

    res.json({ events: result.rows });
  } catch (error: any) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single event
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [req.params.id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const event = result.rows[0];

    // Get gigs for this event
    const gigsResult = await db.execute({
      sql: 'SELECT * FROM gigs WHERE event_id = ?',
      args: [req.params.id],
    });

    res.json({ event, gigs: gigsResult.rows });
  } catch (error: any) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create event with full details
router.post('/', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      description, 
      location, 
      venue, 
      eventDate,
      endDate,
      startTime, 
      endTime, 
      imageUrl,
      jobType,
      maleCount,
      femaleCount,
      malePay,
      femalePay,
      paymentMethod,
      subtotal,
      commission,
      total
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const eventId = uuidv4();

    // Insert event
    await db.execute({
      sql: `INSERT INTO events (
        id, organizer_id, title, description, location, venue, 
        event_date, end_date, start_time, end_time, image_url,
        job_type, male_count, female_count, male_pay, female_pay,
        payment_method, subtotal, commission, total, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        eventId, req.user!.id, title, description, location, venue,
        eventDate, endDate, startTime, endTime, imageUrl,
        jobType, maleCount || 0, femaleCount || 0, malePay || 0, femalePay || 0,
        paymentMethod || 'later', subtotal || 0, commission || 0, total || 0, 'published'
      ],
    });

    // If pay later, add to wallet (create transaction)
    if (paymentMethod === 'later' && total > 0) {
      const transactionId = uuidv4();
      await db.execute({
        sql: `INSERT INTO transactions (id, user_id, type, amount, description, status, reference_id, reference_type)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          transactionId,
          req.user!.id,
          'payment',
          total,
          `Event: ${title}`,
          'pending',
          eventId,
          'event'
        ],
      });
    }

    // Auto-create event group chat
    await createEventGroup(eventId, title, req.user!.id);

    res.status(201).json({ message: 'Event created', eventId });
  } catch (error: any) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update event
router.put('/:id', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, location, venue, eventDate, startTime, endTime, imageUrl, status } = req.body;

    // Verify ownership
    const existing = await db.execute({
      sql: 'SELECT id FROM events WHERE id = ? AND organizer_id = ?',
      args: [req.params.id, req.user!.id],
    });

    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Event not found or not authorized' });
      return;
    }

    await db.execute({
      sql: `UPDATE events SET 
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            location = COALESCE(?, location),
            venue = COALESCE(?, venue),
            event_date = COALESCE(?, event_date),
            start_time = COALESCE(?, start_time),
            end_time = COALESCE(?, end_time),
            image_url = COALESCE(?, image_url),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [title, description, location, venue, eventDate, startTime, endTime, imageUrl, status, req.params.id],
    });

    res.json({ message: 'Event updated' });
  } catch (error: any) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete event
router.delete('/:id', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM events WHERE id = ? AND organizer_id = ?',
      args: [req.params.id, req.user!.id],
    });

    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Event not found or not authorized' });
      return;
    }

    res.json({ message: 'Event deleted' });
  } catch (error: any) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public/published events (for workers to browse)
router.get('/browse/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT e.*, u.name as organizer_name, op.company_name 
            FROM events e 
            JOIN users u ON e.organizer_id = u.id
            LEFT JOIN organizer_profiles op ON u.id = op.user_id
            WHERE e.status IN ('published', 'draft')
            ORDER BY e.event_date ASC`,
      args: [],
    });

    res.json({ events: result.rows });
  } catch (error: any) {
    console.error('Browse events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply to event (worker)
router.post('/:id/apply', authMiddleware, roleMiddleware('worker'), async (req: AuthRequest, res: Response) => {
  try {
    const { coverLetter } = req.body;
    const eventId = req.params.id;
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (coverLetter != null && typeof coverLetter !== 'string') {
      res.status(400).json({ error: 'Cover letter must be a string' });
      return;
    }

    // Check event exists and is published or draft
    const eventCheck = await db.execute({
      sql: `SELECT id FROM events WHERE id = ? AND status IN ('published', 'draft')`,
      args: [eventId],
    });

    if (eventCheck.rows.length === 0) {
      res.status(404).json({ error: 'Event not found or not accepting applications' });
      return;
    }

    // Check if already applied
    const existingApp = await db.execute({
      sql: 'SELECT id FROM applications WHERE event_id = ? AND worker_id = ?',
      args: [eventId, req.user!.id],
    });

    if (existingApp.rows.length > 0) {
      res.status(409).json({ error: 'Already applied to this event' });
      return;
    }

    const applicationId = uuidv4();

    await db.execute({
      sql: 'INSERT INTO applications (id, event_id, user_id, worker_id, cover_letter) VALUES (?, ?, ?, ?, ?)',
      args: [applicationId, eventId, req.user!.id, req.user!.id, coverLetter ? coverLetter.trim() : null],
    });

    res.status(201).json({ message: 'Application submitted', applicationId });
  } catch (error: any) {
    console.error('Apply to event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get applicants for an event
router.get('/:id/applicants', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    // Verify ownership
    const eventCheck = await db.execute({
      sql: 'SELECT id FROM events WHERE id = ? AND organizer_id = ?',
      args: [req.params.id, req.user!.id],
    });

    if (eventCheck.rows.length === 0) {
      res.status(404).json({ error: 'Event not found or not authorized' });
      return;
    }

    // Get applications with user info
    const result = await db.execute({
      sql: `SELECT a.id, a.user_id, a.status, a.cover_letter, a.applied_at,
            u.name, u.email, u.phone, u.avatar_url,
            wp.skills, wp.bio, wp.hourly_rate, wp.experience_years, wp.age, wp.gender, wp.verification_status,
            (SELECT url FROM worker_photos WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as worker_photo
            FROM applications a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN worker_profiles wp ON u.id = wp.user_id
            WHERE a.event_id = ?
            ORDER BY a.applied_at DESC`,
      args: [req.params.id],
    });

    res.json({ applicants: result.rows });
  } catch (error: any) {
    console.error('Get applicants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event's group conversation
router.get('/:id/conversation', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT id FROM conversations WHERE event_id = ? AND type = 'event'`,
      args: [req.params.id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event group chat not found' });
      return;
    }

    res.json({ conversationId: (result.rows[0] as any).id });
  } catch (error: any) {
    console.error('Get event conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
