# PRD: Phone Number Authentication with Firebase OTP

**Version:** 1.0  
**Date:** March 24, 2026  
**Status:** Draft  
**Author:** Engineering Team

---

## 1. Overview

### 1.1 Problem Statement
The current Krewsup authentication system uses email + password, which creates friction for gig workers who:
- May not regularly check email
- Prefer quick mobile-first authentication
- Are accustomed to OTP-based login (common in India for apps like Swiggy, Zomato, Urban Company)

### 1.2 Proposed Solution
Replace email/password authentication with **phone number + Firebase OTP verification** on a **single unified screen** that handles both new user registration and returning user login seamlessly.

### 1.3 Goals
- Reduce authentication friction and drop-off rates
- Provide familiar, mobile-native login experience
- Eliminate password management burden for users
- Improve security through phone verification

---

## 2. Current State

### 2.1 Existing Flow
```
LandingScreen (Email + Password)
    ├── Login Mode: Email + Password → Role Selection
    └── Register Mode: Name + Email + Password → Role Selection
```

### 2.2 Files Affected
| File | Current Role | Changes Required |
|------|--------------|------------------|
| `screens/LandingScreen.tsx` | Email/password form with login/register toggle | Complete rewrite for phone + OTP flow |
| `contexts/AuthContext.tsx` | Email-based login/register methods | Add phone auth methods |
| `lib/api.ts` | `/auth/login`, `/auth/register` endpoints | Add `/auth/send-otp`, `/auth/verify-otp` |
| `backend/src/routes/auth.ts` | Email/password auth handlers | Add OTP verification handlers |
| `backend/src/config/database.ts` | User schema with email | Add `phone` field, make `email` optional |

---

## 3. Proposed Flow

### 3.1 Single-Page Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        LANDING SCREEN                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 1: Phone Number Entry                              │   │
│  │                                                          │   │
│  │  [🇮🇳 +91 ▼] [    Enter phone number    ]               │   │
│  │                                                          │   │
│  │  [        Send OTP        ]                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 2: OTP Verification (slides in / replaces)         │   │
│  │                                                          │   │
│  │  Enter the 6-digit code sent to +91 98765 43210          │   │
│  │                                                          │   │
│  │  [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ] [ 6 ]                     │   │
│  │                                                          │   │
│  │  Resend OTP (00:30)                                      │   │
│  │                                                          │   │
│  │  [        Verify & Continue        ]                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 3: Name Entry (NEW USERS ONLY)                     │   │
│  │                                                          │   │
│  │  What should we call you?                                │   │
│  │                                                          │   │
│  │  [    Enter your full name    ]                          │   │
│  │                                                          │   │
│  │  [        Get Started        ]                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 User Journey

#### New User
1. Enter phone number → Send OTP
2. Enter 6-digit OTP → Verify
3. Enter name (only shown for new users)
4. → Role Selection → Onboarding

#### Returning User
1. Enter phone number → Send OTP
2. Enter 6-digit OTP → Verify
3. → Automatically logged in, redirected based on state

---

## 4. Technical Requirements

### 4.1 Dependencies to Add

```json
{
  "dependencies": {
    "@react-native-firebase/app": "^21.x",
    "@react-native-firebase/auth": "^21.x"
  }
}
```

### 4.2 Firebase Configuration

#### Android (`android/app/google-services.json`)
- Download from Firebase Console
- Place in `android/app/` directory

#### iOS (`ios/GoogleService-Info.plist`)
- Download from Firebase Console
- Add to Xcode project

#### App Config (`app.config.js`)
```javascript
{
  plugins: [
    "@react-native-firebase/app",
    "@react-native-firebase/auth"
  ]
}
```

### 4.3 API Endpoints

#### POST `/auth/send-otp`
```typescript
// Request
{
  phone: string;        // "+919876543210"
  countryCode: string;  // "+91"
}

// Response (Success)
{
  success: true;
  message: "OTP sent successfully";
  isNewUser: boolean;   // Hint for UI (optional)
}

// Response (Error)
{
  error: "Invalid phone number" | "Too many requests" | "Service unavailable"
}
```

