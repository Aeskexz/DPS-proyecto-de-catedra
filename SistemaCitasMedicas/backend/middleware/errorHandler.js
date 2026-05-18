const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Error interno del servidor.';
    const details = err.details || null;

    return res.status(statusCode).json({
        success: false,
        error: message,
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
