# STUNET - Complete Application Flow & Architecture

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     STUNET PLATFORM                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│   FRONTEND LAYER     │    │   BACKEND LAYER      │    │  DATABASE LAYER      │
│  (Client-Side)       │    │  (Server-Side)       │    │  (Data Storage)      │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
│                           │                          │
├─ stunet-home.html        ├─ Flask App              ├─ MongoDB
├─ stunet-home.css         ├─ Authentication Routes  │  ├─ users collection
├─ stunet-home.js          ├─ Password Management    │  ├─ profiles
├─ stunet.html (Login)     ├─ OTP Services          │  ├─ competitions
├─ stunet.css              ├─ Email Service         │  └─ teams
├─ stunet.js               ├─ User Management       │
├─ stunet-signup.html      ├─ Database Queries      │
├─ stunet-signup.css       └─ API Endpoints         │
└─ stunet-signup.js                                  │
```

---

## 🔄 User Journey Flow

### 1️⃣ **New User Registration Flow**

```
START
  ↓
User visits stunet-signup.html
  ↓
Fills registration form:
├─ Full Name
├─ Email
├─ Password (with strength validation)
├─ Confirm Password
└─ Agree to Terms & Conditions
  ↓
stunet-signup.js validates inputs
├─ Email format check
├─ Password requirements (8+ chars, uppercase, numbers, symbols)
├─ Password match confirmation
└─ Terms acceptance
  ↓
Form submission to /newlogin endpoint
  ↓
Backend (Flask) validates:
├─ Email domain (only allowed domains)
├─ Username uniqueness
├─ Email uniqueness
└─ Password strength
  ↓
Generate OTP (6-digit secure code)
  ↓
Send OTP via email (Flask-Mail)
  ↓
Show notification: "OTP sent to email"
  ↓
User enters OTP on verify page
  ↓
stunet-signup.js sends OTP to /verify-otp
  ↓
Backend verifies:
├─ OTP matches hash
├─ OTP not expired (10 min validity)
└─ HMAC signature valid
  ↓
Store user in MongoDB with:
├─ Hashed password (pbkdf2:sha256:600000)
├─ User details (name, email, phone, college, year, major)
├─ is_verified: true
└─ created_at timestamp
  ↓
Remove from pending_users
  ↓
Success notification: "Registration complete!"
  ↓
Redirect to login page (stunet.html)
  ↓
END
```

### 2️⃣ **Login Flow**

```
START
  ↓
User visits stunet.html
  ↓
Enters credentials:
├─ Username
└─ Password
  ↓
stunet.js validates inputs
  ↓
Send credentials to /login endpoint
  ↓
Backend verifies:
├─ User exists in database
├─ Password matches hash
└─ Email is verified (is_verified: true)
  ↓
If successful:
├─ Return user data (username, name, email)
├─ Save to localStorage
└─ Show success notification
  ↓
Redirect to home page (stunet-home.html)
  ↓
If failed:
├─ Show error: "Invalid credentials"
└─ Stay on login page
  ↓
END
```

### 3️⃣ **Forgot Password Flow**

```
START
  ↓
User clicks "Forgot Password?" on login page
  ↓
Redirects to forgot-password page
  ↓
User enters email
  ↓
Send POST to /forgot-password
  ↓
Backend:
├─ Finds user by email
├─ Generates OTP (6-digit)
├─ Creates HMAC signature with timestamp
├─ Stores in forgot_password_requests dict
└─ Sends OTP via email
  ↓
Show: "OTP sent to email"
  ↓
User enters OTP
  ↓
Option 1: Verify OTP
├─ Send to /verify-reset-otp with action="verify"
├─ Backend validates OTP
├─ Return username if valid
└─ Allow password reset form
  ↓
Option 2: Resend OTP (if expired)
├─ Send to /verify-reset-otp with action="resend"
├─ Backend generates new OTP
├─ Stores new hash
└─ Sends new OTP to email
  ↓
User enters new password
  ↓
Send to /reset-password with:
├─ Email
├─ Username
└─ New password
  ↓
Backend:
├─ Validates new password
├─ Hashes password
├─ Updates database
└─ Deletes from forgot_password_requests
  ↓
