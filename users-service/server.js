import app from "./src/app.js";
<<<<<<< HEAD
=======
import dotenv from "dotenv";

dotenv.config();
>>>>>>> origin/brenda

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
<<<<<<< HEAD
    console.log(`Users Service rodando na porta ${PORT}`);
=======
  console.log(`Users Service rodando na porta ${PORT}`);
>>>>>>> origin/brenda
});
