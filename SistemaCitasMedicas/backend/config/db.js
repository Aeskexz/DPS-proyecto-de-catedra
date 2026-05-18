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

const REQUIRED_TABLES = [
    'admins',
    'pacientes',
    'doctores',
    'citas',
    'expediente_clinico',
    'historial_cambios',
];

const getMissingObjects = (required, foundRows, keyName) => {
    const found = new Set(foundRows.map((row) => row[keyName]));
    return required.filter((name) => !found.has(name));
};

const validateSchema = async () => {
    const schema = process.env.DB_NAME;
    if (!schema) {
        throw new Error('DB_NAME no está definido en variables de entorno.');
    }

    const [tables] = await pool.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
        [schema]
    );
    const missingTables = getMissingObjects(REQUIRED_TABLES, tables, 'table_name');

    const missing = [];
    if (missingTables.length) missing.push(`tablas: ${missingTables.join(', ')}`);

    if (missing.length) {
        throw new Error(
            `La base '${schema}' no está adaptada completamente. Faltan ${missing.join(' | ')}.`
        );
    }
};

// Verificar la conexión al iniciar el servidor
const testConnection = async () => {
    try {
        const conn = await pool.getConnection();
        console.log(` Conectado a MySQL correctamente (BD: ${process.env.DB_NAME}).`);
        conn.release();

        await validateSchema();
        console.log(' Esquema validado: estructura compatible con el backend actual.');
    } catch (error) {
        console.error(' Error al conectar a MySQL:', error.message);
        process.exit(1); // Detener el servidor si no hay BD
    }
};

testConnection();

module.exports = pool;
