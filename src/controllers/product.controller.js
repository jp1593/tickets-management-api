const { Product } = require("../../models");

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ["id", "code", "name", "price"],
      order: [["name", "ASC"]],
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo productos",
      error: error.message,
    });
  }
};