const { Supplier, Product, Land, Ticket, TicketItem, sequelize } = require("../../models");
const { readExcel } = require("../utils/excelReader");
const path = require("path");

const importExcel = async () => {
  const filePath = path.join(__dirname, "../../data/tickets-prueba.xlsx");
  const rows = readExcel(filePath);

  const suppliersMap = new Map();
  const productsMap = new Map();
  const landsMap = new Map();
  const ticketsMap = new Map();

  // 🧠 Agrupar
  for (const row of rows) {
    const ticketCode = String(row["ticket.code"]);

    // Supplier
    if (!suppliersMap.has(row["supplier.code"])) {
      suppliersMap.set(row["supplier.code"], {
        code: row["supplier.code"],
        name: row["supplier.name"],
      });
    }

    // Land
    if (!landsMap.has(row["land.code"])) {
      landsMap.set(row["land.code"], {
        code: row["land.code"],
        name: row["land.name"],
      });
    }

    // Product
    if (!productsMap.has(row["product.code"])) {
      productsMap.set(row["product.code"], {
        code: row["product.code"],
        name: row["product.name"],
        price: row["price"],
      });
    }

    // Ticket
    if (!ticketsMap.has(ticketCode)) {
      ticketsMap.set(ticketCode, {
        code: ticketCode,
        date: row["date"],
        total: row["total"],
        supplierCode: row["supplier.code"],
        landCode: row["land.code"],
        items: [],
      });
    }

    // Items
    ticketsMap.get(ticketCode).items.push({
      productCode: row["product.code"],
      quantity: row["total_qty"],
      price: row["price"],
      subtotal: row["total"],
    });
  }

  // 🚀 Transacción (nivel pro)
  const transaction = await sequelize.transaction();

  try {
    // 1. Insertar bases
    await Supplier.bulkCreate([...suppliersMap.values()], { transaction });
    await Land.bulkCreate([...landsMap.values()], { transaction });
    await Product.bulkCreate([...productsMap.values()], { transaction });

    // 2. Mapear IDs
    const suppliers = await Supplier.findAll({ transaction });
    const supplierMap = new Map(suppliers.map(s => [s.code, s.id]));

    const lands = await Land.findAll({ transaction });
    const landMap = new Map(lands.map(l => [l.code, l.id]));

    const products = await Product.findAll({ transaction });
    const productMap = new Map(products.map(p => [p.code, p.id]));

    // 3. Crear tickets e items
    for (const ticket of ticketsMap.values()) {
      const createdTicket = await Ticket.create({
        code: ticket.code,
        date: ticket.date,
        total: ticket.total,
        supplierId: supplierMap.get(ticket.supplierCode),
        landId: landMap.get(ticket.landCode),
      }, { transaction });

      const items = ticket.items.map(item => ({
        ticketId: createdTicket.id,
        productId: productMap.get(item.productCode),
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      }));

      await TicketItem.bulkCreate(items, { transaction });
    }

    await transaction.commit();

    console.log("✅ Importación exitosa");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error en importación:", error);
  }
};

module.exports = { importExcel };