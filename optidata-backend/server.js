/**
 * server.js — Punto de entrada principal del backend
 *
 * Aquí se configura y arranca el servidor Express.
 * Se registran los middlewares globales (CORS, JSON),
 * se inicializa la tabla de recuperación de contraseñas
 * y se montan todas las rutas de la API.
 */

const express = require("express");
const cors    = require("cors");
const os      = require("os");
require("dotenv").config(); // Carga las variables del archivo .env

const app = express();

// ── Middlewares globales ────────────────────────────────────────
// CORS: permite que el frontend (localhost:4200) se comunique con el backend
app.use(cors());
// express.json(): permite recibir cuerpos JSON en las peticiones POST/PUT
app.use(express.json());

// ── Inicialización de tablas ────────────────────────────────────
// Se crea la tabla password_resets si no existe.
// Almacena los tokens temporales para recuperación de contraseña.
const db = require("./config/db");
db.query(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    token      VARCHAR(255) NOT NULL UNIQUE,  -- Token único generado con crypto
    expires_at DATETIME    NOT NULL,           -- Expiración de 1 hora
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) console.error("Error creando tabla password_resets:", err);
});

// ── Endpoint: IP local de la máquina ───────────────────────────
// Devuelve la primera IPv4 privada encontrada en las interfaces de red.
// El frontend lo usa para generar el QR con la IP real en lugar de localhost,
// de modo que otros dispositivos en la misma red puedan escanearlo y acceder.
app.get("/api/local-ip", (req, res) => {
  const interfaces = os.networkInterfaces();
  let localIp = null;

  // Recorre todas las interfaces y busca la primera IPv4 privada
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorar loopback (127.x) e interfaces IPv6
      if (iface.family === "IPv4" && !iface.internal) {
        localIp = iface.address;
        break;
      }
    }
    if (localIp) break;
  }

  res.json({ ip: localIp ?? "localhost" });
});

// ── Rutas de la API ─────────────────────────────────────────────
const testRoutes    = require("./routes/test.routes");
const authRoutes    = require("./routes/auth.routes");
const productRoutes = require("./routes/productRoutes");
const pricingRoutes = require("./routes/pricing.routes");

app.use("/api",          testRoutes);    // Ruta de prueba de conexión
app.use("/api/auth",     authRoutes);    // Login, registro, recuperación de contraseña
app.use("/api/products", productRoutes); // CRUD de productos y registro de ventas
app.use("/api/pricing",  pricingRoutes); // Motor de pricing inteligente

// ── Arranque del servidor ───────────────────────────────────────
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});
