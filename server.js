  const express = require('express');
  const cors = require('cors');
  const dotenv = require('dotenv');
  const connectDB = require('./config/db');

  
  dotenv.config();

  
  const app = express();

  
  app.use(cors());
  app.use(express.json());

  
  connectDB();
 
 

  
  const authRoutes = require('./routes/auth');
  const expenseRoutes = require('./routes/expenses');
 
  app.use('/api/auth', authRoutes);
  app.use('/api/expenses', expenseRoutes);

  
  app.get('/', (req, res) => {
    res.send('API de Gestión de Gastos funcionando correctamente');
  });

  
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  });

  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));

  module.exports = app;