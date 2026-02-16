# KrewsUp API – Postman Testing Guide

Use this doc to test all APIs in Postman. Replace `{{baseUrl}}` with your API base (e.g. `http://localhost:3001/api` or `https://51.21.245.127:3001/api`).

---

## Postman setup

1. **Environment variable**
   - Create an environment in Postman.
   - Add: `baseUrl` = `http://localhost:3001/api` (or your server URL including `/api`).

2. **Auth for protected routes**
   - Call **POST /auth/login** first (see below).
   - Copy the `token` from the response.
   - For other requests, add header:
     - **Key:** `Authorization`
     - **Value:** `Bearer <paste token here>`
   - Or in Postman: Auth tab → Type: Bearer Token → Token: `<paste token>`.

3. **Common headers for JSON**
   - **Content-Type:** `application/json`  
   (Postman sets this automatically when you pick Body → raw → JSON.)

---

## 1. Auth (`/auth`)

Base path: `{{baseUrl}}/auth`

### 1.1 Register

- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "user@example.com",
  "password": "yourSecurePassword123",
  "name": "Your Name"
}
```
- **Response (201):** `{ "message", "user": { "id", "email", "name", "role", "isOnboarded" }, "token" }`

---

### 1.2 Login

- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "user@example.com",
  "password": "yourSecurePassword123"
}
```
- **Response (200):** `{ "message", "user": { "id", "email", "name", "role", "isOnboarded", "phone", "city", "country", "avatarUrl" }, "token" }`  
Use `token` for the `Authorization: Bearer <token>` header on all other requests.

---

### 1.3 Get current user (me)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** none
- **Response (200):** `{ "user", "profile" }`

---

### 1.4 Set role

- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/set-role`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "role": "organizer"
}
```
- **Allowed values:** `"organizer"` or `"worker"`
- **Response (200):** `{ "message", "role", "token" }` — use the new `token` in subsequent requests.

---

### 1.5 Complete onboarding

- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/onboarding`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (raw JSON):** All fields optional; send what you want to update.
```json
{
  "name": "Full Name",
  "phone": "+1234567890",
  "city": "Bangalore",
  "country": "India",
  "avatarUrl": "https://...",
  "companyName": "My Company",
  "organizerType": "corporate",
  "skills": "Event setup, logistics",
  "bio": "Worker bio",
  "hourlyRate": 500,
  "age": 28,
  "experienceYears": 3,
  "aadhaarDocUrl": "https://...",
  "workerPhotoUrls": ["https://...", "https://..."],
  "gender": "male"
}
```
- **Response (200):** `{ "message": "Onboarding completed successfully" }`

---

## 2. Users (`/users`)

Base path: `{{baseUrl}}/users`  
All require: `Authorization: Bearer <token>`, `Content-Type: application/json` (for POST/PUT).

### 2.1 Get profile

- **Method:** `GET`
- **URL:** `{{baseUrl}}/users/profile`
- **Response (200):** `{ "id", "email", "name", "phone", "city", "country", "role", "isOnboarded", "avatarUrl", "profile", "photos" }`

---

### 2.2 Update profile

- **Method:** `PUT`
- **URL:** `{{baseUrl}}/users/profile`
- **Body (raw JSON):**
```json
{
  "name": "New Name",
  "phone": "+1234567890",
  "city": "Bangalore",
  "country": "India",
  "avatarUrl": "https://..."
}
```
- **Response (200):** `{ "message": "Profile updated successfully" }`

---

### 2.3 Update organizer profile

- **Method:** `PUT`
- **URL:** `{{baseUrl}}/users/organizer-profile`
- **Body (raw JSON):**
```json
{
  "companyName": "Company Ltd",
  "organizerType": "corporate"
}
```
- **Response (200):** `{ "message": "Organizer profile updated successfully" }`

---

### 2.4 Update worker profile

- **Method:** `PUT`
- **URL:** `{{baseUrl}}/users/worker-profile`
- **Body (raw JSON):**
```json
{
  "skills": "Event setup, driving",
  "bio": "Experienced worker",
  "hourlyRate": 400,
  "experienceYears": 2,
  "age": 25,
  "gender": "male",
  "aadhaarDocUrl": "https://...",
  "workerPhotoUrls": ["https://..."]
}
```
- **Response (200):** `{ "message": "Worker profile updated successfully" }`

---

### 2.5 Register device token (push)

- **Method:** `POST`
- **URL:** `{{baseUrl}}/users/device-token`
- **Body (raw JSON):**
```json
{
  "token": "fcm-or-apns-device-token-string",
  "platform": "android"
}
```
- **Response (200):** `{ "message": "Device token saved" }`

---

### 2.6 Get worker profile (organizer only)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/users/worker/:id`
- **Path param:** `id` = worker user ID
- **Response (200):** `{ "worker", "photos" }`

---

### 2.7 Wallet summary

