const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MIGRATIONS_TABLE = 'migrations';

async function createMigrationsTable(connection) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await connection.execute(createTableSQL);
  console.log(`✓ Tabla ${MIGRATIONS_TABLE} verificada`);
}

async function getExecutedMigrations(connection) {
  const [rows] = await connection.execute(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id`
  );
  return rows.map(row => row.name);
}

async function getMigrationFiles() {
  const migrationsDir = path.join(__dirname);
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  return files;
}

async function executeMigration(connection, filename) {
  const filepath = path.join(__dirname, filename);
  const sql = fs.readFileSync(filepath, 'utf-8');

  // Dividir por punto y coma para ejecutar múltiples statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    await connection.execute(statement);
  }

  await connection.execute(
    `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`,
    [filename]
  );

  console.log(`✓ Migración ejecutada: ${filename}`);
}

async function runMigrations() {
  let connection;

  try {
    // Primero intentar conectar sin especificar la base de datos
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || ''
    });

    console.log('✓ Conectado a MySQL');

    // Crear la base de datos si no existe
    const database = process.env.MYSQL_DATABASE || 'expense_tracker_simple';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${database}`);
    console.log(`✓ Base de datos '${database}' verificada`);

    // Seleccionar la base de datos
    await connection.execute(`USE ${database}`);

    // Crear tabla de migraciones
    await createMigrationsTable(connection);

    // Obtener migraciones ejecutadas y disponibles
    const executed = await getExecutedMigrations(connection);
    const available = await getMigrationFiles();

    const pending = available.filter(file => !executed.includes(file));

    if (pending.length === 0) {
      console.log('✓ No hay migraciones pendientes');
      return;
    }

    console.log(`\n📋 Migraciones pendientes: ${pending.length}`);

    for (const migration of pending) {
      await executeMigration(connection, migration);
    }

    console.log('\n✅ Todas las migraciones se ejecutaron correctamente\n');

  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