#### POST `/auth/verify-otp`
```typescript
// Request
{
  phone: string;
  firebaseIdToken: string;  // From Firebase Auth
  name?: string;            // Required for new users
}

// Response (Success)
{
  user: {
    id: string;
    name: string;
    phone: string;
    role: "organizer" | "worker" | null;
    isOnboarded: boolean;
  };
  token: string;  // JWT for API auth
  isNewUser: boolean;
}

// Response (Error)
{
  error: "Invalid OTP" | "OTP expired" | "Verification failed"
}
```

### 4.4 Database Schema Changes

```sql
-- Modify users table
ALTER TABLE users ADD COLUMN phone TEXT UNIQUE;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Add index for phone lookup
CREATE INDEX idx_users_phone ON users(phone);
```

### 4.5 AuthContext Changes

```typescript
interface AuthContextType {
  // Existing
  isLoggedIn: boolean;
  role: Role | null;
  isOnboarded: boolean;
  user: User | null;
  isLoading: boolean;
  token: string | null;
  logout: () => void;
  setRole: (role: Role) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  
  // New - Replace login/register
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otp: string, name?: string) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
  
  // Deprecated (remove after migration)
  // login: (email: string, password: string) => Promise<...>;
  // register: (email: string, password: string, name: string) => Promise<...>;
}
```

---

## 5. UI/UX Specifications

### 5.1 Screen States

| State | UI Elements | Actions |
|-------|-------------|---------|
| `phone_entry` | Country picker, phone input, "Send OTP" button | Submit phone |
| `otp_sent` | OTP input (6 boxes), timer, "Resend", "Verify" button, "Change number" link | Enter OTP, resend, go back |
| `name_entry` | Name input, "Get Started" button | Submit name (new users only) |
| `loading` | Spinner overlay | None (disabled) |
| `error` | Error banner above form | Retry action |

### 5.2 Component Breakdown

```
LandingScreen
├── Header (Logo, tagline)
├── PhoneEntryStep
│   ├── CountryCodePicker (default: +91)
│   ├── PhoneInput
│   └── SendOtpButton
├── OtpVerificationStep
│   ├── PhoneDisplay (masked)
│   ├── OtpInput (6 boxes, auto-advance)
│   ├── ResendTimer
│   └── VerifyButton
├── NameEntryStep (conditional)
│   ├── NameInput
│   └── GetStartedButton
└── Footer (Terms & Privacy)
```

### 5.3 Animations & Transitions

- Steps transition with horizontal slide animation
- OTP boxes highlight on focus with scale animation
- Success state shows checkmark before navigation
- Error state shakes the relevant input

### 5.4 Validation Rules

| Field | Validation |
|-------|------------|
| Phone | 10 digits (India), starts with 6-9 |
| OTP | 6 digits, numeric only |
| Name | 2-50 characters, letters and spaces only |

### 5.5 Error Messages

| Scenario | Message |
|----------|---------|
| Invalid phone format | "Please enter a valid 10-digit mobile number" |
| OTP expired | "This code has expired. Please request a new one" |
| Wrong OTP | "Incorrect code. Please try again" |
| Too many attempts | "Too many attempts. Please try again in 5 minutes" |
| Network error | "Connection failed. Please check your internet" |

---

## 6. Security Considerations

### 6.1 Rate Limiting
- Max 5 OTP requests per phone per hour
- Max 5 verification attempts per OTP
- Exponential backoff after failures

### 6.2 Phone Number Storage
- Store in E.164 format (+919876543210)
- Mask in UI display (+91 98765 ***10)

### 6.3 Firebase Security Rules
- OTP expires after 60 seconds
- Use Firebase App Check for additional security
- Implement reCAPTCHA for web (if needed)

---

## 7. Implementation Tasks

