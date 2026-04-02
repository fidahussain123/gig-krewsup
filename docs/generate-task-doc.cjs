const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak
} = require("docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };
const accentColor = "E94560";
const navyColor = "1A1A2E";
const lightBg = "F8F9FC";

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, color: "344054" } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: navyColor },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: navyColor },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "533483" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 }
      },
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "subbullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } }
        }]
      },
    ]
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accentColor, space: 8 } },
              spacing: { after: 100 },
              children: [
                new TextRun({ text: "KrewsUp", font: "Arial", bold: true, size: 20, color: navyColor }),
                new TextRun({ text: "  |  Task Document", font: "Arial", size: 18, color: "667085" }),
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E4E7EC", space: 8 } },
              children: [
                new TextRun({ text: "CONFIDENTIAL  |  KrewsUp Engineering  |  Page ", size: 16, color: "98A2B3" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "98A2B3" }),
              ]
            })
          ]
        })
      },
      children: [
        // ==================== TITLE BLOCK ====================
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "TASK DOCUMENT", font: "Arial", bold: true, size: 44, color: navyColor })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "Authentication Migration: Email to Phone + Firebase OTP", font: "Arial", size: 24, color: accentColor, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: "Version 1.0  |  March 26, 2026", font: "Arial", size: 18, color: "667085" })]
        }),

        // Meta table
        new Table({
          width: { size: 9720, type: WidthType.DXA },
          columnWidths: [3240, 6480],
          rows: [
            makeMetaRow("Project", "KrewsUp - React Native Gig Platform"),
            makeMetaRow("Assigned To", "Nisarga, Kabilian"),
            makeMetaRow("Priority", "High"),
            makeMetaRow("Estimated Effort", "3-4 Days"),
            makeMetaRow("Created By", "Fida Hussain"),
            makeMetaRow("Date", "March 26, 2026"),
          ]
        }),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ==================== 1. OVERVIEW ====================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Overview")] }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({
            text: "Migrate the KrewsUp app authentication system from the current email + password based login/registration to phone number + Firebase OTP verification. Additionally, during the onboarding flow, replace the phone number input field with an email input field (since the phone number will already be captured during authentication).",
            size: 22
          })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({
            text: "This change improves UX by reducing friction (no passwords), aligns with Indian market user behavior (phone-first), and ensures verified phone numbers for all users from day one.",
            size: 22, italics: true, color: "667085"
          })]
        }),

        // ==================== 2. CURRENT FLOW ====================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Current Authentication Flow")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Registration (Current)")] }),
        makeBullet("User enters Name, Email, Password on LandingScreen"),
        makeBullet("Frontend calls POST /api/auth/register with { email, password, name }"),
        makeBullet("Backend hashes password with bcrypt, creates user in DB with email as unique identifier"),
        makeBullet("JWT token returned, user proceeds to role selection"),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Login (Current)")] }),
        makeBullet("User enters Email + Password"),
        makeBullet("Frontend calls POST /api/auth/login"),
        makeBullet("Backend verifies password hash, returns JWT"),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.3 Onboarding (Current)")] }),
        makeBullet("Worker onboarding collects: Name, Email, Phone, City, Country, Age, Gender, Experience, Aadhaar, Photos"),
        makeBullet("Organizer onboarding collects: Company Name, Type, Email, Phone, City, Country"),
        makeBullet("Both send phone number to backend via POST /api/auth/onboarding"),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ==================== 3. REQUIRED CHANGES ====================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Required Changes")] }),

        // Summary Table
        new Table({
          width: { size: 9720, type: WidthType.DXA },
          columnWidths: [2430, 3645, 3645],
          rows: [
            new TableRow({
              children: [
                makeHeaderCell("Area", 2430),
                makeHeaderCell("Current", 3645),
                makeHeaderCell("New", 3645),
              ]
            }),
            makeChangeRow("Auth Screen", "Email + Password fields", "Phone Number + OTP fields"),
            makeChangeRow("Registration", "Email/password signup", "Phone + Firebase OTP verify"),
            makeChangeRow("Login", "Email/password login", "Phone + Firebase OTP verify"),
            makeChangeRow("Backend Auth", "bcrypt password hashing", "Firebase Admin SDK token verify"),
            makeChangeRow("DB User Lookup", "Lookup by email", "Lookup by phone number"),
            makeChangeRow("Worker Onboarding", "Phone number field", "Email field (replaces phone)"),
            makeChangeRow("Organizer Onboarding", "Phone number field", "Email field (replaces phone)"),
            makeChangeRow("User Table", "email as unique ID", "phone as primary, email optional"),
          ]
        }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ==================== 4. TECHNICAL DETAILS ====================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Technical Implementation Details")] }),

        // --- 4.1 Firebase Setup ---
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.1 Firebase Setup")] }),
        makeNumbered("Create Firebase project (or use existing) at console.firebase.google.com"),
        makeNumbered("Enable Phone Authentication under Authentication > Sign-in method"),
        makeNumbered("Add Android app (package: from app.json) and download google-services.json"),
        makeNumbered("Add iOS app (bundle ID: from app.json) and download GoogleService-Info.plist"),
        makeNumbered("Install packages:"),
        makeCodeBlock("npx expo install @react-native-firebase/app @react-native-firebase/auth"),
        makeNumbered("Install Firebase Admin SDK on backend:"),
        makeCodeBlock("npm install firebase-admin"),
        new Paragraph({ spacing: { after: 160 }, children: [] }),

        // --- 4.2 Frontend Changes ---
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.2 Frontend Changes")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("A. LandingScreen.tsx (Auth Screen)")] }),
        makeBullet("Remove email and password fields entirely"),
        makeBullet("Add phone number input with country code picker (+91 default)"),
        makeBullet("Add \"Send OTP\" button that calls Firebase auth().signInWithPhoneNumber(phoneNumber)"),
        makeBullet("Show OTP input (6 digits) after OTP is sent"),
        makeBullet("On OTP verification success, get Firebase ID token via user.getIdToken()"),
        makeBullet("Send Firebase ID token to backend POST /api/auth/firebase-login"),
        makeBullet("Remove isLoginMode toggle (OTP flow handles both login and registration)"),
        new Paragraph({ spacing: { after: 80 }, children: [] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("B. AuthContext.tsx")] }),
        makeBullet("Replace login(email, password) with loginWithPhone(firebaseIdToken)"),
        makeBullet("Replace register(email, password, name) with same loginWithPhone flow"),
        makeBullet("Update User interface: make email optional, add phone as required"),
        makeBullet("Update api.ts: Replace /auth/login and /auth/register calls with /auth/firebase-login"),
        new Paragraph({ spacing: { after: 80 }, children: [] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("C. WorkerOnboardingScreen.tsx")] }),
        makeBullet("Remove the phone field from formData (phone already captured at auth)"),
        makeBullet("Add email field in place of phone (label: \"Email Address\", keyboard: email-address)"),
        makeBullet("Update handleSubmit to send email instead of phone in onboarding payload"),
        makeBullet("Keep all other fields: Name, City, Country, Age, Gender, Experience, Aadhaar, Photos"),
        new Paragraph({ spacing: { after: 80 }, children: [] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("D. OrganizerOnboardingScreen.tsx")] }),
        makeBullet("Remove the phone field from formData"),
        makeBullet("Add email field in place of phone"),
        makeBullet("Update handleSubmit to send email instead of phone"),
        makeBullet("Keep all other fields: Company Name, Type, City, Country"),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // --- 4.3 Backend Changes ---
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.3 Backend Changes")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("A. New File: config/firebase.ts")] }),
        makeBullet("Initialize Firebase Admin SDK with service account credentials"),
        makeBullet("Export verifyIdToken(token) function to decode Firebase tokens"),
        makeBullet("Store service account JSON in environment variable (FIREBASE_SERVICE_ACCOUNT)"),
        new Paragraph({ spacing: { after: 80 }, children: [] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("B. routes/auth.ts - Replace register and login routes")] }),
        makeBullet("Remove POST /register (email+password registration)"),
        makeBullet("Remove POST /login (email+password login)"),
        makeBullet("Add POST /firebase-login endpoint:"),
        makeSubBullet("Receive { firebaseIdToken } in request body"),
        makeSubBullet("Verify token using Firebase Admin SDK"),
        makeSubBullet("Extract phone number from decoded token"),
        makeSubBullet("Check if user exists by phone number in DB"),
        makeSubBullet("If exists: generate JWT and return user data (login flow)"),
        makeSubBullet("If not exists: create new user with phone number, generate JWT (register flow)"),
        makeSubBullet("Return { user, token, isNewUser } so frontend knows to redirect to role selection"),
        new Paragraph({ spacing: { after: 80 }, children: [] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("C. routes/auth.ts - Update onboarding route")] }),
        makeBullet("POST /onboarding: Accept email field and save to users.email"),
        makeBullet("Remove phone from onboarding payload (already saved at registration)"),
        makeBullet("Email is optional but recommended (for notifications/receipts)"),
        new Paragraph({ spacing: { after: 80 }, children: [] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("D. Database Migration")] }),
        makeBullet("Add phone column to users table (VARCHAR, UNIQUE, NOT NULL for new users)"),
        makeBullet("Make email column nullable (was required before)"),
        makeBullet("Remove password_hash column (no longer needed)"),
        makeBullet("Update unique constraint from email to phone"),
        makeCodeBlock("ALTER TABLE users ADD COLUMN phone TEXT UNIQUE;\nALTER TABLE users ALTER COLUMN email DROP NOT NULL;\nALTER TABLE users DROP COLUMN password_hash;"),
        new Paragraph({ spacing: { after: 80 }, children: [] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("E. middleware/auth.ts")] }),
        makeBullet("JWT generation: Include phone instead of email in token payload"),
        makeBullet("Update generateToken to use { id, phone, name, role }"),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ==================== 5. FILES TO MODIFY ====================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Files to Modify")] }),

        new Table({
          width: { size: 9720, type: WidthType.DXA },
          columnWidths: [5400, 4320],
          rows: [
            new TableRow({
              children: [
                makeHeaderCell("File Path", 5400),
                makeHeaderCell("Change Type", 4320),
              ]
            }),
            makeFileRow("screens/LandingScreen.tsx", "Major rewrite - Phone + OTP UI"),
            makeFileRow("contexts/AuthContext.tsx", "Update auth methods & User interface"),
            makeFileRow("lib/api.ts", "Replace login/register API calls"),
            makeFileRow("screens/WorkerOnboardingScreen.tsx", "Swap phone field to email"),
            makeFileRow("screens/OrganizerOnboardingScreen.tsx", "Swap phone field to email"),
            makeFileRow("backend/src/routes/auth.ts", "Major rewrite - Firebase verify"),
            makeFileRow("backend/src/middleware/auth.ts", "Update JWT payload"),
            makeFileRow("backend/src/config/firebase.ts", "New file - Firebase Admin init"),
            makeFileRow("backend/src/db/supabase-schema.sql", "Schema migration"),
            makeFileRow("app.config.js / app.json", "Add Firebase config (google-services)"),
            makeFileRow("package.json", "Add @react-native-firebase packages"),
            makeFileRow("backend/package.json", "Add firebase-admin package"),
          ]
        }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ==================== 6. IMPORTANT NOTES ====================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Important Notes & Constraints")] }),

        makeBullet("DO NOT change any other frontend screens or backend logic beyond auth and onboarding"),
        makeBullet("All existing features (events, applications, chat, wallet) must continue to work"),
        makeBullet("JWT-based session management remains the same (backend issues JWT after Firebase verify)"),
        makeBullet("Firebase is ONLY used for OTP verification, not as the primary auth database"),
        makeBullet("The backend remains the source of truth for user data (Turso/LibSQL database)"),
        makeBullet("Handle edge cases: OTP resend timer (60s), invalid OTP, expired OTP, network errors"),
        makeBullet("For testing: Firebase provides test phone numbers in console (avoid SMS costs)"),
        makeBullet("Phone number format: Store in E.164 format (+91XXXXXXXXXX)"),
        makeBullet("Existing users with email-only accounts will need a migration path (discuss with team)"),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ==================== 7. ACCEPTANCE CRITERIA ====================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Acceptance Criteria")] }),

        new Table({
          width: { size: 9720, type: WidthType.DXA },
          columnWidths: [540, 7560, 1620],
          rows: [
            new TableRow({
              children: [
                makeHeaderCell("#", 540),
                makeHeaderCell("Criteria", 7560),
                makeHeaderCell("Status", 1620),
              ]
            }),
            makeACRow("1", "User can enter phone number and receive OTP via SMS"),
            makeACRow("2", "User can verify OTP and get logged in / registered automatically"),
            makeACRow("3", "New users are redirected to role selection after first OTP verify"),
            makeACRow("4", "Returning users are redirected to their dashboard after OTP verify"),
            makeACRow("5", "Worker onboarding shows Email field instead of Phone field"),
            makeACRow("6", "Organizer onboarding shows Email field instead of Phone field"),
            makeACRow("7", "Email entered during onboarding is saved to user profile"),
            makeACRow("8", "Phone number is stored in E.164 format in the database"),
            makeACRow("9", "OTP resend button appears after 60 second cooldown"),
            makeACRow("10", "Error states shown for invalid OTP, expired OTP, network failures"),
            makeACRow("11", "All existing features (events, chat, wallet, applications) work unchanged"),
            makeACRow("12", "Backend validates Firebase token before creating/returning JWT"),
            makeACRow("13", "No password fields exist anywhere in the app"),
            makeACRow("14", "Works on both iOS and Android"),
          ]
        }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ==================== 8. UI FLOW ====================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. New Authentication UI Flow")] }),

        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: "Screen 1 - Phone Entry:", bold: true, size: 22 })]
        }),
        makeBullet("KrewsUp logo + branding at top"),
        makeBullet("\"Enter your phone number\" heading"),
        makeBullet("Country code selector (default +91) + phone number input"),
        makeBullet("\"Send OTP\" accent button (disabled until 10 digits entered)"),
        makeBullet("Loading state while OTP is being sent"),
        new Paragraph({ spacing: { after: 80 }, children: [] }),

        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: "Screen 2 - OTP Verification:", bold: true, size: 22 })]
        }),
        makeBullet("\"Verify your number\" heading with phone number shown"),
        makeBullet("6-digit OTP input (auto-focus, auto-advance between boxes)"),
        makeBullet("\"Verify\" accent button"),
        makeBullet("\"Resend OTP\" link with countdown timer (60s)"),
        makeBullet("\"Change number\" link to go back"),
        makeBullet("Auto-verify if SMS auto-read is available (Android)"),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ==================== 9. TIMELINE ====================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Estimated Timeline")] }),

        new Table({
          width: { size: 9720, type: WidthType.DXA },
          columnWidths: [1080, 5400, 1620, 1620],
          rows: [
            new TableRow({
              children: [
                makeHeaderCell("Day", 1080),
                makeHeaderCell("Task", 5400),
                makeHeaderCell("Owner", 1620),
                makeHeaderCell("Status", 1620),
              ]
            }),
            makeTimelineRow("1", "Firebase project setup + SDK installation + config", "Nisarga"),
            makeTimelineRow("1", "Database schema migration (add phone, make email nullable)", "Kabilian"),
            makeTimelineRow("2", "Backend: Firebase Admin setup + POST /firebase-login endpoint", "Kabilian"),
            makeTimelineRow("2", "Frontend: LandingScreen rewrite (Phone + OTP UI)", "Nisarga"),
            makeTimelineRow("3", "Frontend: AuthContext + api.ts updates", "Nisarga"),
            makeTimelineRow("3", "Backend: Update onboarding route + JWT payload", "Kabilian"),
            makeTimelineRow("3", "Frontend: Update both onboarding screens (phone to email swap)", "Nisarga"),
            makeTimelineRow("4", "Integration testing + edge case handling + bug fixes", "Both"),
            makeTimelineRow("4", "iOS + Android build verification", "Both"),
          ]
        }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ==================== 10. TESTING ====================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("10. Testing Checklist")] }),

        makeBullet("New user: Phone OTP > Role Selection > Onboarding (with email) > Dashboard"),
        makeBullet("Returning user: Phone OTP > Dashboard (skip role/onboarding)"),
        makeBullet("Invalid OTP entry shows error message"),
        makeBullet("OTP expiry (after 5 min) shows \"OTP expired, resend\" message"),
        makeBullet("Resend OTP works after cooldown timer"),
        makeBullet("Network error during OTP send shows retry option"),
        makeBullet("Email field in onboarding validates format"),
        makeBullet("Email saves correctly to database via onboarding endpoint"),
        makeBullet("Existing features unaffected (create event, apply, chat, wallet)"),
        makeBullet("Works on iOS simulator + Android emulator + physical devices"),
        new Paragraph({ spacing: { after: 300 }, children: [] }),

        // Signature block
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E4E7EC", space: 16 } },
          spacing: { before: 200 },
          children: [
            new TextRun({ text: "End of Document", size: 18, color: "98A2B3", italics: true }),
          ]
        }),
      ]
    }
  ]
});

