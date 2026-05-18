
const jwt = require('jsonwebtoken');


const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Token no proporcionado. Por favor inicia sesión.'
        });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        let message = 'Token inválido o expirado.';
        if (err.name === 'TokenExpiredError') {
            message = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
        } else if (err.name === 'JsonWebTokenError') {
            message = 'Token no válido. Por favor inicia sesión.';
        }
        return res.status(401).json({
            success: false,
            error: message
        });
    }
};


const requireRole = (rolesPermitidos) => (req, res, next) => {
    if (!rolesPermitidos.includes(req.user.id_rol)) {
        return res.status(403).json({
            success: false,
            error: 'No tienes permisos para realizar esta acción.'
        });
    }
    next();
};

module.exports = { verifyToken, requireRole };
