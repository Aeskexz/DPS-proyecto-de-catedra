const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
    standardHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development'
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Demasiados registros desde esta IP. Intenta de nuevo en una hora.',
    standardHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development'
});

router.post('/login', loginLimiter, [
    body('username').trim().notEmpty().withMessage('Usuario es requerido'),
    body('password').notEmpty().withMessage('Contraseña es requerida')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: errors.array()[0].msg
        });
    }

    const { username, password } = req.body;

    try {
        const [rows] = await pool.query(
            `SELECT u.id_usuario, u.nombre, u.apellido, u.email,
                u.username, u.password_hash, u.activo,
                r.id_rol, r.nombre_rol
             FROM usuarios u
             JOIN roles r ON r.id_rol = u.id_rol
             WHERE u.username = ? OR u.email = ?`,
            [username, username]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Usuario o contraseña incorrectos.'
            });
        }

        const user = rows[0];

        if (!user.activo) {
            return res.status(403).json({
                success: false,
                error: 'Cuenta desactivada. Contacta al administrador.'
            });
        }

        const passwordValida = await bcrypt.compare(password, user.password_hash);
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                error: 'Usuario o contraseña incorrectos.'
            });
        }

        await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?', [user.id_usuario]);

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
            success: true,
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
        res.status(500).json({
            success: false,
            error: 'Error al procesar el inicio de sesión. Intenta de nuevo.'
        });
    }
});

router.post('/register', registerLimiter, [
    body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
    body('apellido').trim().notEmpty().withMessage('Apellido es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('username').trim().isLength({ min: 3 }).withMessage('Usuario debe tener al menos 3 caracteres'),
    body('password').isLength({ min: 8 }).withMessage('Contraseña debe tener al menos 8 caracteres')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: errors.array()[0].msg
        });
    }

    const { nombre, apellido, email, username, password, telefono, fecha_nacimiento } = req.body;

    try {
        const [exist] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE email = ? OR username = ?',
            [email, username]
        );
        if (exist.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'El correo o nombre de usuario ya está registrado.'
            });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const [result] = await pool.query(
            'CALL sp_registrar_cliente(?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, email, username, password_hash, telefono || null, fecha_nacimiento || null]
        );

        const nuevo_id = result[0][0].nuevo_id_usuario;

        res.status(201).json({
            success: true,
            message: 'Cuenta creada exitosamente.',
            id_usuario: nuevo_id,
        });
    } catch (error) {
        console.error('Error en /register:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar cuenta. Intenta de nuevo.'
        });
    }
});

router.put('/me', verifyToken, async (req, res) => {
    const { nombre, apellido, username, current_password, new_password } = req.body;
    const id_usuario = req.user.id_usuario;

    if (!nombre && !apellido && !username && !new_password) {
        return res.status(400).json({
            success: false,
            error: 'No se enviaron campos para actualizar.'
        });
    }

    try {
        const [[usuarioActual]] = await pool.query(
            `SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.username, u.password_hash,
                    u.id_rol, r.nombre_rol
             FROM usuarios u
             JOIN roles r ON r.id_rol = u.id_rol
             WHERE u.id_usuario = ?`,
            [id_usuario]
        );

        if (!usuarioActual) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado.'
            });
        }

        if (username && username !== usuarioActual.username) {
            const [usernameExist] = await pool.query(
                'SELECT id_usuario FROM usuarios WHERE username = ? AND id_usuario <> ?',
                [username.trim(), id_usuario]
            );
            if (usernameExist.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'El nombre de usuario ya está en uso.'
                });
            }
        }

        let password_hash = usuarioActual.password_hash;
        if (new_password) {
            if (!current_password) {
                return res.status(400).json({
                    success: false,
                    error: 'Debes proporcionar tu contraseña actual.'
                });
            }

            const passwordValida = await bcrypt.compare(current_password, usuarioActual.password_hash);
            if (!passwordValida) {
                return res.status(401).json({
                    success: false,
                    error: 'La contraseña actual es incorrecta.'
                });
            }

            if (new_password.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: 'La nueva contraseña debe tener al menos 8 caracteres.'
                });
            }

            password_hash = await bcrypt.hash(new_password, 12);
        }

        const nuevoNombre = nombre ? nombre.trim() : usuarioActual.nombre;
        const nuevoApellido = apellido ? apellido.trim() : usuarioActual.apellido;
        const nuevoUsername = username ? username.trim() : usuarioActual.username;

        await pool.query(
            `UPDATE usuarios
             SET nombre = ?, apellido = ?, username = ?, password_hash = ?
             WHERE id_usuario = ?`,
            [nuevoNombre, nuevoApellido, nuevoUsername, password_hash, id_usuario]
        );

        res.json({
            success: true,
            message: 'Cuenta actualizada correctamente.',
            user: {
                id_usuario,
                nombre: nuevoNombre,
                apellido: nuevoApellido,
                email: usuarioActual.email,
                username: nuevoUsername,
                rol: usuarioActual.nombre_rol,
                id_rol: usuarioActual.id_rol,
            },
        });
    } catch (error) {
        console.error('Error en PUT /auth/me:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar cuenta.'
        });
    }
});

router.delete('/me', verifyToken, async (req, res) => {
    const { password } = req.body;
    const { id_usuario, id_rol } = req.user;

    if (id_rol === 1) {
        return res.status(403).json({
            success: false,
            error: 'La cuenta administrador no puede eliminarse.'
        });
    }

    if (!password) {
        return res.status(400).json({
            success: false,
            error: 'Debes confirmar tu contraseña.'
        });
    }

    try {
        const [[usuarioActual]] = await pool.query(
            'SELECT id_usuario, password_hash FROM usuarios WHERE id_usuario = ?',
            [id_usuario]
        );

        if (!usuarioActual) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado.'
            });
        }

        const passwordValida = await bcrypt.compare(password, usuarioActual.password_hash);
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                error: 'Contraseña incorrecta.'
            });
        }

        if (id_rol === 2) {
            await pool.query('DELETE FROM citas WHERE id_medico = (SELECT id_medico FROM medicos WHERE id_usuario = ?)', [id_usuario]);
        }

        if (id_rol === 3) {
            await pool.query('DELETE FROM citas WHERE id_cliente = (SELECT id_cliente FROM clientes WHERE id_usuario = ?)', [id_usuario]);
        }

        await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id_usuario]);

        res.json({
            success: true,
            message: 'Tu cuenta fue eliminada correctamente.'
        });
    } catch (error) {
        console.error('Error en DELETE /auth/me:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar cuenta.'
        });
    }
});

module.exports = router;
