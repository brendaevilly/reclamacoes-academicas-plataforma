import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Gateway rodando na porta ${PORT}`);
    console.log(`Serviços configurados:`);
    console.log(`  - Users: ${process.env.USERS_SERVICE_URL}`);
    console.log(`  - Complaints: ${process.env.COMPLAINTS_SERVICE_URL}`);
    console.log(`  - Interactions: ${process.env.INTERACTIONS_SERVICE_URL}`);
});
