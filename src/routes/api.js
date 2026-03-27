const express = require("express");
const router = express.Router();

// Módulos
router.use("/tickets", require("./tickets.routes"));
router.use("/suppliers", require("./supplier.routes"));
router.use("/lands", require("./land.routes"));
router.use("/products", require("./product.routes"));
router.use("/payments", require("./payment.routes"));

module.exports = router;