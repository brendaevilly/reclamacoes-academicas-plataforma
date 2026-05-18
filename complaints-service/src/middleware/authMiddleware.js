import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token não fornecido." });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Formato de token inválido." });
    }

    try {
        // A chave secreta deve ser a mesma usada para assinar o token no users-service
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Anexa as informações do usuário decodificadas ao objeto de requisição
        // Assumindo que o token contém { id: <user_id>, role: <user_role> }
        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Token inválido ou expirado." });
    }
};

export default authMiddleware;