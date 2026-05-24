import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

/**
 * Auth opcional: se houver um JWT válido no header Authorization,
 * popula req.user. Caso contrário, segue em frente sem bloquear.
 *
 * Necessário para rotas como GET /complaints/feed e GET /complaints/:id,
 * que devem responder mesmo para visitantes anônimos, mas precisam
 * personalizar `user_liked` quando o usuário está logado.
 */
const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return next();

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        // Token inválido/expirado: tratamos como anônimo, sem falhar.
    }
    next();
};

export default optionalAuthMiddleware;
