import mongoose from "mongoose";
import app from "./app";
import { env } from "./lib/env";



mongoose
  .connect(env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