Success: "Password updated! Login now"
  ↓
Redirect to login page
  ↓
END
```

### 4️⃣ **Home Page Interaction Flow**

```
START
  ↓
User logged in → stunet-home.html loads
  ↓
stunet-home.js initializes:
├─ Scroll animations (Intersection Observer)
├─ Button interactions
├─ Navigation smooth scroll
├─ Profile card interactions
└─ Competition card interactions
  ↓
Available sections:
├─ Hero Section
│  ├─ Call-to-action buttons
│  ├─ Stats display
│  └─ Parallax visual effects
│
├─ Features Section
│  ├─ 4 feature cards with hover effects
│  └─ Icons from Font Awesome
│
├─ Explore Teammates Section
│  ├─ Search bar (real-time filtering)
│  ├─ Filter chips (Skills, Roles, Locations)
│  ├─ 6 profile cards
│  │  ├─ Avatar with role icon
│  │  ├─ Skills tags
│  │  ├─ Location + Rating
│  │  └─ "View Profile" button
│  └─ "Explore All Profiles" button
│
├─ Competitions Section
│  ├─ 4 competition cards
│  ├─ Each shows:
│  │  ├─ Badge (Trending, New, Design, Featured)
│  │  ├─ Competition name
│  │  ├─ Description
│  │  ├─ Participant count
│  │  ├─ Days remaining
│  │  └─ "Register Team" button
│  └─ onClick → showNotification()
│
├─ How It Works Section
│  ├─ 3-step process
│  ├─ Step 1: Create Profile
│  ├─ Step 2: Get Smart Matches
│  └─ Step 3: Build & Compete
│
├─ Community Section
│  ├─ 4 community features
│  ├─ 3 testimonials with 5-star ratings
│  └─ Interactive cards
│
└─ CTA Section
   ├─ Call-to-action
   └─ "Get Started Free" button
  ↓
User interactions trigger:
├─ Navigation → Smooth scroll to section
├─ Search → Real-time profile filtering
├─ Filter chips → Toggle filters
├─ Button clicks → Show notifications
├─ Hover effects → Card transformations
└─ Parallax → Mouse movement tracking
  ↓
Notifications display using:
├─ showNotification(message, type)
├─ Auto-dismiss after 3 seconds
└─ Slide animation
  ↓
