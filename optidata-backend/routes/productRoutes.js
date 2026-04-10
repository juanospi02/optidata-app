const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const productController = require("../controllers/product.Controller");

router.get("/",           authMiddleware, productController.getProducts);
router.post("/",          authMiddleware, productController.createProduct);
router.put("/:id",        authMiddleware, productController.updateProduct);
router.delete("/:id",     authMiddleware, productController.deleteProduct);
router.post("/sales",     authMiddleware, productController.createSale);

module.exports = router;
