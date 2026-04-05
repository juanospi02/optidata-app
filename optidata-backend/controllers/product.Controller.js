const db = require("../config/db");

// CREAR PRODUCTO
exports.createProduct = (req, res) => {
  const { name, cost, current_price } = req.body;
  const userId = req.user.id;

  const query = `
    INSERT INTO products (user_id, name, cost, current_price)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [userId, name, cost, current_price], (err, result) => {
    if (err) return res.status(500).json(err);

    res.status(201).json({
      message: "Producto creado correctamente",
      productId: result.insertId
    });
  });
};

// OBTENER PRODUCTOS DEL USUARIO
exports.getProducts = (req, res) => {
  const userId = req.user.id;

  db.query("SELECT * FROM products WHERE user_id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json(err);

    res.json(results);
  });
};

// OBTENER UN PRODUCTO
exports.getProductById = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(results[0]);
  });
};

// ACTUALIZAR PRODUCTO
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, cost, current_price } = req.body;

  const query = `
    UPDATE products
    SET name = ?, cost = ?, current_price = ?
    WHERE id = ?
  `;

  db.query(query, [name, cost, current_price, id], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "Producto actualizado" });
  });
};

// ELIMINAR PRODUCTO
exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "Producto eliminado" });
  });
};