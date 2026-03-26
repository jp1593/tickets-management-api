const {
  Ticket,
  Supplier,
  TicketItem,
  sequelize,
  Land,
} = require("../../models");
const { Op } = require("sequelize");

exports.getWeeklyPaymentSummary = async (req, res) => {
  const { year, week } = req.query;

  if (!year || !week) {
    return res.status(400).json({ message: "Año y semana ISO son requeridos" });
  }

  try {
    // Search for tickets that are part of that week
    const weeklyTickets = await Ticket.findAll({
      attributes: ["id", "supplierId"],
      where: sequelize.and(
        sequelize.where(
          sequelize.fn("EXTRACT", sequelize.literal('ISOYEAR FROM "date"')),
          year,
        ),
        sequelize.where(
          sequelize.fn("EXTRACT", sequelize.literal('WEEK FROM "date"')),
          week,
        ),
      ),
      raw: true,
    });

    if (weeklyTickets.length === 0) {
      return res.json({ year, week, payments: [] });
    }

    const ticketIds = weeklyTickets.map((t) => t.id);

    // Agrupation of items per supplier
    const summary = await TicketItem.findAll({
      attributes: [
        [sequelize.col("ticket.supplierId"), "supplierId"],
        [sequelize.fn("SUM", sequelize.col("subtotal")), "totalAmount"],
        [sequelize.fn("COUNT", sequelize.col("TicketItem.id")), "productCount"], 
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("ticketId")),
          ),
          "ticketCount",
        ],
      ],
      where: {
        ticketId: { [Op.in]: ticketIds },
      },
      include: [
        {
          model: Ticket,
          as: "ticket",
          attributes: [],
          include: [
            {
              model: Supplier,
              as: "supplier",
              attributes: ["code", "name"],
            },
          ],
        },
      ],
      group: [
        "ticket.supplierId",
        "ticket->supplier.id",
        "ticket->supplier.code",
        "ticket->supplier.name",
      ],
      raw: true,
      nest: true,
    });

    const formattedSummary = summary.map((item) => ({
      supplierId: item.supplierId,
      totalAmount: parseFloat(item.totalAmount),
      productCount: parseInt(item.productCount),
      ticketCount: parseInt(item.ticketCount),
      supplier: item.ticket.supplier,
    }));

    res.json({ year, week, payments: formattedSummary });
  } catch (error) {
    console.error("Error detallado:", error);
    res
      .status(500)
      .json({ message: "Error al generar resumen", error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  const yearNum = parseInt(req.query.year);
  const weekNum = parseInt(req.query.week);

  if (isNaN(yearNum) || isNaN(weekNum)) {
    return res.status(400).json({ error: "Parámetros de fecha inválidos" });
  }

  const prevWeek = weekNum <= 1 ? 52 : weekNum - 1;
  const prevYear = weekNum <= 1 ? yearNum - 1 : yearNum;

  try {
    const bySupplier = await TicketItem.findAll({
      attributes: [
        [sequelize.col("ticket->supplier.name"), "supplierName"],
        [sequelize.fn("SUM", sequelize.col("subtotal")), "value"],
      ],
      include: [
        {
          model: Ticket,
          as: "ticket",
          attributes: [],
          where: sequelize.and(
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal('ISOYEAR FROM "ticket"."date"'),
              ),
              yearNum,
            ),
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal('WEEK FROM "ticket"."date"'),
              ),
              weekNum,
            ),
          ),
          include: [
            {
              model: Supplier,
              as: "supplier",
              attributes: [],
            },
          ],
        },
      ],
      group: ["ticket->supplier.id", "ticket->supplier.name"],
      order: [[sequelize.fn("SUM", sequelize.col("subtotal")), "DESC"]],
      limit: 5, 
      raw: true,
    });

    // Bill per land
    const byLand = await TicketItem.findAll({
      attributes: [
        [sequelize.col("ticket->land.name"), "landName"],
        [sequelize.fn("SUM", sequelize.col("subtotal")), "value"],
      ],
      include: [
        {
          model: Ticket,
          as: "ticket",
          attributes: [], 
          where: sequelize.and(
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal('ISOYEAR FROM "ticket"."date"'),
              ),
              yearNum,
            ),
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal('WEEK FROM "ticket"."date"'),
              ),
              weekNum,
            ),
          ),
          include: [
            {
              model: Land,
              as: "land",
              attributes: [],
            },
          ],
        },
      ],
      group: ["ticket->land.id", "ticket->land.name"],
      raw: true,
    });

    const currentTotal =
      (await TicketItem.aggregate("subtotal", "SUM", {
        include: [
          {
            model: Ticket,
            as: "ticket",
            attributes: [], // Aseguramos que no pida columnas extras
            where: sequelize.and(
              sequelize.where(
                sequelize.fn(
                  "EXTRACT",
                  sequelize.literal('ISOYEAR FROM "ticket"."date"'),
                ),
                yearNum,
              ),
              sequelize.where(
                sequelize.fn(
                  "EXTRACT",
                  sequelize.literal('WEEK FROM "ticket"."date"'),
                ),
                weekNum,
              ),
            ),
          },
        ],
        plain: true,
      })) || 0;

    const lastWeekTotal =
      (await TicketItem.aggregate("subtotal", "SUM", {
        include: [
          {
            model: Ticket,
            as: "ticket",
            attributes: [],
            where: sequelize.and(
              sequelize.where(
                sequelize.fn(
                  "EXTRACT",
                  sequelize.literal('ISOYEAR FROM "ticket"."date"'),
                ),
                prevYear,
              ),
              sequelize.where(
                sequelize.fn(
                  "EXTRACT",
                  sequelize.literal('WEEK FROM "ticket"."date"'),
                ),
                prevWeek,
              ),
            ),
          },
        ],
        plain: true,
      })) || 0;

    const drift =
      lastWeekTotal === 0
        ? 0
        : ((currentTotal - lastWeekTotal) / lastWeekTotal) * 100;

    res.json({
      byLand,
      bySupplier, 
      performance: {
        currentTotal: parseFloat(currentTotal),
        lastWeekTotal: parseFloat(lastWeekTotal),
        drift: drift.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    res.status(500).json({ error: error.message });
  }
};
