import express from "express";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/report", reportRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to CodeDesign Backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Dev URL: http://localhost:${PORT}`);
});

export default app;
