import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;

app.use(cors());            // allow all origins (dev-friendly)
app.use(express.json());    // parse JSON body

app.post("/agent", (req: Request, res: Response) => {
  const { goal } = req.body || {};
  if (!goal) return res.status(400).json({ error: "Missing 'goal'" });
  res.json({ result: `Sample content for: "${goal}"` });
});

app.get("/", (_req: Request, res: Response) => {
  res.send("API is running. POST /agent");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server on http://0.0.0.0:${PORT}`);
});