- **Method:** `GET`
- **URL:** `{{baseUrl}}/users/wallet-summary`
- **Response (200):** `{ "pendingTotal": number }`

---

## 3. Events (`/events`)

Base path: `{{baseUrl}}/events`  
All require `Authorization: Bearer <token>`; JSON body where noted.

### 3.1 List my events (organizer)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/events`
- **Response (200):** `{ "events": [...] }`

---

### 3.2 My applied event IDs (worker)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/events/my/applications`
- **Response (200):** `{ "eventIds": ["uuid", ...] }`

---

### 3.3 My event applications details (worker)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/events/my/applications/details`
- **Response (200):** `{ "applications": [...] }`

---

### 3.4 Get single event

- **Method:** `GET`
- **URL:** `{{baseUrl}}/events/:id`
- **Path param:** `id` = event UUID
- **Response (200):** `{ "event", "gigs": [...] }`

---

### 3.5 Create event (organizer)

- **Method:** `POST`
- **URL:** `{{baseUrl}}/events`
- **Body (raw JSON):** `title` required; rest optional.
```json
{
  "title": "Summer Fest 2025",
  "description": "Annual event",
  "location": "Bangalore",
  "venue": "Main Hall",
  "eventDate": "2025-06-15",
  "endDate": "2025-06-16",
  "startTime": "09:00",
  "endTime": "18:00",
  "imageUrl": "https://...",
  "jobType": "event",
  "maleCount": 5,
  "femaleCount": 5,
  "malePay": 500,
  "femalePay": 500,
  "paymentMethod": "later",
  "subtotal": 5000,
  "commission": 500,
  "total": 5500,
  "latitude": 12.9716,
  "longitude": 77.5946
}
```
- **Response (201):** `{ "message", "eventId" }`

---

### 3.6 Update event (organizer)

- **Method:** `PUT`
- **URL:** `{{baseUrl}}/events/:id`
- **Body (raw JSON):**
```json
{
  "title": "Updated Title",
  "description": "...",
  "location": "...",
  "venue": "...",
  "eventDate": "2025-06-15",
  "startTime": "09:00",
  "endTime": "18:00",
  "imageUrl": "https://...",
  "status": "published"
}
```
- **Response (200):** `{ "message": "Event updated" }`

---

### 3.7 Delete event (organizer)

- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/events/:id`
- **Response (200):** `{ "message": "Event deleted" }`

---

### 3.8 Create event conversation (organizer)

- **Method:** `POST`
- **URL:** `{{baseUrl}}/events/:id/conversation`
- **Body:** none (or empty `{}`)
- **Response (201):** `{ "conversationId" }`

---

### 3.9 Browse all events (worker/organizer)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/events/browse/all`
- **Response (200):** `{ "events": [...] }`

---

### 3.10 Nearby events (worker)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/events/nearby?lat=12.9716&lng=77.5946&radiusKm=25`
- **Query params:** `lat` (required), `lng` (required), `radiusKm` (optional, default 25, max 100)
- **Response (200):** `{ "events": [...] }` (each may include `distanceKm`)

---

### 3.11 Apply to event (worker)

- **Method:** `POST`
- **URL:** `{{baseUrl}}/events/:id/apply`
- **Body (raw JSON):**
```json
{
  "coverLetter": "I am interested in this role."
}
```
- **Response (201):** `{ "message", "applicationId" }`

---

### 3.12 Get event applicants (organizer)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/events/:id/applicants`
- **Response (200):** `{ "applicants": [...] }`

---

### 3.13 Get event conversation ID

- **Method:** `GET`
- **URL:** `{{baseUrl}}/events/:id/conversation`
- **Response (200):** `{ "conversationId" }`

---

## 4. Gigs (`/gigs`)

Base path: `{{baseUrl}}/gigs`

### 4.1 Get gigs for event

- **Method:** `GET`
- **URL:** `{{baseUrl}}/gigs/event/:eventId`
- **Path param:** `eventId` = event UUID
- **Response (200):** `{ "gigs": [...] }`

---

### 4.2 Get single gig

- **Method:** `GET`
- **URL:** `{{baseUrl}}/gigs/:id`
- **Response (200):** `{ "gig": {...} }`

---

### 4.3 Create gig (organizer)

- **Method:** `POST`
- **URL:** `{{baseUrl}}/gigs`
- **Body (raw JSON):**
```json
{
  "eventId": "event-uuid-here",
  "title": "Setup Crew",
  "description": "Help with setup",
  "requirements": "Strong and punctual",
  "payRate": 400,
  "payType": "hourly",
  "positionsNeeded": 3,
  "startTime": "09:00",
  "endTime": "18:00"
}
```
- **Response (201):** `{ "message", "gigId" }`

---

### 4.4 Apply to gig (worker)

- **Method:** `POST`
- **URL:** `{{baseUrl}}/gigs/:id/apply`
- **Body (raw JSON):**
```json
{
  "coverLetter": "I'd like to apply."
}
```
- **Response (201):** `{ "message", "applicationId" }`

