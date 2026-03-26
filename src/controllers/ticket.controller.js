const { Ticket, Supplier, Land, TicketItem, Product, Sequelize } = require("../../models");

exports.getTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Ticket.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT SUM(subtotal)
              FROM "TicketItems" AS items
              WHERE items."ticketId" = "Ticket".id
            )`),
            "total",
          ],
        ],
      },
      include: [
        { model: Supplier, as: "supplier", attributes: ["name", "code"] },
        { model: Land, as: "land", attributes: ["name"] },
      ],
      order: [["date", "DESC"]],
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    console.error("Error en getTickets:", error);
    res
      .status(500)
      .json({ message: "Error al obtener tickets", error: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: "supplier" },
        { model: Land, as: "land", attributes: ["name"] },
        {
          model: TicketItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });

    if (!ticket)
      return res.status(404).json({ message: "Ticket no encontrado" });

    const ticketData = ticket.toJSON();

    if (ticketData.items && ticketData.items.length > 0) {
      const realTotal = ticketData.items.reduce((acc, item) => {
        return acc + (parseFloat(item.subtotal) || 0);
      }, 0);

      ticketData.total = realTotal;
    }

    res.json(ticketData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener el detalle", error: error.message });
  }
};
