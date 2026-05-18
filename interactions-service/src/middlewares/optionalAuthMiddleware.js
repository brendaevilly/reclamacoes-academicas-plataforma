import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        // Sem token, continuar sem req.user
        return next();
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        // Token inválido, continuar sem req.user
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        // Token inválido ou expirado, continuar sem req.user
        next();
    }
};

export default optionalAuthMiddleware;

