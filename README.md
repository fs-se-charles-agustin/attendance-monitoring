# 🔐 React + TypeScript Authentication Boilerplate

A **production-ready full-stack authentication boilerplate** built with **React + TypeScript** on the frontend and **Node.js + Express + MongoDB** on the backend.

Designed for **real-world apps**, this boilerplate includes secure authentication, OTP verification, password reset, and JWT-based session handling — all structured cleanly and easy to extend.

---

## ✨ Features

### Frontend
- ⚛️ React + TypeScript (Vite)
- 🎨 Tailwind CSS + shadcn/ui
- 🔐 JWT Authentication (Auth Context)
- 🧠 React Hook Form
- 🔀 React Router v6
- 📧 Login / Signup
- 🔢 OTP Verification
- 🔁 Forgot & Reset Password
- 💾 Persistent Login (localStorage)

### Backend
- 🚀 Node.js + Express + TypeScript
- 🗄️ MongoDB + Mongoose
- 🔐 Passport.js (Local Strategy)
- 🔑 JWT Authentication
- 🔒 Password hashing (bcrypt)
- 📧 Email service (Nodemailer)
- 🔢 OTP-based Signup Verification
- 🔁 Secure Password Reset Flow
- 🌐 CORS configured for frontend integration
- 🔄 Nodemon for auto-reload development

---

## 🧠 Why This Boilerplate?

- Clean separation of concerns
- Secure authentication patterns
- Ready for production or scaling
- Ideal for startups, SaaS, and portfolio projects
- Easy to plug into any React app

---

## 📁 Project Structure

auth-boilerplate/
├── client/
│ ├── src/
│ │ ├── auth/ # AuthContext & hooks
│ │ ├── components/ # UI components
│ │ ├── pages/ # Login, Signup, OTP, Reset
│ │ ├── services/ # API & auth services
│ │ └── main.tsx
│ └── .env
│
├── server/
│ ├── src/
│ │ ├── controllers/ # Auth controllers
│ │ ├── models/ # Mongoose schemas
│ │ ├── routes/ # API routes
│ │ ├── services/ # Email / OTP services
│ │ ├── config/ # Passport & DB config
│ │ ├── app.ts # Express app configuration
│ │ └── server.ts # Server entry point
│ ├── nodemon.json # Nodemon configuration
│ └── .env
│
└── README.md


---

## ⚙️ Environment Variables

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

### Server (`server/.env`)
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

CLIENT_URL=http://localhost:5173
```

> ⚠️ **Note:** Use Gmail App Passwords, not your real email password. Make sure `CLIENT_URL` doesn't have a trailing slash.

🚀 Getting Started
1️⃣ Clone the repository

git clone https://github.com/your-username/auth-boilerplate.git
cd auth-boilerplate

2️⃣ Install dependencies
Backend

cd server
npm install

Frontend

cd ../client
npm install

3️⃣ Run the application

**Start backend (Development with auto-reload)**
```bash
cd server
npm start
# or
npm run dev
```

**Start backend (Production)**
```bash
cd server
npm run build
npm run start:prod
```

**Start frontend**
```bash
cd ../client
npm run dev
```

- **Frontend** → http://localhost:5173
- **Backend** → http://localhost:5000/api

> 💡 **Tip:** Use `npm start` in the server directory for development - it uses nodemon to automatically restart on file changes without needing to build first.

🔐 Authentication Flow
Signup

    User submits signup form

    Backend creates user and generates OTP

    OTP sent via email

    User verifies OTP

    Account is activated

Login

    Passport validates credentials

    JWT is issued

    Token stored in localStorage

    AuthContext manages session state

Forgot Password

    User requests password reset

    Reset token emailed securely

    Token verified

    Password updated

## 📘 API Documentation

**Base URL:** `http://localhost:5000/api`

### 🔹 Auth Routes

#### Signup
```http
POST /auth/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@email.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "OTP sent to your email. Please verify to complete registration."
}
```

#### Verify Signup OTP
```http
POST /auth/verify-signup-otp
Content-Type: application/json

{
  "email": "user@email.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Account verified successfully. You can now login."
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@email.com",
  "password": "password123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "expiresIn": "1d"
}
```

#### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@email.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "new_password"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

#### Admin Reset Password (Development Only)
```http
POST /auth/admin/reset-password
Content-Type: application/json

{
  "email": "user@email.com",
  "newPassword": "new_password"
}
```

> ⚠️ **Warning:** This endpoint is only available in development mode. It's blocked in production for security.

## 🛡️ Security Highlights

- ✅ bcrypt password hashing (with salt rounds)
- ✅ JWT expiration handling (configurable: 1 day or 7 days with "Remember Me")
- ✅ OTP verification for signup (6-digit, 10-minute expiration)
- ✅ Hashed reset tokens (SHA-256)
- ✅ Protected routes via Passport.js middleware
- ✅ Email verification required before login
- ✅ Secure password reset flow with time-limited tokens
- ✅ CORS properly configured with origin validation

## 🧱 Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router v6
- React Hook Form

### Backend
- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Passport.js (Local & JWT Strategies)
- JWT (jsonwebtoken)
- bcrypt
- Nodemailer
- Nodemon (Development)

## 📌 Available Scripts

### Server
- `npm start` - Start development server with nodemon (auto-reload, no build needed)
- `npm run dev` - Start development server with ts-node-dev
- `npm run build` - Build TypeScript to JavaScript
- `npm run start:prod` - Start production server (requires build first)

### Client
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📌 Roadmap

- ✅ JWT Authentication
- ✅ OTP Verification
- ✅ Password Reset Flow
- ✅ Email Service Integration
- ✅ CORS Configuration
- ✅ Development Tools (Nodemon)
- ⏳ OAuth (Google / GitHub)
- ⏳ Rate Limiting
- ⏳ Refresh Tokens
- ⏳ Role-Based Access Control (RBAC)

📄 License

MIT License — free to use, modify, and ship.
