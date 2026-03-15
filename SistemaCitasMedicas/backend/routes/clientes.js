// ============================================================
// routes/clientes.js - Gestión de pacientes
// ============================================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const generarPasswordTemporal = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = 'Temp';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

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

// PUT /api/clientes/:id - Editar datos de un cliente (Solo Admin)
router.put('/:id', verifyToken, requireRole([1]), async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, username, telefono } = req.body;

    if (!nombre || !apellido || !email || !username) {
        return res.status(400).json({ message: 'Nombre, apellido, email y usuario son obligatorios.' });
    }

    try {
        const [exist] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE (email = ? OR username = ?) AND id_usuario <> ?',
            [email.trim(), username.trim(), id]
        );
        if (exist.length > 0) {
            return res.status(409).json({ message: 'El correo o nombre de usuario ya está en uso.' });
        }

        const [result] = await pool.query(
            `UPDATE usuarios
             SET nombre = ?, apellido = ?, email = ?, username = ?
             WHERE id_usuario = ? AND id_rol = (SELECT id_rol FROM roles WHERE nombre_rol = 'cliente' LIMIT 1)`,
            [nombre.trim(), apellido.trim(), email.trim(), username.trim(), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }

        await pool.query('UPDATE clientes SET telefono = ? WHERE id_usuario = ?', [telefono?.trim() || null, id]);

        res.json({ message: 'Paciente actualizado correctamente.' });
    } catch (error) {
        console.error('Error editando paciente:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// PUT /api/clientes/:id/restaurar-password - Restaurar contraseña de cliente (Solo Admin)
router.put('/:id/restaurar-password', verifyToken, requireRole([1]), async (req, res) => {
    const { id } = req.params;

    try {
        const passwordTemporal = generarPasswordTemporal();
        const password_hash = await bcrypt.hash(passwordTemporal, 12);

        const [result] = await pool.query(
            `UPDATE usuarios
             SET password_hash = ?
             WHERE id_usuario = ? AND id_rol = (SELECT id_rol FROM roles WHERE nombre_rol = 'cliente' LIMIT 1)`,
            [password_hash, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }

        res.json({
            message: 'Contraseña del paciente restaurada correctamente.',
            password_temporal: passwordTemporal,
        });
    } catch (error) {
        console.error('Error restaurando contraseña de paciente:', error);
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
