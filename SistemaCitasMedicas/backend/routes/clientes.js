const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const ADMIN = 1;

const splitNombre = (nombreCompleto = '') => {
    const limpio = String(nombreCompleto).trim();
    if (!limpio) return { nombre: '', apellido: '' };
    const partes = limpio.split(/\s+/);
    if (partes.length === 1) return { nombre: partes[0], apellido: '' };
    return { nombre: partes[0], apellido: partes.slice(1).join(' ') };
};

const generarPasswordTemporal = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = 'Temp';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

router.get('/', verifyToken, requireRole([ADMIN]), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT codigo_id, nombre, email, username, telefono
             FROM pacientes
             ORDER BY creado_en DESC`
        );

        const mapped = rows.map((r) => {
            const partes = splitNombre(r.nombre);
            return {
                id_usuario: r.codigo_id,
                nombre: partes.nombre,
                apellido: partes.apellido,
                email: r.email,
                username: r.username,
                telefono: r.telefono,
                activo: 1,
            };
        });

        res.json(mapped);
    } catch (error) {
        console.error('Error al listar clientes:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.put('/:id', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, username, telefono } = req.body;

    if (!nombre || !apellido || !email || !username) {
        return res.status(400).json({ message: 'Nombre, apellido, email y usuario son obligatorios.' });
    }

    try {
        const [exist] = await pool.query(
            `SELECT codigo_id FROM pacientes WHERE (email = ? OR username = ?) AND codigo_id <> ?
             UNION ALL
             SELECT codigo_id FROM doctores WHERE email = ? OR username = ?
             UNION ALL
             SELECT codigo_id FROM admins WHERE email = ? OR username = ?`,
            [email.trim(), username.trim(), id, email.trim(), username.trim(), email.trim(), username.trim()]
        );
        if (exist.length > 0) {
            return res.status(409).json({ message: 'El correo o nombre de usuario ya está en uso.' });
        }

        const [result] = await pool.query(
            `UPDATE pacientes
             SET nombre = ?, email = ?, username = ?, telefono = ?
             WHERE codigo_id = ?`,
            [`${nombre.trim()} ${apellido.trim()}`.trim(), email.trim(), username.trim(), telefono?.trim() || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }

        res.json({ message: 'Paciente actualizado correctamente.' });
    } catch (error) {
        console.error('Error editando paciente:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.put('/:id/restaurar-password', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { id } = req.params;

    try {
        const passwordTemporal = generarPasswordTemporal();
        const password_hash = await bcrypt.hash(passwordTemporal, 12);

        const [result] = await pool.query(
            `UPDATE pacientes
             SET password = ?
             WHERE codigo_id = ?`,
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

router.delete('/:id', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM citas WHERE paciente_id = ?', [id]);

        const [result] = await pool.query('DELETE FROM pacientes WHERE codigo_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado o ya eliminado.' });
        }
        await pool.query(
            'INSERT INTO historial_cambios (tipo, descripcion) VALUES (?, ?)',
            ['ELIMINACION', `El administrador ${req.user.username} ha borrado la cuenta ${id}.`]
        );
        res.json({ message: 'Paciente eliminado correctamente de la base de datos.' });
    } catch (error) {
        console.error('Error eliminando paciente:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
