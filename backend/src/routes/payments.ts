import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../config/database.js';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// ─────────────────────────────────────────────
// POST /api/payments/create-order
// Organizer creates a Razorpay order for an event
// ─────────────────────────────────────────────
router.post('/create-order', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, amount } = req.body;

    if (!eventId || !amount || isNaN(Number(amount))) {
      res.status(400).json({ error: 'eventId and a valid amount are required' });
      return;
    }

    // Verify event belongs to this organizer
    const eventResult = await db.execute({
      sql: 'SELECT id, title FROM events WHERE id = ? AND organizer_id = ?',
      args: [eventId, req.user!.id],
    });

    if (eventResult.rows.length === 0) {
      res.status(404).json({ error: 'Event not found or not authorized' });
      return;
    }

    // Block if already paid
    const existing = await db.execute({
      sql: `SELECT payment_status FROM payments WHERE event_id = ?`,
      args: [eventId],
    });

    if (existing.rows.length > 0 && (existing.rows[0] as any).payment_status === 'completed') {
      res.status(409).json({ error: 'Payment already completed for this event' });
      return;
    }

    // Razorpay expects amount in paise (INR smallest unit)
    const amountInPaise = Math.round(Number(amount) * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `event_${eventId.slice(0, 20)}`,
      notes: {
        event_id: eventId,
        organizer_id: req.user!.id,
      },
    });

    // Upsert payment record as pending
    const paymentRowId = uuidv4();
    await db.execute({
      sql: `INSERT INTO payments (id, event_id, organizer_id, payment_id, payment_status, amount)
            VALUES (?, ?, ?, ?, 'pending', ?)
            ON CONFLICT (payment_id) DO NOTHING`,
      args: [paymentRowId, eventId, req.user!.id, order.id, amount],
    });

    res.status(201).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// ─────────────────────────────────────────────
// POST /api/payments/verify
// Verify Razorpay signature after frontend payment
// ─────────────────────────────────────────────
router.post('/verify', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !eventId) {
      res.status(400).json({ error: 'razorpay_order_id, razorpay_payment_id, razorpay_signature, and eventId are required' });
      return;
    }

    // Verify signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed on signature mismatch
      await db.execute({
        sql: `UPDATE payments SET payment_status = 'failed', updated_at = NOW()
              WHERE event_id = ? AND organizer_id = ?`,
        args: [eventId, req.user!.id],
      });
      res.status(400).json({ error: 'Invalid payment signature. Payment marked as failed.' });
      return;
    }

    // Signature valid — mark completed
    await db.execute({
      sql: `UPDATE payments
            SET payment_status = 'completed', payment_id = ?, updated_at = NOW()
            WHERE event_id = ? AND organizer_id = ?`,
      args: [razorpay_payment_id, eventId, req.user!.id],
    });

    res.json({ success: true, message: 'Payment verified and completed' });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// ─────────────────────────────────────────────
