// ============================================================
// config/db.js - Conexión a MySQL con pool de conexiones
// ============================================================
// RESPONSABLE: Equipo Backend
// ESTADO: Completo. Asegúrate de copiar .env.example a .env
//         y rellenar tus credenciales de MySQL antes de arrancar.
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const LEGACY_DATABASE_NAMES = new Set(['sistema_citas_medicas']);

const databaseName = LEGACY_DATABASE_NAMES.has(process.env.DB_NAME)
    ? 'investigacion_descriptiva'
    : process.env.DB_NAME || 'investigacion_descriptiva';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: databaseName,
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
        console.log(` Base de datos activa: ${databaseName}`);
        conn.release();
    } catch (error) {
        console.error(
            ` Error al conectar a MySQL (${process.env.DB_USER || 'sin-usuario'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${databaseName}):`,
            error.message || error.code || error
        );
        process.exit(1); // Detener el servidor si no hay BD
    }
};

testConnection();

module.exports = pool;
