/**
 * modules/pricing/pricing.controller.js — Controller del motor de pricing
 *
 * Recibe las peticiones HTTP del frontend, extrae los parámetros
 * necesarios (incluido req.user.id del JWT) y delega la lógica
 * al pricing.service.
 *
 * Todas las rutas de este controller están protegidas con authMiddleware,
 * por lo que req.user siempre tiene el id del usuario autenticado.
 */

const pricingService = require("./pricing.service");

// ── VER RECOMENDACIÓN DE PRECIO ─────────────────────────────────
/**
 * GET /api/pricing/:id
 * Devuelve el precio recomendado para un producto específico
 * sin actualizar el precio actual en la BD.
 */
async function getPricing(req, res) {
  try {
    const { id } = req.params;
    const data = await pricingService.getPricingByProduct(id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ── APLICAR PRECIO RECOMENDADO A UN PRODUCTO ────────────────────
/**
 * POST /api/pricing/apply/:id
 * Calcula el precio recomendado y lo aplica (actualiza current_price en BD).
 */
async function applyPrice(req, res) {
  try {
    const { id } = req.params;
    const result = await pricingService.applyPricing(id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ── REPORTE DEL DASHBOARD ───────────────────────────────────────
/**
 * GET /api/pricing/report
 * Devuelve el reporte completo para el dashboard:
 * top vendidos, baja demanda y alertas de precio.
 *
 * Se pasa req.user.id para que el reporte solo incluya
 * los productos del usuario autenticado.
 */
async function getReport(req, res) {
  try {
    // req.user.id viene del JWT decodificado por authMiddleware
    const userId = req.user.id;
    const report = await pricingService.getPricingReport(userId);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ── APLICAR PRICING A TODOS LOS PRODUCTOS ──────────────────────
/**
 * POST /api/pricing/apply-all
 * Recalcula y actualiza el precio de todos los productos del usuario.
 * Se activa con el botón "Aplicar Pricing a Todos" del dashboard.
 */
async function applyAllPrices(req, res) {
  try {
    // Se filtra por usuario para no afectar productos de otros usuarios
    const userId = req.user.id;
    const result = await pricingService.applyPricingToAll(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getPricing, applyPrice, getReport, applyAllPrices };
