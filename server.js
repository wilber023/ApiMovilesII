const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

console.log(' Servidor de API Simple iniciado');
console.log(' Conectando a MySQL...');
 
connectDB()
  .then(async (connection) => {
    console.log(' Conexión a MySQL establecida correctamente');
    await connection.end();
  })
  .catch((error) => {
    console.error(' Error conectando a MySQL:', error.message);
    console.log(' Verifica las credenciales en el archivo .env');
  });
 
const usuarioRoutes = require('./routes/usuarios');
const gastoRoutes = require('./routes/gastos');

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/gastos', gastoRoutes);

app.get('/', (req, res) => {
  res.json({
    mensaje: ' API Simple de Gestión de Gastos',
    version: '2.0.0',
    status: ' Funcionando correctamente',
    almacenamiento: ' MySQL Database',
    baseDatos: process.env.MYSQL_DATABASE,
    endpoints: {
      usuarios: '/api/usuarios',
      gastos: '/api/gastos'
    },
    documentacion: {
      login: 'POST /api/usuarios/login',
      registro: 'POST /api/usuarios/registro',
      gastos: 'GET /api/gastos/usuario/{id}',
      categorias: 'GET /api/gastos/categorias',
      resumen: 'GET /api/gastos/usuario/{id}/resumen'
    },
    nota: ' Datos persistentes en MySQL',
    ejemploCurl: 'curl -X POST http://localhost:3000/api/usuarios/registro -H "Content-Type: application/json" -d "{\"nombre\":\"Juan\",\"nombreUsuario\":\"juan123\",\"correoElectronico\":\"juan@test.com\",\"contrasena\":\"123456\"}"'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));

module.exports = app;
