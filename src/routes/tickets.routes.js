const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticket.controller");

router.get("/", ticketController.getTickets);
router.get("/:id", ticketController.getTicketById);
router.post("/", ticketController.createTicket);
router.delete("/:id", ticketController.deleteTicket);

module.exports = router;
