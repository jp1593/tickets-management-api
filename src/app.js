const express = require('express');
const cors = require('cors');
const app = express();
const apiRoutes = require('./routes/api'); 

app.use(cors());

app.use(express.json()); // Middleware for Json parse

app.use('/api', apiRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});