/**
 * routes/auth.routes.js — Rutas de autenticación y perfil
 *
 * Rutas públicas: register, login, forgot-password, reset-password
 * Rutas protegidas: profile (requieren authMiddleware → token JWT válido)
 */

const express        = require("express");
const router         = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  register, login,
  forgotPassword, resetPassword,
  getProfile, updateProfile, changePassword
} = require("../controllers/auth.controller");

// ── Públicas ────────────────────────────────────────────────────
router.post("/register",        register);
router.post("/login",           login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password",  resetPassword);

// ── Protegidas (requieren JWT) ──────────────────────────────────
router.get ("/profile",         authMiddleware, getProfile);
router.put ("/profile",         authMiddleware, updateProfile);
router.put ("/change-password", authMiddleware, changePassword);

module.exports = router;