### Phase 1: Setup (Day 1)
- [ ] Add Firebase dependencies to project
- [ ] Configure Firebase project (Android + iOS)
- [ ] Update `app.config.js` with Firebase plugins
- [ ] Test Firebase Auth initialization

### Phase 2: Backend (Day 2)
- [ ] Update database schema (add phone, make email optional)
- [ ] Create `/auth/send-otp` endpoint (validate phone, log for debugging)
- [ ] Create `/auth/verify-otp` endpoint (verify Firebase token, create/login user)
- [ ] Add rate limiting middleware
- [ ] Update `/auth/me` to return phone

### Phase 3: Frontend - Auth Context (Day 3)
- [ ] Add `sendOtp` method to AuthContext
- [ ] Add `verifyOtp` method to AuthContext  
- [ ] Add Firebase phone auth integration
- [ ] Handle confirmation result and verification

### Phase 4: Frontend - UI (Day 4-5)
- [ ] Create `PhoneEntryStep` component
- [ ] Create `OtpVerificationStep` component with auto-advance inputs
- [ ] Create `NameEntryStep` component
- [ ] Implement step transitions and animations
- [ ] Add country code picker (default India +91)
- [ ] Implement resend timer (30s countdown)

### Phase 5: Testing & Polish (Day 6)
- [ ] Test on Android device (real OTP)
- [ ] Test on iOS device (real OTP)
- [ ] Test error scenarios
- [ ] Test rate limiting
- [ ] Add loading states and error handling
- [ ] Accessibility review

---

## 8. Migration Strategy

### 8.1 Existing Users
- Users with email-only accounts can add phone number in profile settings
- Consider one-time migration prompt on next login

### 8.2 Rollback Plan
- Keep email/password endpoints active but hidden
- Feature flag to switch between auth methods
- Database supports both email and phone

---

## 9. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Auth completion rate | Baseline | +20% improvement |
| Time to authenticate | ~45 seconds | <30 seconds |
| Support tickets (auth issues) | Baseline | -50% reduction |

---

## 10. Open Questions

1. **Country support**: Start with India only (+91) or support multiple countries?
   - *Recommendation*: India only for v1, expand later

2. **Fallback auth**: Should we keep email/password as backup?
   - *Recommendation*: Remove entirely for simplicity

3. **Phone number change**: How can users update their phone number?
   - *Recommendation*: Re-verification flow in profile settings

---

## Appendix A: Firebase Phone Auth Code Example

```typescript
import auth from '@react-native-firebase/auth';

// Send OTP
const sendOtp = async (phoneNumber: string) => {
  try {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    return { success: true, confirmation };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Verify OTP
const verifyOtp = async (confirmation: any, code: string) => {
  try {
    const credential = await confirmation.confirm(code);
    const idToken = await credential.user.getIdToken();
    
    // Send to backend for JWT exchange
    const response = await api.verifyOtp(phoneNumber, idToken, name);
    return response;
  } catch (error) {
    return { success: false, error: 'Invalid OTP' };
  }
};
```

---

## Appendix B: Mockup Reference

```
┌────────────────────────────────────────┐
│ ←                                      │
│                                        │
│   🏃 KrewsUp                           │
│   Find gigs. Hire crews. Chat instantly│
│                                        │
│   ─────────────────────────────────    │
│                                        │
│   Enter your mobile number             │
│   We'll send you a verification code   │
│                                        │
│   ┌──────┬─────────────────────────┐   │
│   │🇮🇳+91│  98765 43210           │   │
│   └──────┴─────────────────────────┘   │
│                                        │
│   ┌────────────────────────────────┐   │
│   │         Send OTP               │   │
│   └────────────────────────────────┘   │
│                                        │
│                                        │
│   By continuing, you agree to our      │
│   Terms of Service and Privacy Policy  │
│                                        │
└────────────────────────────────────────┘
```

---

**Document Version History**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | March 24, 2026 | Initial draft | Engineering Team |
