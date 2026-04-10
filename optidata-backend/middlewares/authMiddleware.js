/**
 * middlewares/authMiddleware.js — Verificación de autenticación JWT
 *
 * Este middleware protege las rutas privadas de la API.
 * Se ejecuta ANTES del controller en cada ruta donde se aplique.
 *
 * Flujo:
 *  1. Lee el header "Authorization: Bearer <token>"
 *  2. Verifica que el token sea válido y no haya expirado
 *  3. Si es válido → adjunta los datos del usuario a req.user y continúa
 *  4. Si no → responde 401 Unauthorized y detiene la petición
 */

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // Leer el header de autorización enviado por el frontend
    const authHeader = req.headers.authorization;

    // Si no viene el header, rechazar la petición
    if (!authHeader) {
      return res.status(401).json({ message: "No autorizado" });
    }

    // El formato es "Bearer <token>", extraemos solo el token
    const token = authHeader.split(" ")[1];

    // Verificar el token contra el JWT_SECRET del .env
    // Si el token está vencido o es inválido, lanza una excepción
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adjuntar los datos decodificados del usuario (id, email) a la petición
    // para que el controller pueda usarlos sin necesidad de consultar la BD
    req.user = decoded;

    // Continuar al siguiente middleware o controller
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};
