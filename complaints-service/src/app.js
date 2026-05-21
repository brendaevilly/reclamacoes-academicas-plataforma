import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import complaintRoutes from "./routes/complaintRoutes.js";

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());

app.use("/complaints", complaintRoutes);

export default app;
