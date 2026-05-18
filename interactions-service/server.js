import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config();

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    console.log(`Interactions Service rodando na porta ${PORT}`);
});
