const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticket.controller");
const paymentController = require("../controllers/payment.controller");

// Tickets
router.get("/tickets", ticketController.getTickets);
router.get("/tickets/:id", ticketController.getTicketById);

// Bonus-Payments
router.get("/payments/summary", paymentController.getWeeklyPaymentSummary);

// Dashboard
router.get("/payments/dashboard-stats", paymentController.getDashboardStats);

module.exports = router;
