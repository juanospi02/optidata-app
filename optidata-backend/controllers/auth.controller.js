/**
 * controllers/auth.controller.js — Lógica de autenticación
 *
 * Maneja el registro, login y recuperación de contraseña.
 * Cada función recibe (req, res) de Express y responde con JSON.
 *
 * Dependencias:
 *  - bcryptjs: para encriptar y comparar contraseñas
 *  - jsonwebtoken: para generar tokens de sesión
 *  - crypto: para generar tokens seguros de recuperación
 *  - mailer: para enviar el correo de recuperación
 */

/**
 * controllers/auth.controller.js — Autenticación y gestión de perfil
 *
 * Cubre: registro, login, recuperación de contraseña,
 * consulta y edición de perfil, cambio de contraseña.
 */

const db      = require("../config/db");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const crypto  = require("crypto");
const { sendResetEmail } = require("../config/mailer");

// ── REGISTRO ────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Crea un nuevo usuario en la base de datos.
 * La contraseña se encripta con bcrypt antes de guardarla
 * (nunca se almacena en texto plano).
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el email ya está registrado
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json(err);

      if (results.length > 0)
        return res.status(400).json({ message: "El usuario ya existe" });

      // Encriptar la contraseña con salt de 10 rondas
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar el nuevo usuario con la contraseña encriptada
      db.query(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        (err) => {
          if (err) return res.status(500).json(err);
          res.status(201).json({ message: "Usuario registrado correctamente" });
        }
      );
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

// ── LOGIN ───────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Autentica al usuario y devuelve un JWT de sesión.
 * El token tiene vigencia de 1 día y se almacena en el frontend
 * (localStorage) para enviarse en cada petición protegida.
 */
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Buscar el usuario por email
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json(err);

    // Respuesta genérica para no revelar si el email existe o no
    if (results.length === 0)
      return res.status(400).json({ message: "Credenciales inválidas" });

    const user = results[0];

    // Comparar la contraseña ingresada con el hash almacenado
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch)
      return res.status(400).json({ message: "Credenciales inválidas" });

    // Generar el token JWT con el id y email del usuario
    // El frontend lo adjuntará en el header Authorization de cada request
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Expira en 1 día
    );

    res.json({
      message: "Login exitoso",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  });
};

// ── OBTENER PERFIL ──────────────────────────────────────────────
/**
 * GET /api/auth/profile (protegida)
 * Devuelve los datos públicos del usuario autenticado (sin password_hash).
 * req.user.id viene del JWT decodificado por authMiddleware.
 */
exports.getProfile = (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT id, name, email FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(404).json({ message: "Usuario no encontrado" });
      res.json(results[0]);
    }
  );
};

// ── ACTUALIZAR PERFIL ───────────────────────────────────────────
/**
 * PUT /api/auth/profile (protegida)
 * Actualiza nombre y/o correo del usuario autenticado.
 * Verifica que el nuevo correo no esté en uso por otro usuario.
 * Recibe: { name, email }
 */
exports.updateProfile = (req, res) => {
  const userId = req.user.id;
  const { name, email } = req.body;

  if (!name || !email)
    return res.status(400).json({ message: "Nombre y correo son obligatorios." });

  // Verificar que el email no pertenezca a otro usuario
  db.query(
    "SELECT id FROM users WHERE email = ? AND id != ?",
    [email, userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length > 0)
        return res.status(400).json({ message: "El correo ya está en uso por otro usuario." });

      // Actualizar los datos del usuario
      db.query(
        "UPDATE users SET name = ?, email = ? WHERE id = ?",
        [name.trim(), email.trim(), userId],
        (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: "Perfil actualizado correctamente.", user: { name: name.trim(), email: email.trim() } });
        }
      );
    }
  );
};

// ── CAMBIAR CONTRASEÑA ──────────────────────────────────────────
/**
 * PUT /api/auth/change-password (protegida)
 * Permite cambiar la contraseña validando primero la contraseña actual.
 * Recibe: { currentPassword, newPassword }
 */
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Completa todos los campos." });

  if (newPassword.length < 6)
    return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres." });

  // Obtener el hash actual para compararlo con la contraseña ingresada
  db.query("SELECT password_hash FROM users WHERE id = ?", [userId], async (err, results) => {
    if (err) return res.status(500).json(err);

    const isMatch = await bcrypt.compare(currentPassword, results[0].password_hash);
    if (!isMatch)
      return res.status(400).json({ message: "La contraseña actual es incorrecta." });

    // Encriptar y guardar la nueva contraseña
    const hashed = await bcrypt.hash(newPassword, 10);
    db.query("UPDATE users SET password_hash = ? WHERE id = ?", [hashed, userId], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Contraseña actualizada correctamente." });
    });
  });
};

