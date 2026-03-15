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
const { verifyToken } = require('../middleware/auth');

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

// -----------------------------------------------------------
// PUT /api/auth/me
// Body opcional: { nombre, apellido, username, current_password, new_password }
// Permite actualizar perfil y/o cambiar contraseña del usuario autenticado.
// -----------------------------------------------------------
router.put('/me', verifyToken, async (req, res) => {
    const { nombre, apellido, username, current_password, new_password } = req.body;
    const id_usuario = req.user.id_usuario;

    if (!nombre && !apellido && !username && !new_password) {
        return res.status(400).json({ message: 'No se enviaron campos para actualizar.' });
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
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (username && username !== usuarioActual.username) {
            const [usernameExist] = await pool.query(
                'SELECT id_usuario FROM usuarios WHERE username = ? AND id_usuario <> ?',
                [username.trim(), id_usuario]
            );
            if (usernameExist.length > 0) {
                return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
            }
        }

        let password_hash = usuarioActual.password_hash;
        if (new_password) {
            if (!current_password) {
                return res.status(400).json({ message: 'Debes proporcionar tu contraseña actual.' });
            }

            const passwordValida = await bcrypt.compare(current_password, usuarioActual.password_hash);
            if (!passwordValida) {
                return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
            }

            if (new_password.length < 8) {
                return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
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
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// -----------------------------------------------------------
// DELETE /api/auth/me
// Body: { password }
// Elimina la cuenta del usuario autenticado.
// -----------------------------------------------------------
router.delete('/me', verifyToken, async (req, res) => {
    const { password } = req.body;
    const { id_usuario, id_rol } = req.user;

    if (id_rol === 1) {
        return res.status(403).json({ message: 'La cuenta administrador no puede eliminarse.' });
    }

    if (!password) {
        return res.status(400).json({ message: 'Debes confirmar tu contraseña.' });
    }

    try {
        const [[usuarioActual]] = await pool.query(
            'SELECT id_usuario, password_hash FROM usuarios WHERE id_usuario = ?',
            [id_usuario]
        );

        if (!usuarioActual) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const passwordValida = await bcrypt.compare(password, usuarioActual.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ message: 'Contraseña incorrecta.' });
        }

        if (id_rol === 2) {
            await pool.query('DELETE FROM citas WHERE id_medico = (SELECT id_medico FROM medicos WHERE id_usuario = ?)', [id_usuario]);
        }

        if (id_rol === 3) {
            await pool.query('DELETE FROM citas WHERE id_cliente = (SELECT id_cliente FROM clientes WHERE id_usuario = ?)', [id_usuario]);
        }

        await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id_usuario]);

        res.json({ message: 'Tu cuenta fue eliminada correctamente.' });
    } catch (error) {
        console.error('Error en DELETE /auth/me:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
