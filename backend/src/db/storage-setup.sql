-- =============================================
-- SUPABASE STORAGE SETUP
-- =============================================
-- Run this AFTER running supabase-schema.sql
-- This sets up the storage bucket and policies
-- =============================================

-- Make the uploads bucket public for reading
UPDATE storage.buckets 
SET public = true 
WHERE id = 'uploads';

-- If bucket doesn't exist, create it (uncomment if needed)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('uploads', 'uploads', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;

-- Allow anyone to read files from uploads bucket
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated upload access"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads');

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'uploads');

-- Allow users to delete files
CREATE POLICY "Users can delete files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads');

-- =============================================
-- DONE!
-- =============================================
-- Your storage bucket is now ready for uploads
-- Files uploaded will be publicly accessible
-- =============================================
