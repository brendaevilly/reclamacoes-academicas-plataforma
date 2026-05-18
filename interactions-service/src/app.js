import express from "express";
import cors from "cors";
import interactionRoutes from "./routes/interactionRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/interactions", interactionRoutes);

export default app;