---

### 4.5 Get gig applications (organizer)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/gigs/:id/applications`
- **Response (200):** `{ "applications": [...] }`

---

### 4.6 Update application status (organizer)

- **Method:** `PUT`
- **URL:** `{{baseUrl}}/gigs/applications/:applicationId`
- **Body (raw JSON):**
```json
{
  "status": "accepted"
}
```
- **Allowed values:** `"pending"`, `"accepted"`, `"rejected"`
- **Response (200):** `{ "message": "Application status updated" }`

---

### 4.7 My gig applications (worker)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/gigs/my/applications`
- **Response (200):** `{ "applications": [...] }`

---

### 4.8 Browse all gigs

- **Method:** `GET`
- **URL:** `{{baseUrl}}/gigs/browse/all`
- **Response (200):** `{ "gigs": [...] }`

---

## 5. Applications (`/applications`)

Base path: `{{baseUrl}}/applications`

### 5.1 Update application status (event applications, organizer)

- **Method:** `PUT`
- **URL:** `{{baseUrl}}/applications/:id`
- **Body (raw JSON):**
```json
{
  "status": "accepted"
}
```
- **Allowed values:** `"pending"`, `"accepted"`, `"rejected"`
- **Response (200):** `{ "message", "status" }`

---

### 5.2 Get single application

- **Method:** `GET`
- **URL:** `{{baseUrl}}/applications/:id`
- **Response (200):** `{ "application": {...} }`

---

## 6. Messages (`/messages`)

Base path: `{{baseUrl}}/messages`

### 6.1 Get my conversations

- **Method:** `GET`
- **URL:** `{{baseUrl}}/messages/conversations`
- **Response (200):** `{ "conversations": [...] }`

---

### 6.2 Get messages in conversation

- **Method:** `GET`
- **URL:** `{{baseUrl}}/messages/conversations/:id`
- **Response (200):** `{ "messages": [...] }`

---

### 6.3 Get conversation info

- **Method:** `GET`
- **URL:** `{{baseUrl}}/messages/conversations/:id/info`
- **Response (200):** `{ "conversation", "participants": [...] }`

---

### 6.4 Send message

- **Method:** `POST`
- **URL:** `{{baseUrl}}/messages/conversations/:id/messages`
- **Body (raw JSON):**
```json
{
  "content": "Hello!",
  "messageType": "text"
}
```
- **Response (201):** `{ "message": "Message sent", "messageId" }`

---

### 6.5 Start new conversation (direct)

- **Method:** `POST`
- **URL:** `{{baseUrl}}/messages/conversations`
- **Body (raw JSON):**
```json
{
  "participantId": "user-uuid-of-other-person",
  "title": "Chat with John",
  "initialMessage": "Hi!"
}
```
- **Response (200/201):** `{ "conversationId", "existing": true|false }`

---

## 7. Uploads (`/uploads`)

Base path: `{{baseUrl}}/uploads`  
Note: Upload uses **multipart/form-data**, not JSON.

### 7.1 Upload file

- **Method:** `POST`
- **URL:** `{{baseUrl}}/uploads/upload`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** form-data
  - Key: `file` (type: File)
  - Value: select a file (max 20MB)
- **Response (200):** `{ "success": true, "fileId", "fileUrl" }`

---

### 7.2 Get file URL (no auth)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/uploads/file/:fileId`
- **Path param:** `fileId` from upload response
- **Response (200):** `{ "fileUrl" }`

---

## Quick test flow in Postman

1. **POST** `{{baseUrl}}/auth/register` with email, password, name → get `token`.
2. **POST** `{{baseUrl}}/auth/login` with same email/password → get fresh `token`.
3. Set **Authorization** to Bearer `<token>` for all following requests.
4. **GET** `{{baseUrl}}/auth/me` → confirm user and profile.
5. **POST** `{{baseUrl}}/auth/set-role` with `{ "role": "organizer" }` or `"worker"` → update token.
6. **POST** `{{baseUrl}}/auth/onboarding` with profile fields.
7. **GET** `{{baseUrl}}/users/profile` → confirm profile.
8. **POST** `{{baseUrl}}/events` (organizer) or **GET** `{{baseUrl}}/events/browse/all` (worker).
9. Use other endpoints as needed; ensure path params (`:id`, `:eventId`, etc.) are replaced with real IDs.

---

## Error responses

- **400** – Bad request (missing/invalid body or params). Body: `{ "error": "message" }`
- **401** – Unauthorized (missing or invalid token)
- **403** – Forbidden (wrong role or not allowed)
- **404** – Not found
- **409** – Conflict (e.g. already applied)
- **500** – Server error. Body: `{ "error": "Internal server error" }`

All JSON request bodies must use `Content-Type: application/json`. Use `Authorization: Bearer <token>` for every endpoint except register, login, and **GET** `/uploads/file/:fileId`.
