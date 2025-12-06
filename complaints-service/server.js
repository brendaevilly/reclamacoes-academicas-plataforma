import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config();

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Complaints Service rodando na porta ${PORT}`);
});
