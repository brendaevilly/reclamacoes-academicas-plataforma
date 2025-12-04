import express from "express";
import cors from "cors";
import complaintRoutes from "./routes/complaintRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/complaints", complaintRoutes);

export default app;
