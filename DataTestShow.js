const { sequelize, Ticket, Supplier, Land, TicketItem, Product } = require("./models");

const test = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a la DB");

    const tickets = await Ticket.findAll({
      include: [
        { model: Supplier, as: "supplier" },
        { model: Land, as: "land" },
        {
          model: TicketItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });

    console.log(JSON.stringify(tickets, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await sequelize.close();
  }
};

test();