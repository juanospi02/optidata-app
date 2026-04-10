/**
 * modules/pricing/pricing.service.js — Capa de acceso a datos del motor de pricing
 *
 * Contiene todas las funciones que interactúan con la BD para el sistema de pricing:
 *  - getPricingByProduct: calcula el precio recomendado para un producto
 *  - applyPricing: calcula Y actualiza el precio en la BD
 *  - getPricingReport: genera el reporte del dashboard (top ventas, baja demanda, alertas)
 *  - applyPricingToAll: aplica pricing a todos los productos de un usuario
 *
 * Todas las funciones reciben userId para garantizar aislamiento de datos por usuario.
 */

const db = require("../../config/db");
const { calculateRecommendedPrice } = require("./pricing.algorithm");

// ── OBTENER PRICING RECOMENDADO PARA UN PRODUCTO ────────────────
/**
 * Consulta ventas históricas del producto, calcula el precio recomendado
 * y guarda el resultado en price_history (sin actualizar el precio actual).
 *
 * @param {number} productId - ID del producto
 */
async function getPricingByProduct(productId) {
  return new Promise((resolve, reject) => {

    // Consulta que combina datos del producto con su historial de ventas
    // recentSales: ventas de los últimos 30 días (determina la demanda actual)
    const query = `
      SELECT
        p.id,
        p.name,
        p.cost,
        p.current_price,
        COUNT(s.id) as totalSales,
        SUM(CASE
          WHEN s.date >= NOW() - INTERVAL 30 DAY
          THEN s.quantity ELSE 0 END
        ) as recentSales
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `;

    db.query(query, [productId], (err, results) => {
      if (err) return reject(err);

      if (results.length === 0)
        return reject(new Error("Producto no encontrado"));

      const product = results[0];

      // Calcular el precio recomendado usando el algoritmo de demanda
      const pricing = calculateRecommendedPrice({
        cost:        product.cost,
        totalSales:  product.totalSales  || 0,
        recentSales: product.recentSales || 0
      });

      // Registrar en el historial de precios (solo consulta, no actualiza)
      const insertHistoryQuery = `
        INSERT INTO price_history
        (product_id, old_price, recommended_price, demand_factor)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        insertHistoryQuery,
        [product.id, product.current_price, pricing.recommendedPrice, pricing.demandFactor || 1],
        (err) => {
          if (err) console.error("Error guardando historial:", err);
        }
      );

      resolve({ ...product, ...pricing });
    });
  });
}

// ── APLICAR PRICING (CALCULAR Y ACTUALIZAR PRECIO) ──────────────
/**
 * Calcula el precio recomendado según la demanda y actualiza current_price en la BD.
 * Se llama automáticamente cada vez que se registra una venta.
 *
 * @param {number} productId - ID del producto a actualizar
 */
async function applyPricing(productId) {
  return new Promise((resolve, reject) => {

    // Igual que getPricingByProduct pero también actualiza el precio en BD
    const query = `
      SELECT
        p.id,
        p.name,
        p.cost,
        p.current_price,
        COUNT(s.id) as totalSales,
        SUM(CASE
          WHEN s.date >= NOW() - INTERVAL 30 DAY
          THEN s.quantity ELSE 0 END
        ) as recentSales
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `;

    db.query(query, [productId], (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return reject(new Error("Producto no encontrado"));

      const product = results[0];

      // Calcular nuevo precio basado en demanda actual
      const pricing = calculateRecommendedPrice({
        cost:        product.cost,
        totalSales:  product.totalSales  || 0,
        recentSales: product.recentSales || 0
      });

      // Actualizar el precio del producto en la BD
      db.query(
        "UPDATE products SET current_price = ? WHERE id = ?",
        [pricing.recommendedPrice, product.id],
        (err) => {
          if (err) return reject(err);

          // Guardar el cambio en el historial de precios
          db.query(
            `INSERT INTO price_history
             (product_id, old_price, recommended_price, demand_factor)
             VALUES (?, ?, ?, ?)`,
            [product.id, product.current_price, pricing.recommendedPrice, pricing.demandFactor],
            (err) => {
              if (err) console.error("Error guardando historial:", err);
            }
          );

          resolve({
            message:  "Precio actualizado correctamente",
            oldPrice: product.current_price,
            newPrice: pricing.recommendedPrice
          });
        }
      );
    });
  });
}

// ── REPORTE DEL DASHBOARD ───────────────────────────────────────
/**
 * Genera el reporte completo para el dashboard:
 *  - Top 3 productos más vendidos
 *  - 3 productos con menos ventas (o sin ventas)
 *  - Alertas: productos cuyo precio actual está por debajo del costo
 *
 * BUGS CORREGIDOS:
 *  1. Se filtra por userId → cada usuario solo ve sus propios productos
 *  2. Se usa [...results] para no mutar el array original en cada sort
 *  3. Se usa (totalQuantity || 0) para manejar NULL como 0
 *
 * @param {number} userId - ID del usuario autenticado (del JWT)
 */
async function getPricingReport(userId) {
  return new Promise((resolve, reject) => {

    // Consulta que une productos con sus ventas, filtrando por usuario
    // LEFT JOIN garantiza que productos sin ventas también aparezcan (con 0)
    const reportQuery = `
      SELECT
        p.id,
        p.name,
        p.cost,
        p.current_price,
        COUNT(s.id)      AS totalSales,
        COALESCE(SUM(s.quantity), 0) AS totalQuantity
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      WHERE p.user_id = ?
      GROUP BY p.id
    `;

    db.query(reportQuery, [userId], (err, results) => {
      if (err) return reject(err);

      // Top 3 más vendidos — se copia el array antes de ordenar
      // para no afectar los cálculos siguientes
      const topSelling = [...results]
        .sort((a, b) => (b.totalQuantity || 0) - (a.totalQuantity || 0))
        .slice(0, 3);

      // 3 productos con menor demanda — copia independiente
      // Solo incluye productos existentes (gracias al WHERE p.user_id = ?)
      const lowSelling = [...results]
        .sort((a, b) => (a.totalQuantity || 0) - (b.totalQuantity || 0))
        .slice(0, 3);

      // Alertas: productos que se venden por debajo del costo (pérdida)
      const pricingAlerts = results.filter(p => p.current_price < p.cost);

      resolve({
        totalProducts: results.length,
        topSelling,
        lowSelling,
        pricingAlerts
      });
    });
  });
}

// ── APLICAR PRICING A TODOS LOS PRODUCTOS DEL USUARIO ──────────
/**
 * Recorre todos los productos del usuario y aplica el algoritmo de pricing.
 * Se activa desde el botón "Aplicar Pricing a Todos" del dashboard.
 *
 * @param {number} userId - ID del usuario autenticado
 */
async function applyPricingToAll(userId) {
  return new Promise((resolve, reject) => {

    // Solo selecciona productos del usuario autenticado
    db.query("SELECT id FROM products WHERE user_id = ?", [userId], async (err, results) => {
      if (err) return reject(err);

      const updates = [];

      // Aplica pricing a cada producto de forma secuencial
      for (const product of results) {
        try {
          const result = await applyPricing(product.id);
          updates.push(result);
        } catch (error) {
          console.error("Error aplicando pricing al producto", product.id, error.message);
        }
      }

      resolve({
        message: "Pricing aplicado a todos los productos",
        updates
      });
    });
  });
}

module.exports = {
  getPricingByProduct,
  applyPricing,
  getPricingReport,
  applyPricingToAll
};
