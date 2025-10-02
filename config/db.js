const mysql = require('mysql2/promise');

const connectDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'expense_tracker_simple'
    });

    console.log(` MySQL conectado: ${connection.config.host}/${connection.config.database}`);
    return connection;
  } catch (error) {
    console.error(` Error al conectar a MySQL: ${error.message}`);
    console.log(' Revisa la configuración en el archivo .env');
    throw error; 
  }
};

module.exports = connectDB;