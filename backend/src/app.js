const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRouter");
const projectRoutes = require("./routes/projectRouter");
const userRoutes = require("./routes/userRouter");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working 🔥" });
});
app.use("/api/project", projectRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

module.exports = app;
