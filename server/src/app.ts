import express from "express";
import passport from "./config/passport";
import authRoutes from "./routes/auth.routes";

const app = express();


app.use((req, res, next) => {
  // Normalize CLIENT_URL by removing trailing slash to avoid CORS issues
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const origin = req.headers.origin;
  
  // Use the request origin if it matches our allowed client URL (handles trailing slash variations)
  if (origin && (origin === clientUrl || origin === `${clientUrl}/`)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", clientUrl);
  }
  
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/api/auth", authRoutes);

export default app;
