import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
<<<<<<< HEAD
=======
import universidadeRoutes from "./routes/universidadeRoutes.js";
import avaliacaoRoutes from "./routes/avaliacaoRoutes.js";
>>>>>>> origin/brenda

const app = express();

app.use(cors());
app.use(express.json());
<<<<<<< HEAD

app.use("/users", userRoutes);
=======
app.use(express.urlencoded({ extended: true }));

app.use("/auth", userRoutes);
app.use("/universidades", universidadeRoutes);
app.use("/avaliacoes", avaliacaoRoutes);
>>>>>>> origin/brenda

export default app;
