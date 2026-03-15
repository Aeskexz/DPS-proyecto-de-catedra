// ============================================================
// config/db.js - Conexión a MySQL con pool de conexiones
// ============================================================
// RESPONSABLE: Equipo Backend
// ESTADO: Completo. Asegúrate de copiar .env.example a .env
//         y rellenar tus credenciales de MySQL antes de arrancar.
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Verificar la conexión al iniciar el servidor
const testConnection = async () => {
    try {
        const conn = await pool.getConnection();
        console.log(' Conectado a MySQL correctamente.');
        conn.release();
    } catch (error) {
        console.error(' Error al conectar a MySQL:', error.message);
        process.exit(1); // Detener el servidor si no hay BD
    }
};

testConnection();

module.exports = pool;
