import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all gigs for an event
router.get('/event/:eventId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM gigs WHERE event_id = ?',
      args: [req.params.eventId],
    });

    res.json({ gigs: result.rows });
  } catch (error: any) {
    console.error('Get gigs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single gig with event details
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT g.*, e.title as event_title, e.location, e.venue, e.event_date, e.image_url,
            u.name as organizer_name, u.avatar_url as organizer_avatar, op.company_name
            FROM gigs g
            JOIN events e ON g.event_id = e.id
            JOIN users u ON e.organizer_id = u.id
            LEFT JOIN organizer_profiles op ON u.id = op.user_id
            WHERE g.id = ?`,
      args: [req.params.id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Gig not found' });
      return;
    }

    res.json({ gig: result.rows[0] });
  } catch (error: any) {
    console.error('Get gig error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create gig (organizer only)
router.post('/', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, title, description, requirements, payRate, payType, positionsNeeded, startTime, endTime } = req.body;

    if (!eventId || !title) {
      res.status(400).json({ error: 'Event ID and title are required' });
      return;
    }

    // Verify organizer owns the event
    const eventCheck = await db.execute({
      sql: 'SELECT id FROM events WHERE id = ? AND organizer_id = ?',
      args: [eventId, req.user!.id],
    });

    if (eventCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized to add gigs to this event' });
      return;
    }

    const gigId = uuidv4();

    await db.execute({
      sql: `INSERT INTO gigs (id, event_id, title, description, requirements, pay_rate, pay_type, positions_needed, start_time, end_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [gigId, eventId, title, description, requirements, payRate, payType || 'hourly', positionsNeeded || 1, startTime, endTime],
    });

    res.status(201).json({ message: 'Gig created', gigId });
  } catch (error: any) {
    console.error('Create gig error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply to gig (worker only)
router.post('/:id/apply', authMiddleware, roleMiddleware('worker'), async (req: AuthRequest, res: Response) => {
  try {
    const { coverLetter } = req.body;
    const gigId = req.params.id;

    // Check gig exists and is open
    const gigCheck = await db.execute({
      sql: 'SELECT * FROM gigs WHERE id = ? AND status = ?',
      args: [gigId, 'open'],
    });

    if (gigCheck.rows.length === 0) {
      res.status(404).json({ error: 'Gig not found or not accepting applications' });
      return;
    }

    // Check if already applied
    const existingApp = await db.execute({
      sql: 'SELECT id FROM applications WHERE gig_id = ? AND worker_id = ?',
      args: [gigId, req.user!.id],
    });

    if (existingApp.rows.length > 0) {
      res.status(409).json({ error: 'Already applied to this gig' });
      return;
    }

    const applicationId = uuidv4();

    const eventId = (gigCheck.rows[0] as any).event_id;

    await db.execute({
      sql: 'INSERT INTO applications (id, gig_id, worker_id, cover_letter, event_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      args: [applicationId, gigId, req.user!.id, coverLetter, eventId, req.user!.id],
    });

    res.status(201).json({ message: 'Application submitted', applicationId });
  } catch (error: any) {
    console.error('Apply to gig error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get applications for a gig (organizer view)
router.get('/:id/applications', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT a.*, u.name as worker_name, u.email as worker_email, u.phone as worker_phone,
            u.avatar_url as worker_avatar,
            wp.skills, wp.hourly_rate, wp.experience_years, wp.age, wp.gender, wp.verification_status,
            (SELECT url FROM worker_photos WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as worker_photo
            FROM applications a
            JOIN users u ON a.worker_id = u.id
            LEFT JOIN worker_profiles wp ON u.id = wp.user_id
            JOIN gigs g ON a.gig_id = g.id
            JOIN events e ON g.event_id = e.id
            WHERE a.gig_id = ? AND e.organizer_id = ?`,
      args: [req.params.id, req.user!.id],
    });

    res.json({ applications: result.rows });
  } catch (error: any) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update application status (organizer)
router.put('/applications/:applicationId', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    // Verify organizer owns the associated event
    const appCheck = await db.execute({
      sql: `SELECT a.id, g.id as gig_id FROM applications a
            JOIN gigs g ON a.gig_id = g.id
            JOIN events e ON g.event_id = e.id
            WHERE a.id = ? AND e.organizer_id = ?`,
      args: [req.params.applicationId, req.user!.id],
    });

    if (appCheck.rows.length === 0) {
      res.status(404).json({ error: 'Application not found or not authorized' });
      return;
    }

    await db.execute({
      sql: 'UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [status, req.params.applicationId],
    });

    // If accepted, increment positions_filled
    if (status === 'accepted') {
      const gigId = (appCheck.rows[0] as any).gig_id;
      await db.execute({
        sql: 'UPDATE gigs SET positions_filled = positions_filled + 1 WHERE id = ?',
        args: [gigId],
      });
    }

    res.json({ message: 'Application status updated' });
  } catch (error: any) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my applications (worker view)
router.get('/my/applications', authMiddleware, roleMiddleware('worker'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT a.*, g.title as gig_title, g.pay_rate, e.title as event_title, e.event_date, e.location
            FROM applications a
            JOIN gigs g ON a.gig_id = g.id
            JOIN events e ON g.event_id = e.id
            WHERE a.worker_id = ?
            ORDER BY a.applied_at DESC`,
      args: [req.user!.id],
    });

    res.json({ applications: result.rows });
  } catch (error: any) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Browse open gigs (worker)
router.get('/browse/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT g.*, e.title as event_title, e.location, e.venue, e.event_date, e.image_url,
            e.male_pay, e.female_pay,
            u.name as organizer_name, u.avatar_url as organizer_avatar, op.company_name
            FROM gigs g
            JOIN events e ON g.event_id = e.id
            JOIN users u ON e.organizer_id = u.id
            LEFT JOIN organizer_profiles op ON u.id = op.user_id
            WHERE g.status = 'open' AND e.status = 'published'
            ORDER BY e.event_date ASC`,
      args: [],
    });

    res.json({ gigs: result.rows });
  } catch (error: any) {
    console.error('Browse gigs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
