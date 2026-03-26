const { Ticket, Supplier, TicketItem, sequelize } = require('../../models');
const { Op } = require('sequelize');

exports.getWeeklyPaymentSummary = async (req, res) => {
  const { year, week } = req.query;

  if (!year || !week) {
    return res.status(400).json({ message: "Año y semana ISO son requeridos" });
  }

  try {
    // 1. Buscamos los IDs de los tickets que pertenecen a esa semana
    const weeklyTickets = await Ticket.findAll({
      attributes: ['id', 'supplierId'],
      where: sequelize.and(
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('ISOYEAR FROM "date"')), year),
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('WEEK FROM "date"')), week)
      ),
      raw: true
    });

    if (weeklyTickets.length === 0) {
      return res.json({ year, week, payments: [] });
    }

    const ticketIds = weeklyTickets.map(t => t.id);

    // 2. Agrupamos los ITEMS de esos tickets por PROVEEDOR
    const summary = await TicketItem.findAll({
      attributes: [
        [sequelize.col('ticket.supplierId'), 'supplierId'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('TicketItem.id')), 'productCount'], // Cuenta registros físicos
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('ticketId'))), 'ticketCount']
      ],
      where: {
        ticketId: { [Op.in]: ticketIds }
      },
      include: [{
        model: Ticket,
        as: 'ticket',
        attributes: [],
        include: [{
          model: Supplier,
          as: 'supplier',
          attributes: ['code', 'name']
        }]
      }],
      group: [
        'ticket.supplierId', 
        'ticket->supplier.id', 
        'ticket->supplier.code', 
        'ticket->supplier.name'
      ],
      raw: true,
      nest: true
    });

    const formattedSummary = summary.map(item => ({
      supplierId: item.supplierId,
      totalAmount: parseFloat(item.totalAmount),
      productCount: parseInt(item.productCount),
      ticketCount: parseInt(item.ticketCount),
      supplier: item.ticket.supplier
    }));

    res.json({ year, week, payments: formattedSummary });
  } catch (error) {
    console.error("Error detallado:", error);
    res.status(500).json({ message: "Error al generar resumen", error: error.message });
  }
};