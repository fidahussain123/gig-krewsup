import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get user profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [req.user!.id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0] as any;

    // Get role-specific profile
    let profile = null;
    let photos: any[] = [];
    if (user.role === 'organizer') {
      const profileResult = await db.execute({
        sql: 'SELECT * FROM organizer_profiles WHERE user_id = ?',
        args: [user.id],
      });
      profile = profileResult.rows[0] || null;
    } else if (user.role === 'worker') {
      const profileResult = await db.execute({
        sql: 'SELECT * FROM worker_profiles WHERE user_id = ?',
        args: [user.id],
      });
      profile = profileResult.rows[0] || null;
      const photosResult = await db.execute({
        sql: 'SELECT id, url, created_at FROM worker_photos WHERE user_id = ? ORDER BY created_at DESC',
        args: [user.id],
      });
      photos = photosResult.rows;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      city: user.city,
      country: user.country,
      role: user.role,
      isOnboarded: user.is_onboarded === 1,
      avatarUrl: user.avatar_url,
      profile,
      photos,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, city, country, avatarUrl } = req.body;

    // Convert undefined to null for database compatibility
    await db.execute({
      sql: `UPDATE users SET 
            name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            city = COALESCE(?, city),
            country = COALESCE(?, country),
            avatar_url = COALESCE(?, avatar_url),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        name ?? null, 
        phone ?? null, 
        city ?? null, 
        country ?? null, 
        avatarUrl ?? null, 
        req.user!.id
      ],
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Update organizer profile
router.put('/organizer-profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, organizerType } = req.body;

    await db.execute({
      sql: `UPDATE organizer_profiles SET 
            company_name = COALESCE(?, company_name),
            organizer_type = COALESCE(?, organizer_type)
            WHERE user_id = ?`,
      args: [companyName ?? null, organizerType ?? null, req.user!.id],
    });

    res.json({ message: 'Organizer profile updated successfully' });
  } catch (error: any) {
    console.error('Update organizer profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update worker profile
router.put('/worker-profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { skills, bio, hourlyRate, experienceYears, age, aadhaarDocUrl, workerPhotoUrls, gender } = req.body;
    const verificationStatus = aadhaarDocUrl ? 'pending' : null;

    await db.execute({
      sql: `UPDATE worker_profiles SET 
            skills = COALESCE(?, skills),
            bio = COALESCE(?, bio),
            hourly_rate = COALESCE(?, hourly_rate),
            experience_years = COALESCE(?, experience_years),
            age = COALESCE(?, age),
            gender = COALESCE(?, gender),
            aadhaar_doc_url = COALESCE(?, aadhaar_doc_url),
            verification_status = COALESCE(?, verification_status)
            WHERE user_id = ?`,
      args: [
        skills ?? null,
        bio ?? null,
        hourlyRate ?? null,
        experienceYears ?? null,
        age ?? null,
        gender ?? null,
        aadhaarDocUrl ?? null,
        verificationStatus,
        req.user!.id
      ],
    });

    if (Array.isArray(workerPhotoUrls) && workerPhotoUrls.length > 0) {
      for (const url of workerPhotoUrls) {
        if (!url) continue;
        await db.execute({
          sql: 'INSERT INTO worker_photos (id, user_id, url) VALUES (?, ?, ?)',
          args: [uuidv4(), req.user!.id, url],
        });
      }
    }

    res.json({ message: 'Worker profile updated successfully' });
  } catch (error: any) {
    console.error('Update worker profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get worker profile (organizer view)
router.get('/worker/:id', authMiddleware, roleMiddleware('organizer'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `SELECT u.id, u.name, u.email, u.phone, u.city, u.country, u.avatar_url,
            wp.skills, wp.bio, wp.hourly_rate, wp.experience_years, wp.age, wp.gender, wp.aadhaar_doc_url, wp.verification_status
            FROM users u
            LEFT JOIN worker_profiles wp ON u.id = wp.user_id
            WHERE u.id = ?`,
      args: [req.params.id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Worker not found' });
      return;
    }

    const photosResult = await db.execute({
      sql: 'SELECT id, url, created_at FROM worker_photos WHERE user_id = ? ORDER BY created_at DESC',
      args: [req.params.id],
    });

    res.json({ worker: result.rows[0], photos: photosResult.rows });
  } catch (error: any) {
    console.error('Get worker profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Wallet summary (pending payments)
router.get('/wallet-summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const pendingResult = await db.execute({
      sql: `SELECT COALESCE(SUM(amount), 0) as pending_total
            FROM transactions
            WHERE user_id = ? AND type = 'payment' AND status = 'pending'`,
      args: [req.user!.id],
    });

    const pendingTotal = Number((pendingResult.rows[0] as any)?.pending_total || 0);

    res.json({ pendingTotal });
  } catch (error: any) {
    console.error('Get wallet summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
