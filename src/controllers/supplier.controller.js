const { Supplier } = require("../../models");

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      attributes: ["id", "code", "name"],
      order: [["name", "ASC"]],
    });

    res.json(suppliers);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo suppliers",
      error: error.message,
    });
  }
};