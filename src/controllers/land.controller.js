const { Land } = require("../../models");

exports.getLands = async (req, res) => {
  try {
    const lands = await Land.findAll({
      attributes: ["id", "code", "name"],
      order: [["name", "ASC"]],
    });

    res.json(lands);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo lands",
      error: error.message,
    });
  }
};