END
```

---

## 📁 File-by-File Breakdown

### **Frontend Files**

#### **stunet-home.html** (Landing/Home Page)
- **Purpose**: Main landing page with all features
- **Components**:
  - Navigation header with logo and menu
  - Hero section with CTA
  - Features grid (4 cards)
  - Explore teammates section with profile cards
  - Competitions section
  - How it works (3 steps)
  - Community highlights + testimonials
  - CTA footer section
  - Footer with links
- **Links to**: stunet-home.css, stunet-home.js
- **Loaded after**: User logs in successfully

#### **stunet-home.css** (Home Page Styling)
- **Purpose**: Responsive styling for home page
- **Features**:
  - CSS variables for colors, spacing, shadows
  - Responsive grid layouts
  - Animation keyframes (float, slideInLeft, fadeInUp)
  - Media queries (1024px, 768px, 480px)
  - Hover effects for cards
  - Button gradients and transitions
- **Breakpoints**:
  - 1024px: Tablet layout
  - 768px: Medium mobile
  - 480px: Small mobile

#### **stunet-home.js** (Home Page Interactivity)
- **Purpose**: Interactive features for home page
- **Functions**:
  - `initializeScrollAnimations()` - Lazy load animations
  - `initializeButtonInteractions()` - Button feedback
  - `initializeNavigation()` - Smooth scroll navigation
  - `initializeProfileCards()` - Profile card hover effects
  - `initializeCompetitionCards()` - Competition card interactions
  - `showNotification(message, type)` - Toast notifications
  - `updateActiveNavLink()` - Active nav highlighting
- **Events Handled**:
  - Click events on buttons
  - Scroll events for nav highlighting
  - Hover effects on cards
  - Search input filtering
  - Filter chip toggles

#### **stunet.html** (Login Page)
- **Purpose**: User login interface
- **Components**:
  - Left section: Branding with chess pieces
  - Right section: Login form
  - Email input field
  - Password input field with toggle visibility
  - Remember me checkbox
  - Forgot password link
  - Sign in button
  - Sign up link (redirect to signup)
- **Links to**: stunet.css, stunet.js
- **Destination**: Home page on successful login

#### **stunet.css** (Login Page Styling)
- **Purpose**: Login page styling
- **Features**:
  - Premium glassmorphism design
  - Chess piece animations
  - Gradient backgrounds
  - Input field styling with focus states
  - Button animations
  - Notification toast styling
  - Dark theme with subtle gradients
  - Responsive mobile layout
- **Special Effects**:
  - Chess piece bobbing animations
  - Floating orb background
  - Glow effects on pieces
  - Smooth transitions

#### **stunet.js** (Login Page Script)
- **Purpose**: Login functionality and validation
- **Functions**:
  - `validateEmail(email)` - Email format validation
  - `validatePassword(password)` - Password length check
  - `clearError(element)` - Clear error messages
  - `showError(element, message)` - Display errors
  - `handleLogin(email, password)` - Process login
  - `simulateApiCall(email, password)` - API call simulation
  - `showNotification(message, type)` - Toast notifications
  - `loadRememberedEmail()` - Load saved email
- **Events**:
  - Form submission
  - Password toggle visibility
  - Forgot password link
  - Remember me checkbox
  - Keyboard shortcuts (Enter, Escape)

#### **stunet-signup.html** (Registration Page)
- **Purpose**: User registration interface
- **Components**:
  - Left section: Branding (hidden on mobile)
  - Right section: Signup form
  - Full name input
  - Email input
  - Password input with toggle
  - Confirm password input with toggle
  - Terms & conditions checkbox
  - Create account button
  - Sign in link
- **Links to**: stunet-signup.css, stunet-signup.js
- **Destination**: OTP verification page

#### **stunet-signup.css** (Signup Page Styling)
- **Purpose**: Signup page styling
- **Features**:
  - Chess pieces display (larger)
  - Queen, Rook, King pieces positioned differently
  - Form styling with proper spacing
  - Password field with toggle button
  - Error message styling
  - Checkbox styling
  - Responsive layout
  - Mobile-optimized form

#### **stunet-signup.js** (Signup Page Script)
- **Purpose**: Registration validation and submission
- **Functions**:
  - `validateFullName(fullname)` - Name validation
  - `validateEmail(email)` - Email validation
  - `validatePassword(password)` - Password validation
  - `passwordStrength(password)` - Check password strength
  - `clearError(element)` - Clear error display
  - `showError(element, message)` - Show error message
  - `handleSignup(fullname, email, password)` - Process signup
  - `simulateApiCall(...)` - API call simulation
  - `showNotification(message, type)` - Toast notifications
- **Events**:
  - Form submission
  - Field blur events for validation
  - Password visibility toggle
  - Password match checking
  - Terms agreement validation

---

### **Backend Files**

#### **app.py (Flask Backend)**
- **Purpose**: Server-side logic and API endpoints
- **Technologies**: Flask, PyMongo, Flask-Mail, Flask-CORS

##### **Utility Functions**:
1. `is_valid_email(email)` 
   - Regex validation
   - Domain whitelist check
   - Returns (boolean, message)

2. `is_valid_password(password)`
   - Length validation (8+ chars)
   - Format checking
   - Returns (boolean, message)

3. `generate_otp()`
   - Secure 6-digit code
   - Uses secrets module

4. `hash_otp(otp)`
   - SHA256 hashing
   - For resend-otp functionality

##### **API Endpoints**:

**1. `/newlogin` (POST)**
- **Request Data**:
  ```json
  {
    "fullname": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "phoneNumber": "1234567890",
    "college": "MIT",
    "year": "2024",
    "major": "Computer Science"
  }
  ```
- **Process**:
  - Validates all fields
  - Checks email domain
  - Checks username/email uniqueness
  - Generates OTP
  - Stores in `pending_users` dict
  - Sends OTP via email
- **Response**: OTP sent confirmation with username

**2. `/verify-otp` (POST)**
- **Request Data**:
  ```json
  {
    "username": "john_doe",
    "otp": "123456"
  }
  ```
- **Process**:
  - Validates OTP format
  - Checks HMAC signature
  - Verifies expiration (10 min)
  - Creates user in MongoDB
  - Sets `is_verified: true`
- **Response**: Registration success

**3. `/resend-otp` (POST)**
- **Request Data**:
  ```json
  {
    "username": "john_doe"
  }
  ```
- **Process**:
  - Generates new OTP
  - Updates hash and expiry
  - Sends new OTP via email
- **Response**: OTP resent confirmation

**4. `/login` (POST)**
- **Request Data**:
  ```json
  {
    "username": "john_doe",
    "password": "SecurePass123!"
  }
  ```
- **Process**:
  - Finds user in database
  - Compares password hash
  - Checks email verification
  - Returns user data
- **Response**: User data + status

**5. `/api/user/<username>` (GET)**
- **Purpose**: Retrieve user profile
- **Response**: User details (name, email, college, etc.)

**6. `/forgot-password` (POST)**
- **Request Data**:
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Process**:
  - Finds verified user by email
  - Generates OTP
  - Stores in `forgot_password_requests`
  - Sends OTP via email
- **Response**: OTP sent confirmation

**7. `/verify-reset-otp` (POST)**
- **Request Data**:
  ```json
  {
    "email": "john@example.com",
    "otp": "123456",
    "action": "verify" or "resend"
  }
  ```
- **Process**:
  - If action = "resend": Generate new OTP
  - If action = "verify": Validate OTP signature
  - Check expiration
  - Return username if valid
- **Response**: Verification status or new OTP sent

**8. `/reset-password` (POST)**
- **Request Data**:
  ```json
  {
    "email": "john@example.com",
    "username": "john_doe",
    "new_password": "NewSecure123!"
  }
  ```
- **Process**:
  - Validates new password
  - Hashes password
  - Updates in MongoDB
  - Clears `forgot_password_requests`
- **Response**: Password update success

---

## 🔐 Security Features

### **Password Security**
- Hash method: `pbkdf2:sha256:600000` (600,000 iterations)
- Never stored in plaintext
- Compared using `check_password_hash()`

### **OTP Security**
- 6-digit random code using `secrets` module
- HMAC-SHA256 signature for verification
- 10-minute expiration
- Timestamp included in signature
- Can be resent if expired

### **Email Validation**
- Regex pattern validation
- Whitelist of allowed domains:
  - gmail.com, yahoo.com, outlook.com, hotmail.com
  - icloud.com, aol.com, protonmail.com, alibto.com

### **CORS Protection**
- Only allows from:
  - http://127.0.0.1:5500
  - http://localhost:5500

### **Database Records**
```json
{
  "_id": "john_doe",
  "password": "$pbkdf2-sha256$600000$...",
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "college": "MIT",
  "year": "2024",
  "major": "Computer Science",
  "is_verified": true,
  "failed_attempts": 0,
  "created_at": "2025-02-17T10:30:00+00:00"
}
```

---

## 📊 Data Flow Diagrams

### **Registration Data Flow**

```
Frontend (stunet-signup.html)
  ↓ (User fills form)
