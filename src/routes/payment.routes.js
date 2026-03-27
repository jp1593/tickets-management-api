const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");

// Weekly Summary
router.get("/summary", paymentController.getWeeklyPaymentSummary);

// Dashboard stats
router.get("/dashboard-stats", paymentController.getDashboardStats);

module.exports = router;