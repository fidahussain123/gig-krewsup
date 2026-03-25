# KrewsUp - Gig Worker & Event Management Platform

A React Native + Expo mobile application that connects **gig workers** with **event organizers**. Workers can find and apply for gigs, while organizers can create events and hire crew members.

## Features

- **Dual-role app**: Same codebase for workers and organizers
- **Event Management**: Create, browse, and manage events
- **Gig Applications**: Workers apply to events, organizers manage applicants
- **Real-time Chat**: 1:1 messaging and event group chats
- **Voice/Video Calls**: WebRTC-based calling
- **Location-based Discovery**: Find nearby events
- **Push Notifications**: Stay updated on applications and messages
- **Wallet System**: Track earnings and payments

## Tech Stack

| Category | Technologies |
|----------|--------------|
| **Mobile** | React Native 0.81, Expo SDK 54, TypeScript |
| **Routing** | Expo Router (file-based) |
| **Styling** | NativeWind (Tailwind CSS) |
| **Backend** | Node.js, Express, Socket.IO |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **Auth** | JWT + Firebase Phone OTP (coming soon) |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Supabase Account**: [supabase.com](https://supabase.com)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

---

## Project Structure

```
gig-krewsup/
├── app/                    # Expo Router routes
│   ├── _layout.tsx         # Root layout with providers
│   ├── index.tsx           # Entry point / auth redirect
│   ├── worker/             # Worker tab navigator
│   └── organizer/          # Organizer tab navigator
├── screens/                # Screen components
├── components/             # Shared UI components
├── contexts/               # React Context (AuthContext)
├── lib/                    # API client, socket, config
├── backend/                # Express + Socket.IO server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── config/         # Database config
│   │   ├── middleware/     # Auth middleware
│   │   ├── websocket/      # Socket.IO handlers
│   │   └── db/             # SQL schemas
│   └── package.json
├── docs/                   # Documentation
└── package.json
```

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gig-krewsup
```

### 2. Setup Supabase Database

1. Create a new project at [supabase.com](https://supabase.com/dashboard)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy the contents of `backend/src/db/supabase-schema.sql`
4. Paste and run it to create all tables
5. Go to **Storage** and create a bucket named `uploads`
6. Make the bucket **public** (Settings → Make public)

### 3. Configure Environment Variables

#### Backend (.env)

Create `backend/.env`:

```env
# Server
PORT=3001

# Supabase - Get from: Project Settings → API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database - Get from: Project Settings → Database → Connection string → URI
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.your-project-id.supabase.co:5432/postgres

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Storage
STORAGE_BUCKET=uploads

# Push Notifications (optional)
FCM_SERVER_KEY=your-fcm-server-key
```

#### Frontend

Update `lib/config.ts` for your environment:

```typescript
// For local development
const LOCAL_API = 'http://localhost:3001/api';
const LOCAL_SOCKET = 'http://localhost:3001/';

// For production, update with your deployed server URL
export const API_BASE_URL = LOCAL_API;
export const SOCKET_BASE_URL = LOCAL_SOCKET;
```

### 4. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 5. Run the Application

#### Terminal 1 - Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
✅ Database connection successful
🚀 Server running on port 3001
```

#### Terminal 2 - Expo App

```bash
# From project root
npx expo start --clear
```

Then:
- Press `w` to open in web browser
- Press `a` to open in Android emulator
- Press `i` to open in iOS simulator
- Scan QR code with Expo Go app on your phone

---

## Running on Physical Device

### Android

For local development on Android device, use your computer's IP:

1. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update `lib/config.ts`:
   ```typescript
   const LOCAL_API = 'http://YOUR_IP:3001/api';
   const LOCAL_SOCKET = 'http://YOUR_IP:3001/';
   ```
3. Ensure your phone and computer are on the same WiFi network

### iOS

Same as Android - use your computer's IP address.

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/set-role` | Set user role (worker/organizer) |
| POST | `/api/auth/onboarding` | Complete profile onboarding |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get organizer's events |
| POST | `/api/events` | Create new event |
| GET | `/api/events/:id` | Get event details |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/events/browse/all` | Browse all events |
| GET | `/api/events/nearby` | Get nearby events |
| POST | `/api/events/:id/apply` | Apply to event |
| GET | `/api/events/:id/applicants` | Get event applicants |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | Get all conversations |
| GET | `/api/messages/conversations/:id` | Get messages in conversation |
| POST | `/api/messages/conversations/:id/messages` | Send message |
| POST | `/api/messages/conversations` | Start new conversation |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| GET | `/api/users/wallet-summary` | Get wallet summary |

---

## Socket Events

### Chat
- `join_conversation` - Join a chat room
- `send_message` - Send a message
- `new_message` - Receive a message
- `typing` - Typing indicator

### Calls
- `call_invite` - Invite user to call
- `call_join` - Join a call
- `call_leave` - Leave a call
- `webrtc_offer` / `webrtc_answer` / `webrtc_ice` - WebRTC signaling

---

## Development Scripts

### Frontend
```bash
npm start              # Start Expo dev server
npx expo start --clear # Start with cache cleared
npx expo run:android   # Build and run on Android
npx expo run:ios       # Build and run on iOS
```

### Backend
```bash
cd backend
npm run dev           # Start dev server with hot reload
npm run build         # Build TypeScript
npm start             # Start production server
```

---

## Troubleshooting

### "Cannot connect to API"
- Ensure backend is running on port 3001
- Check `lib/config.ts` has correct API URL
- For mobile devices, use your computer's IP address (not localhost)

### "Database connection failed"
- Verify `DATABASE_URL` in `backend/.env`
- Check Supabase project is active
- Ensure password doesn't have special characters that need URL encoding

### "Missing Supabase configuration"
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `backend/.env`
- Get these from Supabase Dashboard → Project Settings → API

### Date picker not working on web
- The web version uses native HTML date/time inputs
- Make sure you're using the latest code

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test on both web and mobile
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

### Code Style
- Use TypeScript for all new files
- Follow existing naming conventions
- Use NativeWind/Tailwind for styling
- Keep screens in `screens/` directory
- Keep routes thin (import screens, don't add logic)

---

## Deployment

### Backend
Deploy to any Node.js hosting (Render, Railway, AWS, etc.):
1. Set environment variables
2. Build: `npm run build`
3. Start: `npm start`

### Mobile App
```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

---

## License

MIT License - see LICENSE file for details.

---

## Support

For questions or issues, open a GitHub issue or contact the maintainers.
