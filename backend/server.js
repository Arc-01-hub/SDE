const app = require("./src/app");
const connectDB = require("./src/config/db");
const http = require("http");
const { Server } = require("socket.io");
const Project = require("./src/models/project");
require("dotenv").config();

connectDB();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const server = http.createServer(app);

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

  if (!projectId) {
    return next(new Error("Project ID is required"));
  }

  socket.data.projectId = projectId;
  socket.data.userId = userId;
  socket.data.username = username || "Anonymous";

  next();
});

// ===== HELPER: Get all collaborators for a project =====
const getAllCollaborators = async (projectId) => {
  try {
    const project = await Project.findById(projectId).populate("collaborators");
    if (!project) return [];
    
    const socketsInRoom = io.sockets.adapter.rooms.get(projectId);
    const onlineUserIds = new Set();
    
    if (socketsInRoom) {
      socketsInRoom.forEach((socketId) => {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.data && s.data.userId) {
          onlineUserIds.add(s.data.userId);
        }
      });
    }
    
    return project.collaborators.map((collab) => ({
      userId: collab._id.toString(),
      username: collab.userName || collab.name || "Unknown",
      online: onlineUserIds.has(collab._id.toString()),
    }));
  } catch (error) {
    console.error(`✗ Error fetching collaborators: ${error.message}`);
    return [];
  }
};

