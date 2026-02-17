import express from "express";
import cors from "cors";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./../database/index.js";
import { config } from "./../config/index.js";
import routes from "./routes.js";

// --- Fix for __dirname in ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// 2. Serve Static Files (Crucial for Local Image Uploads)
// This makes the "public" folder accessible from the browser
// Example: http://localhost:4000/public/uploads/my-image.png
app.use("/public", express.static(path.join(__dirname, "../../public")));

// 3. Root health check
app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

// 4. API Routes
app.use("/api", routes);

async function start() {
  try {
    await connectDB();
    const port = config?.app?.port ?? 3000;
    app.listen(port, () => {
      console.log(`Service on port ${port}`);
    });

    // -------------------------------
    // KEEP RENDER INSTANCE ALIVE
    // -------------------------------
    // Note: I added the 'd' to 'backend'. Check if your Render URL is actually 'backen' or 'backend'.
    const KEEP_ALIVE_URL = "https://cellclinichyderabadbackend.onrender.com/";

    setInterval(async () => {
      try {
        await axios.get(KEEP_ALIVE_URL);
        console.log("Render keep-alive ping successful");
      } catch (err) {
        console.log("Keep-alive ping failed:", err.message);
      }
    }, 2 * 60 * 1000); // 2 minutes
    // -------------------------------
  } catch (err) {
    console.log(`failed to start:`, err);
    process.exit(1);
  }
}

start();
export default app;
