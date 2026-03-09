// ============================================================
// routes/clientes.js - Gestión de pacientes
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/clientes - Lista todos los clientes (Solo Admin)
router.get('/', verifyToken, requireRole([1]), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.username, c.telefono, u.activo
             FROM usuarios u
             JOIN roles r ON u.id_rol = r.id_rol
             LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
             WHERE r.nombre_rol = 'cliente'`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al listar clientes:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// DELETE /api/clientes/:id - Elimina o desactiva a un cliente (Solo Admin)
router.delete('/:id', verifyToken, requireRole([1]), async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Eliminar primero las citas relacionadas para evitar error de Foreign Key
        await pool.query('DELETE FROM citas WHERE id_cliente = (SELECT id_cliente FROM clientes WHERE id_usuario = ?)', [id]);

        // 2. Eliminar físicamente al usuario (MySQL borrará la tabla `clientes` en cascada)
        const [result] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ? AND id_rol = (SELECT id_rol FROM roles WHERE nombre_rol = "cliente" LIMIT 1)', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado o ya eliminado.' });
        }
        res.json({ message: 'Paciente eliminado correctamente de la base de datos.' });
    } catch (error) {
        console.error('Error eliminando paciente:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
