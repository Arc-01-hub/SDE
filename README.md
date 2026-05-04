# 📝 SDE — Shared Document Editor

A real-time collaborative document editor built with React, Node.js, Socket.IO and AI writing assistance powered by Groq.

![SDE Dashboard](https://images.unsplash.com/photo-1556155092-490a1ba16284?w=800&q=80)

---

## ✨ Features

- 📄 **Real-time collaborative editing** — multiple users edit simultaneously
- 🤖 **AI Writing Assistant** — improve, fix grammar, summarize, translate with Groq AI
- 👥 **Collaborator management** — invite teammates via email
- 🔔 **Notification system** — real-time invitations
- 🗑️ **Trash & Restore** — soft delete with restore functionality
- 📊 **Activity history** — track all project changes
- 💬 **In-editor chat** — message collaborators in real time
- 🌙 **Dark/Light mode** — theme support
- 📱 **Responsive design** — works on mobile and desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router, TipTap Editor, Socket.IO Client |
| Backend | Node.js, Express 5, Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| AI | Groq API (Llama 3.1) |
| Real-time | Socket.IO WebSockets |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) (local) or MongoDB Atlas account
- [Git](https://git-scm.com/)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Arc-01-hub/SDE.git
cd SDE
```

---

### 2️⃣ Setup Backend

```bash
cd backend
npm install
```

Create the `.env` file inside the `backend/` folder:

```bash
# backend/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/sde
JWT_SECRET=your_secret_key_here
GROQ_API_KEY=your_groq_api_key_here
```

> 💡 Get a free Groq API key at [console.groq.com](https://console.groq.com)

---

### 3️⃣ Setup Frontend

```bash
cd ../frontend
npm install
```

Create the `.env` file inside the `frontend/` folder:

```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:5000/api
```

---

### 4️⃣ Start MongoDB

**Local MongoDB:**
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

**Or use MongoDB Atlas** — just replace `MONGO_URI` in `backend/.env` with your Atlas connection string.

---

### 5️⃣ Run the Project

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm start
```

You should see:
```
Server running on port 5000
MongoDB connected
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```

You should see:
```
Compiled successfully!
Local: http://localhost:3000
```

---

### 6️⃣ Open the App

Open your browser and go to:

```
http://localhost:3000
```

---

## 📱 Access from Another Device (Same WiFi)

Find your PC's IP address:
```bash
# Windows
ipconfig

# macOS/Linux
ifconfig
```

Update `frontend/.env`:
```bash
REACT_APP_API_URL=http://YOUR_IP:5000/api
```

Then access from phone/tablet:
```
http://YOUR_IP:3000
```

---

## 🔄 Update to Latest Version

```bash
git pull origin main
cd backend && npm install
cd ../frontend && npm install
```

---

## 📁 Project Structure

```
SDE/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes
│   │   └── app.js            # Express app
│   ├── server.js             # Entry point + Socket.IO
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/         # Login, Register
│   │   │   ├── dashboard/    # Main dashboard
│   │   │   ├── editor/       # Document editor + AI
│   │   │   ├── home/         # Landing page
│   │   │   └── notificationBell/
│   │   ├── styles/           # Global CSS variables
│   │   └── App.js
│   └── package.json
└── README.md
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/project/user/:id` | Get user projects |
| POST | `/api/project/create` | Create project |
| PUT | `/api/project/update/:id` | Update project |
| DELETE | `/api/project/:id` | Move to trash |
| GET | `/api/project/trash/:userId` | Get trashed projects |
| PUT | `/api/project/restore/:id` | Restore from trash |
| DELETE | `/api/project/permanent/:id` | Permanently delete |

### AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/assist` | AI writing assistance |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity/recent/:userId` | Get recent activities |
| GET | `/api/activity/project/:projectId` | Get project activities |

---

## 🤖 AI Writing Assistant

The editor includes a built-in AI assistant powered by **Groq (Llama 3.1)**:

1. Open any project in the editor
2. Select text (or leave unselected to use full document)
3. Click **🤖 AI Assist** in the toolbar
4. Choose an action:
   - ✨ **Improve Writing** — clearer & more professional
   - 🔧 **Fix Grammar** — correct errors
   - ✂️ **Make Shorter** — concise version
   - 📝 **Make Longer** — add more detail
   - 📋 **Summarize** — 2-3 sentence summary
   - 🌍 **Translate** — switch between English/French
5. Click **Apply to Editor** to insert the result

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | ✅ |
| `MONGO_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ |
| `GROQ_API_KEY` | Groq API key for AI features | ✅ |

### Frontend (`frontend/.env`)
| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | ✅ |

---

## 👥 Team

| Name | Role |
|------|------|
| Salaheddine | Frontend Developer |
| Anas (Moujahid) | Backend Developer |

---

## 📄 License

This project is for educational purposes.
