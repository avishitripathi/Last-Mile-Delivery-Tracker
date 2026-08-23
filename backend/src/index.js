require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const zoneRoutes = require("./routes/zones");
const rateCardRoutes = require("./routes/ratecards");
const agentRoutes = require("./routes/agents");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/ratecards", rateCardRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Last-Mile API listening on :${PORT}`));