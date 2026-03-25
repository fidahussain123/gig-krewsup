# Supabase Setup Guide for Krewsup

## Step 1: Run the Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/fkfoqiodlnqdmafobdpi
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `backend/src/db/supabase-schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

You should see "Success. No rows returned" - this means all tables were created.

## Step 2: Configure Storage Bucket

You mentioned you already created a bucket named `uploads`. Let's make sure it's public:

1. Go to **Storage** in the left sidebar
2. Click on the `uploads` bucket
3. Click **Policies** tab
4. Add these policies:

### Policy 1: Allow Public Read
- **Policy name**: `Allow public read`
- **Allowed operation**: SELECT
- **Target roles**: (leave empty for public)
- **Policy definition**: `true`

### Policy 2: Allow Authenticated Upload
- **Policy name**: `Allow authenticated upload`  
- **Allowed operation**: INSERT
- **Target roles**: `authenticated`
- **Policy definition**: `true`

Or run this SQL in the SQL Editor:

```sql
-- Make bucket public for reading
UPDATE storage.buckets SET public = true WHERE id = 'uploads';

-- Allow anyone to read files
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload access"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads');
```

## Step 3: Get Your Database URL

1. Go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.fkfoqiodlnqdmafobdpi.supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Add this to your `.env` file as `DATABASE_URL`

## Step 4: Update Your .env Files

### Frontend `.env` (in `gig-krewsup/`)
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:3001/
```

### Backend `.env` (in `gig-krewsup/backend/`)
```env
PORT=3001
SUPABASE_URL=https://fkfoqiodlnqdmafobdpi.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.fkfoqiodlnqdmafobdpi.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
STORAGE_BUCKET=uploads
```

## Step 5: Install Dependencies & Run

```bash
# In backend folder
cd gig-krewsup/backend
npm install

# Start the backend
npm run dev
```

```bash
# In another terminal, in gig-krewsup folder
cd gig-krewsup
npx expo start --clear
```

## Verification

After running the schema, you should have these tables:
- `users`
- `organizer_profiles`
- `worker_profiles`
- `worker_photos`
- `events`
- `gigs`
- `applications`
- `conversations`
- `conversation_participants`
- `messages`
- `transactions`
- `uploads`
- `device_tokens`
- `otp_codes`

You can verify by going to **Table Editor** in Supabase and checking that all tables exist.

## Troubleshooting

### "relation does not exist" error
Run the schema SQL again - make sure all statements executed successfully.

### "permission denied" error
Make sure you're using the `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) in your backend.

### Storage upload fails
- Check that the `uploads` bucket exists
- Make sure the bucket is set to public
- Verify storage policies are in place