io.on("connection", (socket) => {

  socket.on("join-project", (projectId, callback) => {
    try {
      if (!projectId || typeof projectId !== "string") {
        throw new Error("Invalid project ID");
      }

      socket.join(projectId);

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

      io.to(projectId).emit("online-users", onlineUsers);

      if (callback) callback({ status: "success" });
    } catch (error) {
      if (callback) callback({ status: "error", message: error.message });
    }
  });

  socket.on("user-typing", (data) => {
    try {
      const projectId = data.projectId;

      if (!projectId) {
        throw new Error("Project ID is required");
      }

      const userId = socket.data.userId;
      const username = socket.data.username;

      socket.to(projectId).emit("user-typing", {
        userId: userId,
        username: username,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`✗ Error in user-typing: ${error.message}`);
    }
  });

  socket.on("update-content", async (data, callback) => {
    try {
      const projectId = data.projectId;
      const content = data.content;

      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!projectId || typeof projectId !== "string") {
        throw new Error("Invalid project ID");
      }
      if (!content) {
        throw new Error("Content is required");
      }

      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { content },
        { new: true },
      );

      if (!updatedProject) {
        throw new Error("Project not found");
      }

      socket.to(projectId).emit("receive-content", {
        content,
        updatedAt: new Date(),
        userId: userId,
        username: username,
      });

      if (callback) callback({ status: "success", projectId });
    } catch (error) {
      socket.emit("error", {
        event: "update-content",
        message: error.message,
      });
      if (callback) callback({ status: "error", message: error.message });
    }
  });

  socket.on("leave-project", (projectId) => {
    try {
      socket.leave(projectId);
      console.log(`👋 User ${socket.data.username} left project ${projectId}`);
    } catch (error) {
      console.error(`✗ Error leaving project: ${error.message}`);
    }
  });

  // ===== GET ALL COLLABORATORS =====
  socket.on("get-collaborators", async (projectId) => {
    try {
      if (!projectId || typeof projectId !== "string") {
        throw new Error("Invalid project ID");
      }

      const collaborators = await getAllCollaborators(projectId);
      socket.emit("all-collaborators", collaborators);
      console.log(`📋 Sent ${collaborators.length} collaborators to ${socket.data.username}`);
    } catch (error) {
      console.error(`✗ Error in get-collaborators: ${error.message}`);
      socket.emit("error", {
        event: "get-collaborators",
        message: error.message,
      });
    }
  });

  // ===== TITLE CHANGE =====
  socket.on("title-change", async (data) => {
    try {
      const projectId = data.projectId;
      const title = data.title;
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!projectId || typeof projectId !== "string") {
        throw new Error("Invalid project ID");
      }

      // Update in database
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { title },
        { new: true }
      );

      if (!updatedProject) {
        throw new Error("Project not found");
      }

      // Broadcast to others in room
      socket.to(projectId).emit("title-change", {
        title,
        userId,
        username,
        timestamp: new Date(),
      });

      console.log(`📝 Title changed by ${username} in project ${projectId}`);
    } catch (error) {
      console.error(`✗ Error in title-change: ${error.message}`);
      socket.emit("error", {
        event: "title-change",
        message: error.message,
      });
    }
  });

  // ===== TAG CHANGE =====
  socket.on("tag-change", async (data) => {
    try {
      const projectId = data.projectId;
      const tags = data.tags;
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!projectId || typeof projectId !== "string") {
        throw new Error("Invalid project ID");
      }
      if (!Array.isArray(tags)) {
        throw new Error("Tags must be an array");
      }

      // Update in database
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { tags },
        { new: true }
      );

      if (!updatedProject) {
        throw new Error("Project not found");
      }

      // Broadcast to others in room
      socket.to(projectId).emit("tag-change", {
        tags,
        userId,
        username,
        timestamp: new Date(),
      });

      console.log(`🏷️  Tags changed by ${username} in project ${projectId}`);
    } catch (error) {
      console.error(`✗ Error in tag-change: ${error.message}`);
      socket.emit("error", {
        event: "tag-change",
        message: error.message,
      });
    }
  });

  // ===== SEND MESSAGE (Direct messaging) =====
  socket.on("send-message", (data) => {
    try {
      const projectId = data.projectId;
      const recipientId = data.recipientId;
      const userId = socket.data.userId;
      const username = socket.data.username;
      const message = data.message;
      const timestamp = data.timestamp || new Date().toISOString();

      if (!projectId || !recipientId || !message) {
        throw new Error("Project ID, recipient ID, and message are required");
      }

      // Find the recipient's socket
      const socketsInRoom = io.sockets.adapter.rooms.get(projectId);
      let recipientSocket = null;

      if (socketsInRoom) {
        socketsInRoom.forEach((socketId) => {
          const s = io.sockets.sockets.get(socketId);
          if (s && s.data && s.data.userId === recipientId) {
            recipientSocket = s;
          }
        });
      }

      // Send message to recipient if online
      if (recipientSocket) {
        recipientSocket.emit("chat-message", {
          projectId,
          userId,
          username,
          message,
          timestamp,
        });

        console.log(`💬 Message from ${username} to ${recipientId}`);
      } else {
        console.log(`⚠️  Recipient ${recipientId} not found in room ${projectId}`);
      }
    } catch (error) {
      console.error(`✗ Error in send-message: ${error.message}`);
      socket.emit("error", {
        event: "send-message",
        message: error.message,
      });
    }
  });

  // ===== CURSOR POSITION =====
  socket.on("cursor-position", (data) => {
    try {
      const projectId = data.projectId;
      const userId = socket.data.userId;
      const username = socket.data.username;
      const line = data.line;
      const position = data.position;

      if (!projectId) {
        throw new Error("Project ID is required");
      }

      // Broadcast cursor position to others
      socket.to(projectId).emit("cursor-position", {
        userId,
        username,
        line,
        position,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`✗ Error in cursor-position: ${error.message}`);
    }
  });

  // ===== HANDLE DISCONNECT =====
  socket.on("disconnect", (reason) => {
    try {
      const projectId = socket.data.projectId;
      const userId = socket.data.userId;
      const username = socket.data.username;

      console.log(`🚪 Socket ${socket.id} disconnected. Reason: ${reason}`);

      if (projectId && userId) {
        // Notify others in the room
        io.to(projectId).emit("user-disconnect", {
          userId,
          username,
          timestamp: new Date(),
        });

        // Get updated online users list
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

        io.to(projectId).emit("online-users", onlineUsers);
        console.log(`👥 ${onlineUsers.length} users remain in project ${projectId}`);
      }
    } catch (error) {
      console.error(`✗ Error in disconnect handler: ${error.message}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
