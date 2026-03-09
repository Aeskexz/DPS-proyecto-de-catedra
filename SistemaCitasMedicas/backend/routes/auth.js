// ============================================================
// routes/auth.js - Rutas de autenticación (login y registro)
// ============================================================
// RESPONSABLE: Equipo Backend
// ESTADO: Completo.
//
// ENDPOINTS:
//   POST /api/auth/login       — Cualquier usuario (admin/medico/cliente)
//   POST /api/auth/register    — Solo registro de clientes (pacientes)
//   POST /api/auth/logout      — Invalida la sesión en la BD (opcional)
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// -----------------------------------------------------------
// POST /api/auth/login
// Body: { username, password }
// Responde con: { token, user: { id, nombre, apellido, rol } }
// -----------------------------------------------------------
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
    }

    try {
        // Buscar usuario con su rol
        const [rows] = await pool.query(
            `SELECT u.id_usuario, u.nombre, u.apellido, u.email,
              u.username, u.password_hash, u.activo,
              r.id_rol, r.nombre_rol
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.username = ?`,
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        const user = rows[0];

        // Verificar que la cuenta esté activa
        if (!user.activo) {
            return res.status(403).json({ message: 'Cuenta desactivada. Contacta al administrador.' });
        }

        // Comparar contraseña
        const passwordValida = await bcrypt.compare(password, user.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        // Actualizar último acceso
        await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?', [user.id_usuario]);

        // Generar JWT
        const token = jwt.sign(
            {
                id_usuario: user.id_usuario,
                id_rol: user.id_rol,
                username: user.username,
                nombre_rol: user.nombre_rol,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        res.json({
            token,
            user: {
                id_usuario: user.id_usuario,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                username: user.username,
                rol: user.nombre_rol,
                id_rol: user.id_rol,
            },
        });
    } catch (error) {
        console.error('Error en /login:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// -----------------------------------------------------------
// POST /api/auth/register
// Body: { nombre, apellido, email, username, password, telefono, fecha_nacimiento }
// Solo registra CLIENTES (pacientes).
// Para registrar médicos, el admin usa su propio endpoint.
// -----------------------------------------------------------
router.post('/register', async (req, res) => {
    const { nombre, apellido, email, username, password, telefono, fecha_nacimiento } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !email || !username || !password) {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados.' });
    }

    // Política de contraseña mínima (ampliar según necesidad)
    if (password.length < 8) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        // Verificar que email y username no existan
        const [exist] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE email = ? OR username = ?',
            [email, username]
        );
        if (exist.length > 0) {
            return res.status(409).json({ message: 'El correo o nombre de usuario ya está registrado.' });
        }

        // Hashear contraseña
        const password_hash = await bcrypt.hash(password, 12);

        // Llamar al stored procedure sp_registrar_cliente
        const [result] = await pool.query(
            'CALL sp_registrar_cliente(?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, email, username, password_hash, telefono || null, fecha_nacimiento || null]
        );

        const nuevo_id = result[0][0].nuevo_id_usuario;

        res.status(201).json({
            message: 'Cuenta creada exitosamente.',
            id_usuario: nuevo_id,
        });
    } catch (error) {
        console.error('Error en /register:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
