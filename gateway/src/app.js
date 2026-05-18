import express from "express";
import cors from "cors";
import router from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rotas principais do gateway
app.use("/", router);

export default app;
