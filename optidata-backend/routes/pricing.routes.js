const express = require("express");
const router = express.Router();
const { getPricing,applyPrice, applyAllPrices } = require("../modules/pricing/pricing.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const { getReport } = require("../modules/pricing/pricing.controller");

router.get("/report", authMiddleware, getReport);
router.get("/:id", authMiddleware, getPricing);
router.post("/apply/:id", authMiddleware, applyPrice);
router.post("/apply-all", authMiddleware, applyAllPrices);

module.exports = router;