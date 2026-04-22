# Backend Socket.IO Complete Fix - Anonymous Typing Issue

The problem: Username showing as "Anonymous" means `socket.data.username` is not being set properly.

## Full corrected backend code:

```javascript
const app = require("./src/app");
const connectDB = require("./src/config/db");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

connectDB();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Create HTTP server from Express app
const server = http.createServer(app);

// Socket.IO with production-ready config
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ===== SOCKET MIDDLEWARE - Extract auth data =====
io.use((socket, next) => {
  const projectId = socket.handshake.auth.projectId;
  const userId = socket.handshake.auth.userId;
  const username = socket.handshake.auth.username;

  console.log(`🔐 Auth received - Username: ${username}, UserID: ${userId}`);

  if (!projectId) {
    return next(new Error("Project ID is required"));
  }

  // Store ALL auth data on socket.data
  socket.data.projectId = projectId;
  socket.data.userId = userId;
  socket.data.username = username || "Anonymous";

  console.log(`✓ Socket data set - Username: ${socket.data.username}`);
  next();
});

// ===== SOCKET CONNECTION =====
io.on("connection", (socket) => {
  console.log(
    `✓ User connected: ${socket.id} | Username: ${socket.data.username}`,
  );

  // ===== JOIN PROJECT =====
  socket.on("join-project", (projectId, callback) => {
    try {
      if (!projectId || typeof projectId !== "string") {
        throw new Error("Invalid project ID");
      }

      socket.join(projectId);
      console.log(
        `✓ User ${socket.data.username} (${socket.data.userId}) joined project ${projectId}`,
      );

      // Get all online users in this room
      const socketsInRoom = io.sockets.adapter.rooms.get(projectId);
      const onlineUsers = [];

      if (socketsInRoom) {
        socketsInRoom.forEach((socketId) => {
          const s = io.sockets.sockets.get(socketId);
          if (s && s.data && s.data.username) {
            onlineUsers.push({
              userId: s.data.userId,
              username: s.data.username,
              socketId: s.id,
            });
          }
        });
      }

      // Broadcast online users to everyone in room
      io.to(projectId).emit("online-users", onlineUsers);
      console.log(`👥 Online users in ${projectId}: ${onlineUsers.length}`);

      if (callback) callback({ status: "success" });
    } catch (error) {
      console.error(`✗ Error in join-project: ${error.message}`);
      if (callback) callback({ status: "error", message: error.message });
    }
  });

  // ===== TYPING INDICATOR =====
  socket.on("user-typing", (data) => {
    try {
      const projectId = data.projectId;

      if (!projectId) {
        throw new Error("Project ID is required");
      }

      // Use socket.data values (from auth middleware)
      const userId = socket.data.userId;
      const username = socket.data.username;

      console.log(
        `⌨️ User ${username} (${userId}) typing in project ${projectId}`,
      );

      // Broadcast to all others in project (excluding sender)
      socket.to(projectId).emit("user-typing", {
        userId: userId,
        username: username,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`✗ Error in user-typing: ${error.message}`);
    }
  });

  // ===== UPDATE CONTENT =====
  socket.on("update-content", async (data, callback) => {
    try {
      const projectId = data.projectId;
      const content = data.content;

      // Use socket.data values (from auth middleware)
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!projectId || typeof projectId !== "string") {
        throw new Error("Invalid project ID");
      }
      if (!content) {
        throw new Error("Content is required");
      }

      // Update database
      const Project = require("./src/models/project");
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { content },
        { new: true },
      );

      if (!updatedProject) {
        throw new Error("Project not found");
      }

      // Broadcast to others in same project
      socket.to(projectId).emit("receive-content", {
        content,
        updatedAt: new Date(),
        userId: userId,
        username: username,
      });

      if (callback) callback({ status: "success", projectId });
      console.log(`✓ Content updated for project ${projectId} by ${username}`);
    } catch (error) {
      console.error(`✗ Error in update-content: ${error.message}`);
      socket.emit("error", {
        event: "update-content",
        message: error.message,
      });
      if (callback) callback({ status: "error", message: error.message });
    }
  });

  // ===== LEAVE PROJECT =====
  socket.on("leave-project", (projectId) => {
    try {
      socket.leave(projectId);
      console.log(`✓ User ${socket.data.username} left project ${projectId}`);
    } catch (error) {
      console.error(`✗ Error in leave-project: ${error.message}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`✗ User disconnected: ${socket.id}`);
  });

  socket.on("error", (error) => {
    console.error(`✗ Socket error for ${socket.id}: ${error}`);
  });
});

// Listen
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 CORS origin: ${CLIENT_URL}`);
});
```

## Key fixes:

1. **Middleware logs auth** - `console.log` shows username received
2. **socket.data set correctly** - All three values stored: `projectId`, `userId`, `username`
3. **Typing uses socket.data** - Not from event data, but from auth middleware
4. **online-users broadcast** - Sends correct usernames to all clients
5. **Content includes username** - Broadcasts to others with correct user info

## Console output after fix:

```
🔐 Auth received - Username: john_doe, UserID: user-123
✓ Socket data set - Username: john_doe
✓ User connected: socket-id | Username: john_doe
✓ User john_doe (user-123) joined project proj-456
⌨️ User john_doe (user-123) typing in project proj-456
✓ Content updated for project proj-456 by john_doe
```

Now you should see the **actual username** instead of "Anonymous" in:

- ✅ Typing banner: "✏️ john_doe is typing..."
- ✅ Collaborators sidebar: "john_doe typing..."
- ✅ Console logs with usernames
