import { Router, Response, Request } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { supabase } from '../config/database.js';

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'uploads';

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
    const fileExtension = req.file.originalname.split('.').pop() || '';
    const fileName = `${fileId}.${fileExtension}`;
    const filePath = `${req.user!.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
      return;
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    res.json({
      success: true,
      fileId: fileId,
      fileUrl: urlData.publicUrl,
      path: filePath
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

router.get('/file/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  
  const { data: files, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list('', {
      search: fileId
    });

  if (error || !files || files.length === 0) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(files[0].name);

  res.json({ fileUrl: urlData.publicUrl });
});

router.delete('/file/:path(*)', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const filePath = req.params.path;

    if (!filePath.startsWith(req.user!.id)) {
      res.status(403).json({ error: 'Not authorized to delete this file' });
      return;
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Supabase storage delete error:', error);
      res.status(500).json({ error: error.message || 'Delete failed' });
      return;
    }

    res.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message || 'Delete failed' });
  }
});

export default router;
