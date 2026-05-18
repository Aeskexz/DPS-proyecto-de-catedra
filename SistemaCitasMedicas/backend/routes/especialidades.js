const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT DISTINCT especialidad
             FROM doctores
             WHERE especialidad IS NOT NULL AND especialidad <> ''
             ORDER BY especialidad`
        );

        const mapped = rows.map((r, index) => ({
            id_especialidad: index + 1,
            nombre: r.especialidad,
            descripcion: null,
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Error en GET /especialidades:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