stunet-signup.js (Validates locally)
  ↓ (POST /newlogin)
Flask Backend (app.py)
  ├─ Validates email/password
  ├─ Checks uniqueness
  ├─ Generates OTP
  ├─ Creates hash with HMAC
  └─ Sends email
  ↓ (Response with username)
Frontend receives OTP
  ↓ (User enters OTP)
stunet-signup.js (POST /verify-otp)
  ↓
Flask Backend
  ├─ Verifies HMAC signature
  ├─ Checks expiration
  ├─ Hashes password (pbkdf2)
  └─ Inserts into MongoDB
  ↓ (Response: success)
Frontend
  ├─ Shows success message
  └─ Redirects to login
```

### **Login Data Flow**

```
Frontend (stunet.html)
  ↓ (User enters credentials)
stunet.js (Validates format)
  ↓ (POST /login)
Flask Backend
  ├─ Finds user in MongoDB
  ├─ Verifies password hash
  └─ Checks is_verified flag
  ↓ (Response with user data)
Frontend
  ├─ Saves to localStorage
  ├─ Shows notification
  └─ Redirects to stunet-home.html
  ↓
stunet-home.js loads
  ├─ Initializes animations
  └─ Sets up interactions
```

### **Password Reset Data Flow**

```
Frontend (Login page → Forgot Password)
  ↓ (User enters email)
