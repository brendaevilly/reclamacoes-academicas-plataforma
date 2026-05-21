import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const tokenCookie = req.cookies?.token;
  const tokenHeader = req.headers.authorization?.split(" ")[1];
  const token = tokenCookie || tokenHeader;

  if (!token) return res.status(401).json({ error: "Token necessário" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}