// POST /api/payments/pay-later
// Organizer defers payment — unlocks chat room access
// ─────────────────────────────────────────────
router.post('/pay-later', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      res.status(400).json({ error: 'eventId is required' });
      return;
    }

    // Verify event ownership
    const eventResult = await db.execute({
      sql: 'SELECT id, title FROM events WHERE id = ? AND organizer_id = ?',
      args: [eventId, req.user!.id],
    });

    if (eventResult.rows.length === 0) {
      res.status(404).json({ error: 'Event not found or not authorized' });
      return;
    }

    // Check if record already exists
    const existing = await db.execute({
      sql: 'SELECT id, payment_status, payment_id FROM payments WHERE event_id = ?',
      args: [eventId],
    });

    if (existing.rows.length > 0) {
      const p = existing.rows[0] as any;
      res.json({
        success: true,
        message: 'Pay later already set',
        payment_status: p.payment_status,
        payment_id: p.payment_id,
      });
      return;
    }

    const paymentRowId = uuidv4();
    const payLaterRef = `pay_later_${eventId}_${Date.now()}`;

    await db.execute({
      sql: `INSERT INTO payments (id, event_id, organizer_id, payment_id, payment_status, amount)
            VALUES (?, ?, ?, ?, 'pending', 0)`,
      args: [paymentRowId, eventId, req.user!.id, payLaterRef],
    });

    res.status(201).json({
      success: true,
      message: 'Pay later option selected. Chat room access unlocked.',
      payment_id: payLaterRef,
      payment_status: 'pending',
    });
  } catch (error: any) {
    console.error('Pay later error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/payments/status/:eventId
// Check payment status for a given event
// ─────────────────────────────────────────────
router.get('/status/:eventId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM payments WHERE event_id = ?',
      args: [req.params.eventId],
    });

    if (result.rows.length === 0) {
      res.json({
        success: true,
        has_payment: false,
        payment_status: 'not_initiated',
      });
      return;
    }

    const p = result.rows[0] as any;
    const isPayLater = (p.payment_id as string)?.startsWith('pay_later');

    res.json({
      success: true,
      has_payment: true,
      payment_id: p.payment_id,
      payment_status: p.payment_status,
      is_pay_later: isPayLater,
      amount: p.amount,
      created_at: p.created_at,
    });
  } catch (error: any) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/payments/wallet/organizer
