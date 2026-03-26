const { Ticket, Supplier, sequelize } = require('../../models');

exports.getWeeklyPaymentSummary = async (req, res) => {
  const { year, week } = req.query;

  if (!year || !week) {
    return res.status(400).json({ message: "Año y semana ISO son requeridos" });
  }

  try {
    const summary = await Ticket.findAll({
      attributes: [
        'supplierId',
        [sequelize.fn('SUM', sequelize.col('Ticket.total')), 'totalAmount'], 
        [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'ticketCount']   
      ],
      where: sequelize.and(
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('ISOYEAR FROM "date"')), year),
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('WEEK FROM "date"')), week)
      ),
      include: [{ 
        model: Supplier, 
        as: 'supplier', 
        attributes: ['code', 'name'] 
      }],
      
      group: ['Ticket.supplierId', 'supplier.id'], 
      order: [[sequelize.literal('"totalAmount"'), 'DESC']]
    });

    res.json({
      year,
      week,
      payments: summary
    });
  } catch (error) {
    res.status(500).json({ message: "Error al generar resumen", error: error.message });
  }
};