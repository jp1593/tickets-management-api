const XLSX = require("xlsx");

// Conversión de fecha
const excelDateToJSDate = (serial) => {
  const excelEpoch = new Date(1899, 11, 30);
  return new Date(excelEpoch.getTime() + serial * 86400000);
};

const readExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];

  const rawData = XLSX.utils.sheet_to_json(
    workbook.Sheets[sheetName]
  );

  // Normalization
  const data = rawData.map((row) => ({
    "ticket.code": String(row["ticket.code"]),
    date: excelDateToJSDate(row["date"]),
    "supplier.code": row["supplier.code"],
    "supplier.name": row["supplier.name"],
    "land.code": row["land.code"],
    "land.name": row["land.name"],
    "product.code": row["product.code"],
    "product.name": row["product.name"],
    total_qty: Number(row["total_qty"]),
    price: Number(row["price"]),
    total: Number(row["total"]),
  }));

  return data;
};

module.exports = { readExcel };

