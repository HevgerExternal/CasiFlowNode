require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/balance", require("./routes/balanceRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
