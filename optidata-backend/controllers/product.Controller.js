/**
 * controllers/product.Controller.js — CRUD de productos y registro de ventas
 *
 * MULTI-TENANT: Todos los queries filtran por req.user.id (extraído del JWT),
 * garantizando que cada usuario solo acceda a sus propios datos.
 *
 * Flujo de autenticación:
 *  authMiddleware → decodifica el token → agrega req.user → este controller lo usa
 */

const db = require("../config/db");
const { applyPricing } = require("../modules/pricing/pricing.service");

// ── CREAR PRODUCTO ──────────────────────────────────────────────
/**
 * POST /api/products
 * Inserta un nuevo producto asociado al usuario autenticado.
 * Recibe: { name, cost, current_price }
 */
exports.createProduct = (req, res) => {
  const { name, cost, current_price } = req.body;
  const userId = req.user.id; // ID real del usuario autenticado (del JWT)

  db.query(
    "INSERT INTO products (user_id, name, cost, current_price) VALUES (?, ?, ?, ?)",
    [userId, name, cost, current_price],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.status(201).json({
        message: "Producto creado correctamente",
        productId: result.insertId
      });
    }
  );
};

// ── OBTENER TODOS LOS PRODUCTOS DEL USUARIO ─────────────────────
/**
 * GET /api/products
 * Devuelve solo los productos del usuario autenticado.
 * El filtro WHERE user_id = ? garantiza aislamiento entre usuarios.
 */
exports.getProducts = (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT * FROM products WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};

// ── OBTENER UN PRODUCTO POR ID ──────────────────────────────────
/**
 * GET /api/products/:id
 * Devuelve un producto solo si pertenece al usuario autenticado.
 * El doble filtro (id Y user_id) evita que un usuario acceda a productos ajenos.
 */
exports.getProductById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.query(
    "SELECT * FROM products WHERE id = ? AND user_id = ?",
    [id, userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(404).json({ message: "Producto no encontrado" });
      res.json(results[0]);
    }
  );
};

// ── ACTUALIZAR PRODUCTO ─────────────────────────────────────────
/**
 * PUT /api/products/:id
 * Actualiza nombre, costo y precio del producto del usuario autenticado.
 * El WHERE user_id = ? impide modificar productos de otros usuarios.
 */
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, cost, current_price } = req.body;
  const userId = req.user.id;

  db.query(
    "UPDATE products SET name = ?, cost = ?, current_price = ? WHERE id = ? AND user_id = ?",
    [name, cost, current_price, id, userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Producto no encontrado" });
      res.json({ message: "Producto actualizado" });
    }
  );
};

// ── ELIMINAR PRODUCTO ───────────────────────────────────────────
/**
 * DELETE /api/products/:id
 * Elimina el producto solo si pertenece al usuario autenticado.
 * affectedRows === 0 detecta si el producto no existía o era de otro usuario.
 */
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.query(
    "DELETE FROM products WHERE id = ? AND user_id = ?",
    [id, userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Producto no encontrado" });
      res.json({ message: "Producto eliminado" });
    }
  );
};

// ── CREAR VENTA ─────────────────────────────────────────────────
/**
 * POST /api/products/sales
 * Registra una venta y dispara el motor de pricing automático.
 *
 * Flujo:
 *  1. Verifica que el producto existe Y pertenece al usuario
 *  2. Guarda la venta con el precio vigente en ese momento
 *  3. Llama a applyPricing() → recalcula y actualiza current_price
 *
 * El filtro user_id en el paso 1 evita registrar ventas en productos ajenos.
 */
exports.createSale = (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.user.id;

  // Paso 1: verificar que el producto existe y pertenece al usuario
  db.query(
    "SELECT current_price FROM products WHERE id = ? AND user_id = ?",
    [product_id, userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(404).json({ message: "Producto no encontrado" });

      const price_at_sale = results[0].current_price;

      // Paso 2: registrar la venta con el precio vigente en ese momento
      db.query(
        "INSERT INTO sales (product_id, date, quantity, price_at_sale) VALUES (?, CURDATE(), ?, ?)",
        [product_id, quantity, price_at_sale],
        async (err2) => {
          if (err2) return res.status(500).json(err2);

          try {
            // Paso 3: recalcular el precio según demanda actual
            const pricingResult = await applyPricing(product_id);
            res.json({ message: "Venta creada", pricing: pricingResult });
          } catch (error) {
            console.error("Error en pricing:", error);
            res.status(500).json({ message: "Venta registrada, error al actualizar precio" });
          }
        }
      );
    }
  );
};