// Helper functions
function makeMetaRow(label, value) {
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 3240, type: WidthType.DXA },
        shading: { fill: "F2F4F7", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: navyColor })] })]
      }),
      new TableCell({
        borders,
        width: { size: 6480, type: WidthType.DXA },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })]
      }),
    ]
  });
}

function makeHeaderCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: navyColor, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF" })] })]
  });
}

function makeChangeRow(area, current, newVal) {
  return new TableRow({
    children: [
      new TableCell({
        borders, width: { size: 2430, type: WidthType.DXA }, margins: cellMargins,
        shading: { fill: lightBg, type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: area, bold: true, size: 19 })] })]
      }),
      new TableCell({
        borders, width: { size: 3645, type: WidthType.DXA }, margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: current, size: 19, color: "D92D20" })] })]
      }),
      new TableCell({
        borders, width: { size: 3645, type: WidthType.DXA }, margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: newVal, size: 19, color: "039855" })] })]
      }),
    ]
  });
}

function makeFileRow(path, change) {
  return new TableRow({
    children: [
      new TableCell({
        borders, width: { size: 5400, type: WidthType.DXA }, margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: path, size: 19, font: "Courier New" })] })]
      }),
      new TableCell({
        borders, width: { size: 4320, type: WidthType.DXA }, margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: change, size: 19 })] })]
      }),
    ]
  });
}