// ── FORGOT PASSWORD ─────────────────────────────────────────────
/**
 * POST /api/auth/forgot-password
 * Inicia el flujo de recuperación de contraseña.
 *
 * Flujo:
 *  1. Verifica si el email existe en la BD
 *  2. Genera un token criptográfico único de 64 caracteres
 *  3. Guarda el token en password_resets con expiración de 1 hora
 *  4. Envía un correo con el link de reset
 *
 * Siempre responde el mismo mensaje (éxito o no encontrado)
 * para no revelar qué emails están registrados.
 */
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: "El correo es obligatorio." });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json(err);

    // Si el email no existe, responder igual para no revelar información
    if (results.length === 0) {
      return res.json({ message: "Si el correo está registrado, recibirás un enlace en breve." });
    }

    // Generar un token seguro y aleatorio de 32 bytes (64 caracteres hex)
    const token     = crypto.randomBytes(32).toString("hex");
    // El token expira en 1 hora desde ahora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Eliminar tokens anteriores del mismo email para evitar duplicados
    db.query("DELETE FROM password_resets WHERE email = ?", [email], (err) => {
      if (err) return res.status(500).json(err);

      // Guardar el nuevo token en la base de datos
      db.query(
        "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)",
        [email, token, expiresAt],
        async (err) => {
          if (err) return res.status(500).json(err);

          // Construir el link que el usuario recibirá por correo
          // Al hacer clic, el frontend leerá el token de la URL (?token=...)
          const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

          try {
            await sendResetEmail(email, resetUrl);
            res.json({ message: "Si el correo está registrado, recibirás un enlace en breve." });
          } catch (mailErr) {
            console.error("─── ERROR DE CORREO ───────────────────────────");
            console.error("Código:", mailErr.code);
            console.error("Mensaje:", mailErr.message);
            if (mailErr.code === "EAUTH") {
              console.error("→ Credenciales incorrectas. Verifica EMAIL_USER y EMAIL_PASS en .env");
              console.error("→ Asegúrate de usar una App Password de Google, no tu contraseña normal.");
            }
            console.error("───────────────────────────────────────────────");
            res.status(500).json({
              message: "Error al enviar el correo. Verifica la configuración de EMAIL en el servidor."
            });
          }
        }
      );
    });
  });
};

// ── RESET PASSWORD ──────────────────────────────────────────────
/**
 * POST /api/auth/reset-password
 * Restablece la contraseña usando el token recibido por correo.
 *
 * Flujo:
 *  1. Busca el token en la BD y verifica que no haya expirado
 *  2. Encripta la nueva contraseña con bcrypt
 *  3. Actualiza la contraseña del usuario en la tabla users
 *  4. Elimina el token usado para que no pueda reutilizarse
 */
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password)
    return res.status(400).json({ message: "Token y contraseña son obligatorios." });

  if (password.length < 6)
    return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres." });

  // Buscar el token en la BD y verificar que no haya expirado (expires_at > NOW())
  db.query(
    "SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()",
    [token],
    async (err, results) => {
      if (err) return res.status(500).json(err);

      // Si no se encuentra o está expirado, rechazar
      if (results.length === 0)
        return res.status(400).json({ message: "El enlace es inválido o ha expirado." });

      const { email } = results[0];
      // Encriptar la nueva contraseña antes de guardarla
      const hashed    = await bcrypt.hash(password, 10);

      // Actualizar la contraseña del usuario identificado por su email
      db.query(
        "UPDATE users SET password_hash = ? WHERE email = ?",
        [hashed, email],
        (err) => {
          if (err) return res.status(500).json(err);

          // Eliminar el token para que no pueda usarse dos veces
          db.query("DELETE FROM password_resets WHERE token = ?", [token]);

          res.json({ message: "Contraseña actualizada correctamente." });
        }
      );
    }
  );
};
