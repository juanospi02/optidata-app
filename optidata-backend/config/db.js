/**
 * config/db.js — Conexión a la base de datos MySQL
 *
 * Crea y exporta una conexión reutilizable a MySQL usando
 * las credenciales definidas en el archivo .env.
 * Esta instancia se importa en todos los controllers y servicios
 * que necesiten ejecutar queries.
 */

const mysql = require("mysql2");
require("dotenv").config();

// Crear la conexión con las credenciales del .env
const connection = mysql.createConnection({
  host:     process.env.DB_HOST,      // Ej: "localhost"
  user:     process.env.DB_USER,      // Ej: "root"
  password: process.env.DB_PASSWORD,  // Contraseña de MySQL
  database: process.env.DB_NAME       // Nombre de la base de datos
});

// Verificar que la conexión fue exitosa al arrancar
connection.connect((err) => {
  if (err) {
    console.error("Error conectando a MySQL:", err);
  } else {
    console.log("MySQL conectado correctamente");
  }
});

module.exports = connection;