function makeACRow(num, criteria) {
  return new TableRow({
    children: [
      new TableCell({
        borders, width: { size: 540, type: WidthType.DXA }, margins: cellMargins,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: num, size: 19, bold: true })] })]
      }),
      new TableCell({
        borders, width: { size: 7560, type: WidthType.DXA }, margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: criteria, size: 19 })] })]
      }),
      new TableCell({
        borders, width: { size: 1620, type: WidthType.DXA }, margins: cellMargins,
        shading: { fill: "FEF3F2", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Pending", size: 18, color: "D92D20" })] })]
      }),
    ]
  });
}

function makeTimelineRow(day, task, owner) {
  return new TableRow({
    children: [
      new TableCell({
        borders, width: { size: 1080, type: WidthType.DXA }, margins: cellMargins,
        shading: { fill: lightBg, type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Day ${day}`, size: 19, bold: true })] })]
      }),
      new TableCell({
        borders, width: { size: 5400, type: WidthType.DXA }, margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: task, size: 19 })] })]
      }),
      new TableCell({
        borders, width: { size: 1620, type: WidthType.DXA }, margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: owner, size: 19, bold: true, color: "533483" })] })]
      }),
      new TableCell({
        borders, width: { size: 1620, type: WidthType.DXA }, margins: cellMargins,
        shading: { fill: "FEF3F2", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Pending", size: 18, color: "D92D20" })] })]
      }),
    ]
  });
}

function makeBullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 21 })]
  });
}

function makeSubBullet(text) {
  return new Paragraph({
    numbering: { reference: "subbullets", level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 20 })]
  });
}

function makeNumbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 21 })]
  });
}

function makeCodeBlock(text) {
  return new Paragraph({
    spacing: { before: 60, after: 100 },
    indent: { left: 720 },
    shading: { fill: "F2F4F7", type: ShadingType.CLEAR },
    children: [new TextRun({ text, size: 18, font: "Courier New", color: navyColor })]
  });
}

// Generate
const outputPath = "/Users/fidahussainsp/Documents/Krewsup-RN/gig-krewsup/docs/KrewsUp_Auth_Migration_Task.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Task document generated: " + outputPath);
});