POST /forgot-password
  ↓
Backend
  ├─ Finds user by email
  ├─ Generates OTP
  ├─ Creates HMAC signature
  └─ Sends email
  ↓ (OTP sent response)
User gets email, enters OTP
  ↓
Option A: Send /verify-reset-otp (action="verify")
  ├─ Backend validates OTP
  └─ Returns username
  ↓
User enters new password
  ↓
POST /reset-password
  ├─ Backend updates password
  └─ Clears reset request
  ↓
Success → Redirect to login

Option B: OTP expired? Click "Resend OTP"
  ↓
POST /verify-reset-otp (action="resend")
  ├─ Backend generates new OTP
  └─ Sends new email
  ↓
Repeat from user enters OTP
```

---

## 🔌 Connection Points Summary

| From | To | Method | Data |
|------|----|---------|----|
| stunet-signup.html | stunet-signup.js | Script tag | - |
| stunet-signup.js | app.py /newlogin | POST | Signup form |
| stunet-signup.js | app.py /verify-otp | POST | Username + OTP |
| stunet.html | stunet.js | Script tag | - |
| stunet.js | app.py /login | POST | Username + Password |
| stunet.js | app.py /forgot-password | POST | Email |
| stunet.js | app.py /verify-reset-otp | POST | Email + OTP |
| stunet.js | app.py /reset-password | POST | Email + Username + Password |
| stunet-home.html | stunet-home.js | Script tag | - |
| stunet-home.js | User interactions | Events | - |
| app.py | MongoDB | PyMongo | User documents |
| app.py | Email Service | Flask-Mail | OTP emails |

---

## 🚀 Deployment Flow

```
Development
  ↓
1. Start Flask backend: python app.py
2. Open stunet-signup.html in browser (or use Live Server)
3. Test signup flow → Backend creates user
4. Test login flow → Backend validates credentials
5. Test forgot password → Backend handles reset
6. Navigate to stunet-home.html → Test interactions

Production
  ↓
1. Deploy Flask app to server (Heroku, AWS, etc.)
2. Update API endpoints in frontend files
3. Configure MongoDB Atlas cloud instance
4. Set up email service (Gmail, SendGrid)
5. Set environment variables (.env)
6. Deploy frontend files to CDN or web server
7. Configure CORS for production domain
```

---

## 📋 Environment Variables (.env)

```
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/stunet?retryWrites=true&w=majority

# Secret
SECRET_KEY=your-secret-key-here

# Email
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

---

## ✅ Testing Checklist

- [ ] Signup with valid email
- [ ] Signup with invalid email (wrong domain)
- [ ] Signup with weak password
- [ ] Verify OTP correctly
- [ ] Try wrong OTP
- [ ] Try expired OTP
- [ ] Resend OTP
- [ ] Login with correct credentials
- [ ] Login with wrong credentials
- [ ] Remember me checkbox
- [ ] Forgot password flow
- [ ] Resend reset OTP
- [ ] Reset password successfully
- [ ] Home page animations load
- [ ] Search profiles in real-time
- [ ] Filter chips work
- [ ] Button notifications show
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Email notifications sent

---

## 🎯 Key Features Connected

1. **Authentication System**
   - Signup → OTP verification → Login
   - Password reset with OTP resend option

2. **Frontend UI/UX**
   - Responsive across all devices
   - Smooth animations and transitions
   - Form validation (client & server side)
   - Interactive components

3. **Backend API**
   - RESTful endpoints
   - Input validation
   - Security (hashing, HMAC, domain whitelist)
   - Email notifications

4. **Database Integration**
   - MongoDB for user storage
   - Efficient queries
   - Data persistence

5. **User Experience**
   - Notifications for all actions
   - Error handling and messages
   - Loading states
   - Accessibility features
