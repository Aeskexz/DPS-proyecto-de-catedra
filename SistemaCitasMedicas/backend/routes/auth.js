const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const ROLES = {
    ADMIN: { id: 1, nombre: 'administrador', tabla: 'admins', prefijo: 'A' },
    MEDICO: { id: 2, nombre: 'medico', tabla: 'doctores', prefijo: 'D' },
    CLIENTE: { id: 3, nombre: 'cliente', tabla: 'pacientes', prefijo: 'P' },
};

const splitNombre = (nombreCompleto = '') => {
    const limpio = String(nombreCompleto).trim();
    if (!limpio) return { nombre: '', apellido: '' };
    const partes = limpio.split(/\s+/);
    if (partes.length === 1) return { nombre: partes[0], apellido: '' };
    return { nombre: partes[0], apellido: partes.slice(1).join(' ') };
};

const generateCodigo = async (prefijo, tabla) => {
    for (let i = 0; i < 20; i++) {
        const random = Math.floor(10000000 + Math.random() * 90000000);
        const codigo = `${prefijo}-${random}`;
        const [[existente]] = await pool.query(
            `SELECT codigo_id FROM ${tabla} WHERE codigo_id = ? LIMIT 1`,
            [codigo]
        );
        if (!existente) return codigo;
    }
    throw new Error('No se pudo generar un codigo unico.');
};

const findUserByLogin = async (credential) => {
    const [rows] = await pool.query(
        `SELECT codigo_id AS id_usuario, nombre, email, username, password,
                'cliente' AS rol, 3 AS id_rol
         FROM pacientes
         WHERE username = ? OR email = ?
         UNION ALL
         SELECT codigo_id AS id_usuario, nombre, email, username, password,
                'medico' AS rol, 2 AS id_rol
         FROM doctores
         WHERE username = ? OR email = ?
         UNION ALL
         SELECT codigo_id AS id_usuario, NULL AS nombre, email, username, password,
                'administrador' AS rol, 1 AS id_rol
         FROM admins
         WHERE username = ? OR email = ?
         LIMIT 1`,
        [credential, credential, credential, credential, credential, credential]
    );

    return rows[0] || null;
};

const usernameExists = async (username, currentRole, currentId) => {
    const [rows] = await pool.query(
        `SELECT codigo_id FROM pacientes WHERE username = ?
         UNION ALL
         SELECT codigo_id FROM doctores WHERE username = ?
         UNION ALL
         SELECT codigo_id FROM admins WHERE username = ?`,
        [username, username, username]
    );

    if (rows.length === 0) return false;
    if (!currentRole || !currentId) return true;

    if (currentRole === ROLES.CLIENTE.nombre) {
        return rows.some((r) => r.codigo_id !== currentId);
    }
    if (currentRole === ROLES.MEDICO.nombre) {
        return rows.some((r) => r.codigo_id !== currentId);
    }
    if (currentRole === ROLES.ADMIN.nombre) {
        return rows.some((r) => r.codigo_id !== currentId);
    }
    return true;
};

