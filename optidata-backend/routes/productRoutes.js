const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const productController = require("../controllers/product.Controller");

// Crear producto
router.post("/",  productController.createProduct);

// Obtener productos del usuario
router.get("/",  productController.getProducts);

// Actualizar producto
router.put("/:id", authMiddleware, productController.updateProduct);

// Eliminar producto
router.delete("/:id", authMiddleware, productController.deleteProduct);

router.post("/sales", productController.createSale);
module.exports = router;