// Full wallet view for organizer
// ─────────────────────────────────────────────
router.get('/wallet/organizer', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT
              e.id            AS event_id,
              e.title         AS event_name,
              e.event_date,
              e.male_count,
              e.female_count,
              e.total,
              e.status        AS event_status,
              p.payment_id,
              p.payment_status,
              p.amount        AS paid_amount,
              p.created_at    AS payment_date,
              (
                SELECT COUNT(*) FROM applications a
                WHERE a.event_id = e.id AND a.status = 'accepted'
              ) AS accepted_count
            FROM events e
            LEFT JOIN payments p ON e.id = p.event_id
            WHERE e.organizer_id = ?
            ORDER BY e.created_at DESC`,
      args: [req.user!.id],
    });

    const events = result.rows as any[];

    const summary = {
      total_events: events.length,
      pending_payments: events.filter(e => !e.payment_status || e.payment_status === 'pending').length,
      completed_payments: events.filter(e => e.payment_status === 'completed').length,
      total_amount_pending: events
        .filter(e => e.payment_status === 'pending' && e.payment_id && !String(e.payment_id).startsWith('pay_later'))
        .reduce((sum, e) => sum + (Number(e.total) || 0), 0),
      total_amount_paid: events
        .filter(e => e.payment_status === 'completed')
        .reduce((sum, e) => sum + (Number(e.paid_amount) || 0), 0),
    };

    res.json({
      success: true,
      data: {
        summary,
        events: events.map(e => ({
          event_id: e.event_id,
          event_name: e.event_name,
          event_date: e.event_date,
          total_crew: (Number(e.male_count) || 0) + (Number(e.female_count) || 0),
          accepted_workers: Number(e.accepted_count) || 0,
          total_pay: Number(e.total) || 0,
          event_status: e.event_status,
          payment: {
            payment_id: e.payment_id || null,
            status: e.payment_status || 'not_initiated',
            is_pay_later: e.payment_id ? String(e.payment_id).startsWith('pay_later') : false,
            amount: Number(e.paid_amount) || 0,
            payment_date: e.payment_date || null,
          },
        })),
      },
    });
  } catch (error: any) {
    console.error('Organizer wallet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/payments/wallet/worker
// Earnings view for gig worker
// ─────────────────────────────────────────────
router.get('/wallet/worker', authMiddleware, roleMiddleware('worker'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT
              e.id            AS event_id,
              e.title         AS event_name,
              e.event_date,
              e.location,
              e.total,
              e.male_pay,
              e.female_pay,
              u.name          AS organizer_name,
              op.company_name,
              p.payment_id,
              p.payment_status,
              p.created_at    AS payment_date
            FROM applications a
            JOIN events e         ON a.event_id = e.id
            JOIN users u          ON e.organizer_id = u.id
            LEFT JOIN organizer_profiles op ON u.id = op.user_id
            LEFT JOIN payments p  ON e.id = p.event_id
            WHERE a.worker_id = ? AND a.status = 'accepted'
            ORDER BY e.event_date DESC`,
      args: [req.user!.id],
    });

    const events = result.rows as any[];

    const summary = {
      total_accepted_events: events.length,
      pending_earnings: events.filter(e => !e.payment_status || e.payment_status === 'pending').length,
      received_earnings: events.filter(e => e.payment_status === 'completed').length,
      complaint_events: events.filter(e => e.payment_status === 'failed').length,
      total_pending_amount: events
        .filter(e => !e.payment_status || e.payment_status === 'pending')
        .reduce((sum, e) => sum + (Number(e.total) || 0), 0),
      total_received_amount: events
        .filter(e => e.payment_status === 'completed')
        .reduce((sum, e) => sum + (Number(e.total) || 0), 0),
    };

    res.json({
      success: true,
      data: {
        summary,
        events: events.map(e => {
          let paymentStatus = 'pending';
          let canRaiseComplaint = false;

          if (e.payment_status === 'completed') paymentStatus = 'received';
          else if (e.payment_status === 'failed') {
            paymentStatus = 'raise_complaint';
            canRaiseComplaint = true;
          }

          return {
            event_id: e.event_id,
            event_name: e.event_name,
            event_date: e.event_date,
            location: e.location,
            organizer: {
              name: e.organizer_name,
              company_name: e.company_name || null,
            },
            payment: {
              status: paymentStatus,
              can_raise_complaint: canRaiseComplaint,
              amount: Number(e.total) || 0,
              payment_date: e.payment_date || null,
            },
          };
        }),
      },
    });
  } catch (error: any) {
    console.error('Worker wallet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/payments/complaint
// Worker raises a complaint against a failed payment
// ─────────────────────────────────────────────
router.post('/complaint', authMiddleware, roleMiddleware('worker'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, complaintReason } = req.body;

    if (!eventId || !complaintReason) {
      res.status(400).json({ error: 'eventId and complaintReason are required' });
      return;
    }

    // Verify worker was accepted for this event
    const appCheck = await db.execute({
      sql: `SELECT id FROM applications WHERE event_id = ? AND worker_id = ? AND status = 'accepted'`,
      args: [eventId, req.user!.id],
    });

    if (appCheck.rows.length === 0) {
      res.status(403).json({ error: 'You are not an accepted worker for this event' });
      return;
    }

    // Only allow complaints for failed payments
    const paymentCheck = await db.execute({
      sql: `SELECT payment_status FROM payments WHERE event_id = ?`,
      args: [eventId],
    });

    if (paymentCheck.rows.length === 0 || (paymentCheck.rows[0] as any).payment_status !== 'failed') {
      res.status(400).json({ error: 'Complaints can only be raised when payment has failed' });
      return;
    }

    // Block duplicate complaints
    const existing = await db.execute({
      sql: `SELECT id FROM payment_complaints WHERE event_id = ? AND worker_id = ?`,
      args: [eventId, req.user!.id],
    });

    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'You have already raised a complaint for this event' });
      return;
    }

    const complaintId = uuidv4();
    await db.execute({
      sql: `INSERT INTO payment_complaints (id, event_id, worker_id, complaint_reason, status)
            VALUES (?, ?, ?, ?, 'pending')`,
      args: [complaintId, eventId, req.user!.id, complaintReason],
    });

    res.status(201).json({
      success: true,
      message: 'Complaint raised successfully',
      complaint_id: complaintId,
    });
  } catch (error: any) {
    console.error('Raise complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
