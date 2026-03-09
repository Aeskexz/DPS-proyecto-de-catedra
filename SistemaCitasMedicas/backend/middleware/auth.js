// ============================================================
// middleware/auth.js - Middlewares de autenticación y roles
// ============================================================
// RESPONSABLE: Equipo Backend
// ESTADO: Completo. Este middleware protege rutas y verifica
//         que el usuario tenga el rol correcto (admin/medico/cliente).
// ============================================================

const jwt = require('jsonwebtoken');

/**
 * verifyToken — verifica que el request traiga un JWT válido.
 * Agrega req.user = { id_usuario, id_rol, username } si es válido.
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id_usuario, id_rol, username }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

/**
 * requireRole — factory que genera middleware para verificar roles.
 * Uso: router.get('/ruta', verifyToken, requireRole([1, 2]), handler)
 * Roles: 1=administrador, 2=medico, 3=cliente
 */
const requireRole = (rolesPermitidos) => (req, res, next) => {
    if (!rolesPermitidos.includes(req.user.id_rol)) {
        return res.status(403).json({
            message: 'No tienes permisos para realizar esta acción.',
        });
    }
    next();
};

module.exports = { verifyToken, requireRole };
