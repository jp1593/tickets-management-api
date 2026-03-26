const { Ticket, Supplier, Land, TicketItem, Product } = require('../../models');

exports.getTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Ticket.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: Supplier, as: 'supplier', attributes: ['name', 'code'] },
        { model: Land, as: 'land', attributes: ['name'] }
      ],
      order: [['date', 'DESC']]
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener tickets", error: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { 
          model: TicketItem, 
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });
    if (!ticket) return res.status(404).json({ message: "Ticket no encontrado" });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el detalle", error: error.message });
  }
};