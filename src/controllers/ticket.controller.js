const {
  Ticket,
  Supplier,
  Land,
  TicketItem,
  Product,
  Sequelize,
  sequelize,
} = require("../../models");

// Get tickets - Pagination
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

// Search ticket by ID
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

// Create ticket
exports.createTicket = async (req, res) => {
  const { code, date, supplierCode, landCode, items } = req.body;

  const t = await sequelize.transaction();

  try {
    // Supplier search
    const supplier = await Supplier.findOne({
      where: { code: supplierCode },
      transaction: t,
    });

    if (!supplier) {
      throw new Error("Supplier no encontrado");
    }

    // Land search
    const land = await Land.findOne({
      where: { code: landCode },
      transaction: t,
    });

    if (!land) {
      throw new Error("Land no encontrado");
    }

    // Ticket creation
    const ticket = await Ticket.create(
      {
        code,
        date,
        supplierId: supplier.id,
        landId: land.id,
        total: 0,
      },
      { transaction: t },
    );

    let total = 0;

    for (const item of items) {
      const product = await Product.findOne({
        where: { code: item.productCode },
        transaction: t,
      });

      if (!product) {
        throw new Error(`Producto ${item.productCode} no encontrado`);
      }

      const subtotal = item.quantity * item.price;

      await TicketItem.create(
        {
          ticketId: ticket.id,
          productId: product.id,
          quantity: item.quantity,
          price: item.price,
          subtotal,
        },
        { transaction: t },
      );

      total += subtotal;
    }

    // Total update
    ticket.total = total;
    await ticket.save({ transaction: t });

    await t.commit();

    res.status(201).json(ticket);
  } catch (error) {
    console.error("🔥 ERROR CREATE TICKET:", error);
    await t.rollback();

    res.status(500).json({
      message: "Error creando ticket",
      error: error.message,
    });
  }
};

// Delete ticket
exports.deleteTicket = async (req, res) => {
  const { id } = req.params;

  const t = await sequelize.transaction();

  try {
    const ticket = await Ticket.findByPk(id, { transaction: t });

    if (!ticket) {
      await t.rollback();
      return res.status(404).json({
        message: "Ticket no encontrado",
      });
    }

    // Ticket Elimination (TicketItems deleted by Cascade)
    await ticket.destroy({ transaction: t });

    await t.commit();

    console.log("🟢 Ticket eliminado:", id);

    res.json({
      message: "Ticket eliminado correctamente",
    });
  } catch (error) {
    await t.rollback();

    console.error("🔥 ERROR DELETE TICKET:", error);

    res.status(500).json({
      message: "Error eliminando ticket",
      error: error.message,
    });
  }
};
