# Backend Socket.IO Updates Needed

Update your backend server to handle typing indicators and user info:

## Changes to make in your main server file:

```javascript
// Add this inside the "join-project" handler:
socket.on("join-project", (projectId, callback) => {
  try {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Invalid project ID");
    }
    socket.join(projectId);
    console.log(`✓ User ${socket.id} joined project ${projectId}`);
    
    // Get user info from handshake
    const username = socket.handshake.auth.username || "Anonymous";
    const userId = socket.handshake.auth.userId || socket.id;
    
    // Store user info on socket
    socket.data.username = username;
    socket.data.userId = userId;
    socket.data.projectId = projectId;
    
    if (callback) callback({ status: "success" });
  } catch (error) {
    console.error(`✗ Error in join-project: ${error.message}`);
    if (callback) callback({ status: "error", message: error.message });
  }
});

// ADD THIS NEW HANDLER for typing indicators:
socket.on("user-typing", (data) => {
  try {
    const { projectId, userId, username } = data;
    
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    
    // Broadcast to all others in project (not the sender)
    socket.to(projectId).emit("user-typing", {
      userId,
      username,
      timestamp: new Date(),
    });
    
    console.log(`⌨️ User ${username} (${userId}) typing in project ${projectId}`);
  } catch (error) {
    console.error(`✗ Error in user-typing: ${error.message}`);
  }
});

// Update "update-content" to include user info:
socket.on("update-content", async (data, callback) => {
  try {
    const { projectId, content, userId, username } = data;

    // Validate input
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

    // Broadcast to others in same project (excluding sender)
    socket.to(projectId).emit("receive-content", {
      content,
      updatedAt: new Date(),
      userId: userId || socket.id,
      username: username || "Anonymous",
    });

    // Send acknowledgment back to sender
    if (callback) {
      callback({ status: "success", projectId });
    }
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
```

## Key additions:
1. **user-typing handler** - Broadcasts typing status with username to all collaborators
2. **User data storage** - Stores username and userId on each socket connection
3. **Updated update-content** - Now includes userId and username in the broadcast
