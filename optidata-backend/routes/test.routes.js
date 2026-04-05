const express = require("express");
const router = express.Router();
const { testConnection } = require("../controllers/test.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/test", authMiddleware, testConnection);

module.exports = router;