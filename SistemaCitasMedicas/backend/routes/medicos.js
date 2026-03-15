// ============================================================
// routes/medicos.js - Gestión de médicos
// ============================================================
// RESPONSABLE: Equipo Backend
// ESTADO: Completo.
//
// ENDPOINTS:
//   GET  /api/medicos            — Todos los roles: lista de médicos activos
//   GET  /api/medicos/:id        — Detalle de un médico (incluye horarios)
//   POST /api/medicos            — Solo admin: registrar nuevo médico
//   DELETE /api/medicos/:id      — Solo admin: desactivar médico + cancelar sus citas
//
// ================================================================
// TODO PARA TUS COMPAÑEROS:
//   - PUT /api/medicos/:id        — Editar datos del médico (nombre, especialidad, teléfono)
//   - POST /api/medicos/:id/horarios — Agregar horario de disponibilidad
//   - GET  /api/medicos/:id/horarios — Ver disponibilidad de un médico
//   - GET  /api/medicos/:id/slots    — Calcular slots libres para una fecha concreta
// ================================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const ADMIN = 1;

const generarPasswordTemporal = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = 'Temp';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// -----------------------------------------------------------
// GET /api/medicos
// Cualquier usuario autenticado puede ver la lista de médicos.
// -----------------------------------------------------------
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT m.id_medico, u.id_usuario,
              CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
              u.nombre,
              u.apellido,
              u.username,
              u.email,
              e.nombre AS especialidad,
              m.numero_colegiado,
              m.telefono,
              u.activo
        FROM usuarios u
        JOIN roles r ON u.id_rol = r.id_rol
        LEFT JOIN medicos m ON m.id_usuario = u.id_usuario
        LEFT JOIN especialidades e ON e.id_especialidad = m.id_especialidad
        WHERE r.nombre_rol = 'medico'
        ORDER BY e.nombre, u.apellido`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error en GET /medicos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// -----------------------------------------------------------
// GET /api/medicos/:id
// Detalle de un médico con sus horarios de disponibilidad.
// -----------------------------------------------------------
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [[medico]] = await pool.query(
            `SELECT m.id_medico,
              CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
              u.email,
              e.nombre AS especialidad,
              e.id_especialidad,
              m.numero_colegiado,
              m.telefono
       FROM medicos m
       JOIN usuarios u ON u.id_usuario = m.id_usuario
       JOIN especialidades e ON e.id_especialidad = m.id_especialidad
       WHERE m.id_medico = ? AND u.activo = 1`,
            [req.params.id]
        );

        if (!medico) return res.status(404).json({ message: 'Médico no encontrado.' });

        const [horarios] = await pool.query(
            'SELECT id_horario, dia_semana, hora_inicio, hora_fin FROM horarios_medico WHERE id_medico = ? AND activo = 1',
            [req.params.id]
        );

        res.json({ ...medico, horarios });
    } catch (error) {
        console.error('Error en GET /medicos/:id:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// -----------------------------------------------------------
// POST /api/medicos
// Solo admin. Body: { nombre, apellido, email, username, password,
//                     id_especialidad, numero_colegiado, telefono }
// -----------------------------------------------------------
router.post('/', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { nombre, apellido, email, username, password, id_especialidad, numero_colegiado, telefono } = req.body;

    if (!nombre || !apellido || !email || !username || !password || !id_especialidad) {
        return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    try {
        const [exist] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE email = ? OR username = ?',
            [email, username]
        );
        if (exist.length > 0) {
            return res.status(409).json({ message: 'El correo o nombre de usuario ya está registrado.' });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const [result] = await pool.query(
            'CALL sp_registrar_medico(?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, email, username, password_hash, id_especialidad, numero_colegiado || null, telefono || null]
        );

        res.status(201).json({
            message: 'Médico registrado exitosamente.',
            id_usuario: result[0][0].nuevo_id_usuario,
        });
    } catch (error) {
        console.error('Error en POST /medicos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// -----------------------------------------------------------
// PUT /api/medicos/:id — Solo admin
// Editar datos básicos del médico por id_usuario
// -----------------------------------------------------------
router.put('/:id', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, username, id_especialidad, numero_colegiado, telefono } = req.body;

    if (!nombre || !apellido || !email || !username || !id_especialidad) {
        return res.status(400).json({ message: 'Faltan campos obligatorios.' });
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
             WHERE id_usuario = ? AND id_rol = (SELECT id_rol FROM roles WHERE nombre_rol = 'medico' LIMIT 1)`,
            [nombre.trim(), apellido.trim(), email.trim(), username.trim(), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Médico no encontrado.' });
        }

        await pool.query(
            `UPDATE medicos
             SET id_especialidad = ?, numero_colegiado = ?, telefono = ?
             WHERE id_usuario = ?`,
            [id_especialidad, numero_colegiado?.trim() || null, telefono?.trim() || null, id]
        );

        res.json({ message: 'Médico actualizado correctamente.' });
    } catch (error) {
        console.error('Error en PUT /medicos/:id:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// -----------------------------------------------------------
// PUT /api/medicos/:id/restaurar-password — Solo admin
// -----------------------------------------------------------
router.put('/:id/restaurar-password', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { id } = req.params;

    try {
        const passwordTemporal = generarPasswordTemporal();
        const password_hash = await bcrypt.hash(passwordTemporal, 12);

        const [result] = await pool.query(
            `UPDATE usuarios
             SET password_hash = ?
             WHERE id_usuario = ? AND id_rol = (SELECT id_rol FROM roles WHERE nombre_rol = 'medico' LIMIT 1)`,
            [password_hash, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Médico no encontrado.' });
        }

        res.json({
            message: 'Contraseña del médico restaurada correctamente.',
            password_temporal: passwordTemporal,
        });
    } catch (error) {
        console.error('Error restaurando contraseña de médico:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// -----------------------------------------------------------
// DELETE /api/medicos/:id — Solo admin
// Elimina físicamente el médico de la base de datos
// -----------------------------------------------------------
router.delete('/:id', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { id } = req.params; // id_usuario
    try {
        // 1. Eliminar citas relacionadas para evitar error de FK
        await pool.query('DELETE FROM citas WHERE id_medico = (SELECT id_medico FROM medicos WHERE id_usuario = ?)', [id]);

        // 2. Eliminar físicamente al usuario (MySQL borrará tabla `medicos` y `horarios` en cascada)
        const [result] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ? AND id_rol = (SELECT id_rol FROM roles WHERE nombre_rol = "medico" LIMIT 1)', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Médico no encontrado o ya eliminado.' });
        }
        res.json({ message: 'Médico eliminado permanentemente de la base de datos.' });
    } catch (error) {
        console.error('Error en DELETE /medicos/:id:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
