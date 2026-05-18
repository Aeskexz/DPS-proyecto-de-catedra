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

const generateCodigoDoctor = async () => {
    for (let i = 0; i < 20; i++) {
        const random = Math.floor(10000000 + Math.random() * 90000000);
        const codigo = `D-${random}`;
        const [[existente]] = await pool.query('SELECT codigo_id FROM doctores WHERE codigo_id = ? LIMIT 1', [codigo]);
        if (!existente) return codigo;
    }
    throw new Error('No se pudo generar codigo de doctor.');
};

const generarPasswordTemporal = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = 'Temp';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT codigo_id, nombre, username, email, especialidad, disponible_consulta
             FROM doctores
             ORDER BY especialidad, nombre`
        );

        const mapped = rows.map((r) => {
            const partes = splitNombre(r.nombre);
            return {
                id_medico: r.codigo_id,
                id_usuario: r.codigo_id,
                nombre_completo: r.nombre,
                nombre: partes.nombre,
                apellido: partes.apellido,
                username: r.username,
                email: r.email,
                especialidad: r.especialidad,
                numero_colegiado: null,
                telefono: null,
                activo: r.disponible_consulta ? 1 : 0,
            };
        });

        res.json(mapped);
    } catch (error) {
        console.error('Error en GET /medicos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [[medico]] = await pool.query(
            `SELECT codigo_id, nombre, email, username, especialidad, hora_libre, disponible_consulta
             FROM doctores
             WHERE codigo_id = ?`,
            [req.params.id]
        );

        if (!medico) return res.status(404).json({ message: 'Médico no encontrado.' });

        const horarios = medico.hora_libre
            ? [{ id_horario: 1, dia_semana: 'Lunes-Domingo', hora_inicio: medico.hora_libre, hora_fin: medico.hora_libre }]
            : [];

        res.json({
            id_medico: medico.codigo_id,
            nombre_completo: medico.nombre,
            email: medico.email,
            especialidad: medico.especialidad,
            id_especialidad: null,
            numero_colegiado: null,
            telefono: null,
            horarios,
        });
    } catch (error) {
        console.error('Error en GET /medicos/:id:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.post('/', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { nombre, apellido, email, username, password, id_especialidad, numero_colegiado, telefono } = req.body;

    if (!nombre || !apellido || !email || !username || !password || !id_especialidad) {
        return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    try {
        const [exist] = await pool.query(
            `SELECT codigo_id FROM doctores WHERE email = ? OR username = ?
             UNION ALL
             SELECT codigo_id FROM pacientes WHERE email = ? OR username = ?
             UNION ALL
             SELECT codigo_id FROM admins WHERE email = ? OR username = ?`,
            [email, username, email, username, email, username]
        );
        if (exist.length > 0) {
            return res.status(409).json({ message: 'El correo o nombre de usuario ya está registrado.' });
        }

        const password_hash = await bcrypt.hash(password, 12);
        const codigoId = await generateCodigoDoctor();
        const especialidad = id_especialidad ? String(id_especialidad) : (numero_colegiado ? 'general' : 'general');

        await pool.query(
            `INSERT INTO doctores (codigo_id, nombre, especialidad, email, username, password, disponible_consulta)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [codigoId, `${nombre} ${apellido}`.trim(), especialidad, email, username, password_hash]
        );

        res.status(201).json({
            message: 'Médico registrado exitosamente.',
            id_usuario: codigoId,
        });
    } catch (error) {
        console.error('Error en POST /medicos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.put('/:id', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, username, id_especialidad, numero_colegiado, telefono } = req.body;

    if (!nombre || !apellido || !email || !username || !id_especialidad) {
        return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    try {
        const [exist] = await pool.query(
            `SELECT codigo_id FROM doctores WHERE (email = ? OR username = ?) AND codigo_id <> ?
             UNION ALL
             SELECT codigo_id FROM pacientes WHERE email = ? OR username = ?
             UNION ALL
             SELECT codigo_id FROM admins WHERE email = ? OR username = ?`,
            [email.trim(), username.trim(), id, email.trim(), username.trim(), email.trim(), username.trim()]
        );
        if (exist.length > 0) {
            return res.status(409).json({ message: 'El correo o nombre de usuario ya está en uso.' });
        }

        const [result] = await pool.query(
            `UPDATE doctores
             SET nombre = ?, especialidad = ?, email = ?, username = ?
             WHERE codigo_id = ?`,
            [`${nombre.trim()} ${apellido.trim()}`.trim(), String(id_especialidad || numero_colegiado || 'general'), email.trim(), username.trim(), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Médico no encontrado.' });
        }

        res.json({ message: 'Médico actualizado correctamente.' });
    } catch (error) {
        console.error('Error en PUT /medicos/:id:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.put('/:id/restaurar-password', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { id } = req.params;

    try {
        const passwordTemporal = generarPasswordTemporal();
        const password_hash = await bcrypt.hash(passwordTemporal, 12);

        const [result] = await pool.query(
            `UPDATE doctores
             SET password = ?
             WHERE codigo_id = ?`,
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

router.delete('/:id', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM citas WHERE doctor_id = ?', [id]);

        const [result] = await pool.query('DELETE FROM doctores WHERE codigo_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Médico no encontrado o ya eliminado.' });
        }
        await pool.query(
            'INSERT INTO historial_cambios (tipo, descripcion) VALUES (?, ?)',
            ['ELIMINACION', `El administrador ${req.user.username} ha borrado la cuenta ${id}.`]
        );
        res.json({ message: 'Médico eliminado permanentemente de la base de datos.' });
    } catch (error) {
        console.error('Error en DELETE /medicos/:id:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
