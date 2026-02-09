import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    // Check if user already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email],
    });

    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'User already exists with this email' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Create user
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)`,
      args: [userId, email, passwordHash, name],
    });

    const token = generateToken({ id: userId, email, name, role: null });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: userId, email, name, role: null, isOnboarded: false },
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email],
    });

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0] as any;

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isOnboarded: user.is_onboarded === 1,
        phone: user.phone,
        city: user.city,
        country: user.country,
        avatarUrl: user.avatar_url,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    // Get profile data based on role
    let profile = null;
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
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isOnboarded: user.is_onboarded === 1,
        phone: user.phone,
        city: user.city,
        country: user.country,
        avatarUrl: user.avatar_url,
      },
      profile,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set role
router.post('/set-role', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;

    if (!role || !['organizer', 'worker'].includes(role)) {
      res.status(400).json({ error: 'Valid role (organizer/worker) is required' });
      return;
    }

    await db.execute({
      sql: 'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [role, req.user!.id],
    });

    // Create empty profile
    const profileId = uuidv4();
    if (role === 'organizer') {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO organizer_profiles (id, user_id) VALUES (?, ?)',
        args: [profileId, req.user!.id],
      });
    } else {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO worker_profiles (id, user_id) VALUES (?, ?)',
        args: [profileId, req.user!.id],
      });
    }

    const token = generateToken({ ...req.user!, role });

    res.json({ message: 'Role set successfully', role, token });
  } catch (error: any) {
    console.error('Set role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete onboarding
router.post('/onboarding', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { 
      name, 
      phone, 
      city, 
      country, 
      companyName, 
      organizerType, 
      skills, 
      bio, 
      hourlyRate, 
      avatarUrl,
      age,
      experienceYears,
      aadhaarDocUrl,
      workerPhotoUrls,
      gender
    } = req.body;

    // Update user base info
    await db.execute({
      sql: `UPDATE users SET 
            name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            city = COALESCE(?, city),
            country = COALESCE(?, country),
            avatar_url = COALESCE(?, avatar_url),
            is_onboarded = 1,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [name ?? null, phone ?? null, city ?? null, country ?? null, avatarUrl ?? null, userId],
    });

    // Get user role
    const userResult = await db.execute({
      sql: 'SELECT role FROM users WHERE id = ?',
      args: [userId],
    });
    const role = (userResult.rows[0] as any)?.role;

    // Update role-specific profile
    if (role === 'organizer' && (companyName || organizerType)) {
      await db.execute({
        sql: `UPDATE organizer_profiles SET 
              company_name = COALESCE(?, company_name),
              organizer_type = COALESCE(?, organizer_type)
              WHERE user_id = ?`,
        args: [companyName, organizerType, userId],
      });
    } else if (role === 'worker' && (skills || bio || hourlyRate || age || experienceYears || aadhaarDocUrl || gender)) {
      const verificationStatus = aadhaarDocUrl ? 'pending' : null;
      await db.execute({
        sql: `UPDATE worker_profiles SET 
              skills = COALESCE(?, skills),
              bio = COALESCE(?, bio),
              hourly_rate = COALESCE(?, hourly_rate),
              age = COALESCE(?, age),
              gender = COALESCE(?, gender),
              experience_years = COALESCE(?, experience_years),
              aadhaar_doc_url = COALESCE(?, aadhaar_doc_url),
              verification_status = COALESCE(?, verification_status)
              WHERE user_id = ?`,
        args: [
          skills ?? null,
          bio ?? null,
          hourlyRate ?? null,
          age ?? null,
          gender ?? null,
          experienceYears ?? null,
          aadhaarDocUrl ?? null,
          verificationStatus,
          userId
        ],
      });
    }

    if (role === 'worker' && Array.isArray(workerPhotoUrls) && workerPhotoUrls.length > 0) {
      for (const url of workerPhotoUrls) {
        if (!url) continue;
        await db.execute({
          sql: 'INSERT INTO worker_photos (id, user_id, url) VALUES (?, ?, ?)',
          args: [uuidv4(), userId, url],
        });
      }
    }

    res.json({ message: 'Onboarding completed successfully' });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
