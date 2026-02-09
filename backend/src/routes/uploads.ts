import { Router, Response, Request } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const APPWRITE_BUCKET_ID = process.env.APPWRITE_BUCKET_ID || '';

// Upload file endpoint
router.post('/upload', authMiddleware, (req, res, next) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File too large (max 20MB)' });
        return;
      }
      res.status(400).json({ error: err.message || 'Upload failed' });
      return;
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided. Ensure the field name is "file".' });
      return;
    }

    const fileId = uuidv4();
    
    // Create form data for Appwrite
    const formData = new FormData();
    formData.append('fileId', fileId);
    formData.append('file', new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype }), req.file.originalname);

    // Upload to Appwrite using server-side API key
    const response = await fetch(
      `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files`,
      {
        method: 'POST',
        headers: {
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': APPWRITE_API_KEY,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Appwrite upload error:', errorData);
      res.status(response.status).json({ error: errorData.message || 'Upload failed' });
      return;
    }

    const data = await response.json();
    
    // Generate preview URL
    const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${data.$id}/view?project=${APPWRITE_PROJECT_ID}`;
    
    res.json({
      success: true,
      fileId: data.$id,
      fileUrl,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Get file URL
router.get('/file/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
  res.json({ fileUrl });
});

export default router;
