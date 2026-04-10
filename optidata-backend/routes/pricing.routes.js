const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getPricing, applyPrice, applyAllPrices, getReport } = require("../modules/pricing/pricing.controller");

router.get("/report",       authMiddleware, getReport);
router.get("/:id",          authMiddleware, getPricing);
router.post("/apply/:id",   authMiddleware, applyPrice);
router.post("/apply-all",   authMiddleware, applyAllPrices);

module.exports = router;
