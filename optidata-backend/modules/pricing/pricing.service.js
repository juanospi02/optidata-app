const db = require("../../config/db");
const { calculateRecommendedPrice } = require("./pricing.algorithm");

async function getPricingByProduct(productId) {
  return new Promise((resolve, reject) => {
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

      if (results.length === 0) {
        return reject(new Error("Producto no encontrado"));
      }

      const product = results[0];

      const pricing = calculateRecommendedPrice({
        cost: product.cost,
        totalSales: product.totalSales || 0,
        recentSales: product.recentSales || 0
      });

      console.log("PRICING DEBUG:", {
  totalSales: product.totalSales,
  recentSales: product.recentSales,
  demandFactor: pricing.demandFactor,
  recommendedPrice: pricing.recommendedPrice
});

      // Guardar historial de precios
const insertHistoryQuery = `
  INSERT INTO price_history 
  (product_id, old_price, recommended_price, demand_factor)
  VALUES (?, ?, ?, ?)
`;

db.query(
  insertHistoryQuery,
  [
    product.id,
    product.current_price || product.price, // OJO con este nombre
    pricing.recommendedPrice,
    pricing.demandFactor || 1
  ],
  (err) => {
    if (err) {
      console.error("Error guardando historial:", err);
    }
  }
);

      resolve({
        ...product,
        ...pricing
      });
    });
  });
}
// ----------------------------------------------------------
async function applyPricing(productId) {
  return new Promise((resolve, reject) => {
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

// 🔥 CALCULAR PRECIO
const pricing = calculateRecommendedPrice({
  cost: product.cost,
  totalSales: product.totalSales || 0,
  recentSales: product.recentSales || 0
});

// 🔥 TRAER ÚLTIMO HISTORIAL
const lastHistoryQuery = `
  SELECT * FROM price_history 
  WHERE product_id = ? 
  ORDER BY created_at DESC 
  LIMIT 1
`;

db.query(lastHistoryQuery, [productId], (err, historyResults) => {
  if (err) return reject(err);

  const lastRecord = historyResults[0];

  // // 🚫 SI NO CAMBIÓ DEMANDA → NO HACER NADA
  // if (lastRecord && lastRecord.demand_factor == pricing.demandFactor) {
  //   return resolve({
  //     message: "Sin cambios en demanda, no se actualiza precio",
  //     currentPrice: product.current_price
  //   });
  // }

  // 🔥 ACTUALIZAR PRECIO
  const updateQuery = `UPDATE products SET current_price = ? WHERE id = ?`;

  db.query(updateQuery, [pricing.recommendedPrice, product.id], (err) => {
    if (err) return reject(err);

    // 🔥 GUARDAR HISTORIAL
    const insertHistoryQuery = `
      INSERT INTO price_history 
      (product_id, old_price, recommended_price, demand_factor)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      insertHistoryQuery,
      [
        product.id,
        product.current_price,
        pricing.recommendedPrice,
        pricing.demandFactor
      ],
      (err) => {
        if (err) console.error("Error guardando historial:", err);
      }
    );

    resolve({
      message: "Precio actualizado correctamente",
      oldPrice: product.current_price,
      newPrice: pricing.recommendedPrice
    });
  });
})})})};
// ----------------------------------------------------------
async function getPricingReport() {
  return new Promise((resolve, reject) => {

    const reportQuery = `
      SELECT 
        p.id,
        p.name,
        p.cost,
        p.current_price,
        COUNT(s.id) as totalSales,
        SUM(s.quantity) as totalQuantity
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      GROUP BY p.id
    `;

    db.query(reportQuery, (err, results) => {
      if (err) return reject(err);

      // 🔥 Top ventas
      const topSelling = results
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 3);

      // 🔻 Baja demanda
      const lowSelling = results
        .sort((a, b) => a.totalQuantity - b.totalQuantity)
        .slice(0, 3);

      // 🚨 Alertas de precio (muy simple por ahora)
      const pricingAlerts = results.filter(p => {
        return p.current_price < p.cost; // vendiendo con pérdida
      });

      resolve({
        totalProducts: results.length,
        topSelling,
        lowSelling,
        pricingAlerts
      });
    });
  });
}
async function applyPricingToAll() {
  return new Promise((resolve, reject) => {
    const query = `SELECT id FROM products`;

    db.query(query, async (err, results) => {
      if (err) return reject(err);

      const updates = [];

      for (const product of results) {
        try {
          const result = await applyPricing(product.id);
          updates.push(result);
        } catch (error) {
          console.error("Error en producto", product.id);
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