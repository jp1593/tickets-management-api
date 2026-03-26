"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Supplier, {
        foreignKey: "supplierId",
        as: "supplier",
      });

      this.hasMany(models.TicketItem, {
        foreignKey: "ticketId",
        as: "items",
      });
    }
  }
  Ticket.init(
    {
      date: DataTypes.DATE,
      total: DataTypes.FLOAT,
      supplierId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Ticket",
    },
  );
  return Ticket;
};
