const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const { router: authRoutes } = require("./routes/auth");
const otpRoutes = require("./routes/otp");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const timeEntryRoutes = require("./routes/timeEntries");
const userRoutes = require("./routes/users");
const reportRoutes = require("./routes/reports");
const teamRoutes = require("./routes/teams");
const breakRoutes = require("./routes/breaks");
const organizationRoutes = require("./routes/organizations");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Custom logging middleware to show request details including body
app.use((req, res, next) => {
  const method = req.method;
  const url = req.originalUrl || req.url;

  // Simple, clean request log
  console.log(`\n🌐 ${method} ${url}`);

  // Show authorization status (without token details)
  if (req.get("authorization")) {
    console.log(`🔐 Authenticated`);
  }

  // Log request body for POST/PUT/PATCH requests
  if (
    ["POST", "PUT", "PATCH"].includes(method) &&
    req.body &&
    Object.keys(req.body).length > 0
  ) {
    const sanitizedBody = { ...req.body };

    // Mask sensitive fields
    if (sanitizedBody.password) sanitizedBody.password = "***";
    if (sanitizedBody.token) sanitizedBody.token = "***";

    console.log(`📤 Request Body:`);
    console.log(JSON.stringify(sanitizedBody, null, 2));
  }

  // Log response when it finishes
  const originalSend = res.send;
  res.send = function (data) {
    const statusCode = res.statusCode;

    if (statusCode >= 400) {
      console.log(`❌ Error ${statusCode}`);

      // Show error details
      if (data) {
        try {
          const responseData =
            typeof data === "string" ? JSON.parse(data) : data;
          if (responseData.message) {
            console.log(`💬 ${responseData.message}`);
          }
          if (responseData.details) {
            console.log(`📝 ${responseData.details}`);
          }
        } catch (e) {
          console.log(`💬 ${data}`);
        }
      }
    } else if (statusCode >= 200 && statusCode < 300) {
      console.log(`✅ Success ${statusCode}`);
    } else {
      console.log(`🔄 ${statusCode}`);
    }

    console.log(`─────────────────────────────────────`);
    return originalSend.call(this, data);
  };

  next();
});

app.use(morgan("short"));

// Database connection
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/timetracker",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/time-entries", timeEntryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/breaks", breakRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
