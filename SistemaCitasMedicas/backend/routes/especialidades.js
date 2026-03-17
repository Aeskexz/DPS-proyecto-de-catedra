const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id_especialidad, nombre, descripcion FROM especialidades ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        console.error('Error en GET /especialidades:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
