import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import universidadeRoutes from "./routes/universidadeRoutes.js";
import avaliacaoRoutes from "./routes/avaliacaoRoutes.js";

const app = express();
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", userRoutes);
app.use("/universidades", universidadeRoutes);
app.use("/avaliacoes", avaliacaoRoutes);

export default app;
