"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.TicketItem, {
        foreignKey: "productId",
        as: "ticketItems",
      });
    }
  }
  Product.init(
    {
      code: DataTypes.STRING,
      name: DataTypes.STRING,
      price: DataTypes.FLOAT,
    },
    {
      sequelize,
      modelName: "Product",
    },
  );
  return Product;
};
