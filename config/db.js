const mysql = require('mysql2/promise');

 
const connectDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'WIl01',
      password: process.env.MYSQL_PASSWORD || 'WIl001',
      database: process.env.MYSQL_DATABASE || 'expense_tracker'
    });

    console.log(`MySQL conectado: ${connection.config.host}`);
    return connection;
  } catch (error) {
    console.error(`Error al conectar a MySQL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;