const emailExists = async (email, currentRole, currentId) => {
    const [rows] = await pool.query(
        `SELECT codigo_id FROM pacientes WHERE email = ?
         UNION ALL
         SELECT codigo_id FROM doctores WHERE email = ?
         UNION ALL
         SELECT codigo_id FROM admins WHERE email = ?`,
        [email, email, email]
    );

    if (rows.length === 0) return false;
    if (!currentRole || !currentId) return true;
    return rows.some((r) => r.codigo_id !== currentId);
};

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
    }

    try {
        const user = await findUserByLogin(username.trim());
        if (!user) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        const passwordValida = await bcrypt.compare(password, user.password);
        if (!passwordValida) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        const { nombre, apellido } = splitNombre(user.nombre || (user.rol === 'administrador' ? 'Administrador' : ''));

        const token = jwt.sign(
            {
                id_usuario: user.id_usuario,
                id_rol: user.id_rol,
                username: user.username,
                nombre_rol: user.rol,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        res.json({
            token,
            user: {
                id_usuario: user.id_usuario,
                nombre,
                apellido,
                email: user.email,
                username: user.username,
                rol: user.rol,
                id_rol: user.id_rol,
            },
        });
    } catch (error) {
        console.error('Error en /login:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.post('/register', async (req, res) => {
    const { nombre, apellido, email, username, password, telefono } = req.body;

    if (!nombre || !apellido || !email || !username || !password) {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        if (await emailExists(email.trim().toLowerCase())) {
            return res.status(409).json({ message: 'El correo ya está registrado.' });
        }
        if (await usernameExists(username.trim().toLowerCase())) {
            return res.status(409).json({ message: 'El correo o nombre de usuario ya está registrado.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const codigoId = await generateCodigo(ROLES.CLIENTE.prefijo, ROLES.CLIENTE.tabla);

        await pool.query(
            `INSERT INTO pacientes (codigo_id, nombre, telefono, email, username, password)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                codigoId,
                `${nombre.trim()} ${apellido.trim()}`.trim(),
                telefono?.trim() || null,
                email.trim().toLowerCase(),
                username.trim(),
                passwordHash,
            ]
        );

        res.status(201).json({
            message: 'Cuenta creada exitosamente.',
            id_usuario: codigoId,
        });
    } catch (error) {
        console.error('Error en /register:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.put('/me', verifyToken, async (req, res) => {
    const { nombre, apellido, username, current_password, new_password } = req.body;
    const id_usuario = req.user.id_usuario;
    const rol = req.user.nombre_rol;

    if (!nombre && !apellido && !username && !new_password) {
        return res.status(400).json({ message: 'No se enviaron campos para actualizar.' });
    }

    try {
        let usuarioActual = null;
        let tabla = null;

        if (rol === ROLES.CLIENTE.nombre) {
            tabla = 'pacientes';
            const [[row]] = await pool.query(
                'SELECT codigo_id AS id_usuario, nombre, email, username, password FROM pacientes WHERE codigo_id = ?',
                [id_usuario]
            );
            usuarioActual = row || null;
        } else if (rol === ROLES.MEDICO.nombre) {
            tabla = 'doctores';
            const [[row]] = await pool.query(
                'SELECT codigo_id AS id_usuario, nombre, email, username, password FROM doctores WHERE codigo_id = ?',
                [id_usuario]
            );
            usuarioActual = row || null;
        } else if (rol === ROLES.ADMIN.nombre) {
            tabla = 'admins';
            const [[row]] = await pool.query(
                'SELECT codigo_id AS id_usuario, NULL AS nombre, email, username, password FROM admins WHERE codigo_id = ?',
                [id_usuario]
            );
            usuarioActual = row || null;
        }

        if (!usuarioActual) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (username && username !== usuarioActual.username) {
            if (await usernameExists(username.trim(), rol, id_usuario)) {
                return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
            }
        }

        let passwordHash = usuarioActual.password;
        if (new_password) {
            if (!current_password) {
                return res.status(400).json({ message: 'Debes proporcionar tu contraseña actual.' });
            }

            const passwordValida = await bcrypt.compare(current_password, usuarioActual.password);
            if (!passwordValida) {
                return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
            }

            if (new_password.length < 8) {
                return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
            }

            passwordHash = await bcrypt.hash(new_password, 12);
        }

        const nombreActual = usuarioActual.nombre || (rol === ROLES.ADMIN.nombre ? 'Administrador' : '');
        const partesActuales = splitNombre(nombreActual);
        const nuevoNombre = nombre ? nombre.trim() : partesActuales.nombre;
        const nuevoApellido = apellido ? apellido.trim() : partesActuales.apellido;
        const nuevoUsername = username ? username.trim() : usuarioActual.username;
        const nombreCompleto = `${nuevoNombre} ${nuevoApellido}`.trim();

        if (tabla === 'admins') {
            await pool.query(
                'UPDATE admins SET username = ?, password = ? WHERE codigo_id = ?',
                [nuevoUsername, passwordHash, id_usuario]
            );
        } else {
            await pool.query(
                `UPDATE ${tabla}
                 SET nombre = ?, username = ?, password = ?
                 WHERE codigo_id = ?`,
                [nombreCompleto, nuevoUsername, passwordHash, id_usuario]
            );
        }

        res.json({
            message: 'Cuenta actualizada correctamente.',
            user: {
                id_usuario,
                nombre: nuevoNombre,
                apellido: nuevoApellido,
                email: usuarioActual.email,
                username: nuevoUsername,
                rol,
                id_rol: req.user.id_rol,
            },
        });
    } catch (error) {
        console.error('Error en PUT /auth/me:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.delete('/me', verifyToken, async (req, res) => {
    const { password } = req.body;
    const { id_usuario, id_rol, username, nombre_rol } = req.user;

    if (id_rol === 1) {
        return res.status(403).json({ message: 'La cuenta administrador no puede eliminarse.' });
    }

    if (!password) {
        return res.status(400).json({ message: 'Debes confirmar tu contraseña.' });
    }

    try {
        let usuarioActual = null;
        let tabla = null;
        if (id_rol === ROLES.MEDICO.id) {
            tabla = 'doctores';
        } else if (id_rol === ROLES.CLIENTE.id) {
            tabla = 'pacientes';
        }

        if (!tabla) {
            return res.status(400).json({ message: 'Rol no soportado para eliminación.' });
        }

        const [[row]] = await pool.query(
            `SELECT codigo_id, password FROM ${tabla} WHERE codigo_id = ?`,
            [id_usuario]
        );
        usuarioActual = row || null;

        if (!usuarioActual) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const passwordValida = await bcrypt.compare(password, usuarioActual.password);
        if (!passwordValida) {
            return res.status(401).json({ message: 'Contraseña incorrecta.' });
        }

        if (id_rol === ROLES.MEDICO.id) {
            await pool.query('DELETE FROM citas WHERE doctor_id = ?', [id_usuario]);
        }

        if (id_rol === ROLES.CLIENTE.id) {
            await pool.query('DELETE FROM citas WHERE paciente_id = ?', [id_usuario]);
        }

        await pool.query(`DELETE FROM ${tabla} WHERE codigo_id = ?`, [id_usuario]);
        await pool.query(
            'INSERT INTO historial_cambios (tipo, descripcion) VALUES (?, ?)',
            ['ELIMINACION', `Usuario ${id_usuario} (@${username}) con rol ${nombre_rol} eliminó su cuenta.`]
        );

        res.json({ message: 'Tu cuenta fue eliminada correctamente.' });
    } catch (error) {
        console.error('Error en DELETE /auth/me:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
