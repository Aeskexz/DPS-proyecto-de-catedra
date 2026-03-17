const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const ADMIN = 1, MEDICO = 2, CLIENTE = 3;

router.get('/', verifyToken, async (req, res) => {
    try {
        let rows;
        const { id_usuario, id_rol } = req.user;

        if (id_rol === ADMIN) {
            [rows] = await pool.query('SELECT * FROM v_citas_detalle ORDER BY fecha_cita DESC, hora_cita DESC');
        } else if (id_rol === MEDICO) {
            const [[medico]] = await pool.query('SELECT id_medico FROM medicos WHERE id_usuario = ?', [id_usuario]);
            if (!medico) return res.status(404).json({ message: 'Perfil de médico no encontrado.' });
            [rows] = await pool.query(
                'SELECT * FROM v_citas_por_medico WHERE id_medico = ? ORDER BY fecha_cita ASC, hora_cita ASC',
                [medico.id_medico]
            );
        } else {
            const [[cliente]] = await pool.query('SELECT id_cliente FROM clientes WHERE id_usuario = ?', [id_usuario]);
            if (!cliente) return res.status(404).json({ message: 'Perfil de cliente no encontrado.' });
            [rows] = await pool.query(
                `SELECT c.id_cita, c.fecha_cita, c.hora_cita, c.estado, c.motivo_consulta,
                CONCAT('Dr. ', um.nombre, ' ', um.apellido) AS nombre_medico,
                e.nombre AS especialidad
         FROM citas c
         JOIN medicos m ON m.id_medico = c.id_medico
         JOIN usuarios um ON um.id_usuario = m.id_usuario
         JOIN especialidades e ON e.id_especialidad = m.id_especialidad
         WHERE c.id_cliente = ?
         ORDER BY c.fecha_cita DESC, c.hora_cita DESC`,
                [cliente.id_cliente]
            );
        }

        res.json(rows);
    } catch (error) {
        console.error('Error en GET /citas:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.post('/', verifyToken, requireRole([CLIENTE]), async (req, res) => {
    const { id_medico, fecha_cita, hora_cita, motivo_consulta } = req.body;

    if (!id_medico || !fecha_cita || !hora_cita) {
        return res.status(400).json({ message: 'Médico, fecha y hora son requeridos.' });
    }

    try {
        const [[cliente]] = await pool.query(
            'SELECT id_cliente FROM clientes WHERE id_usuario = ?',
            [req.user.id_usuario]
        );
        if (!cliente) return res.status(404).json({ message: 'Perfil de cliente no encontrado.' });

        const [result] = await pool.query(
            'CALL sp_crear_cita(?, ?, ?, ?, ?)',
            [cliente.id_cliente, id_medico, fecha_cita, hora_cita, motivo_consulta || null]
        );

        res.status(201).json({
            message: 'Cita creada exitosamente.',
            id_cita: result[0][0].nueva_cita_id,
        });
    } catch (error) {
        if (error.sqlState === '45000') {
            return res.status(409).json({ message: error.sqlMessage });
        }
        console.error('Error en POST /citas:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.put('/:id/estado', verifyToken, requireRole([ADMIN, MEDICO]), async (req, res) => {
    const { id } = req.params;
    const { estado, notas_medico } = req.body;

    const estadosValidos = ['pendiente', 'confirmada', 'completada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ message: 'Estado no válido.' });
    }

    try {
        if (req.user.id_rol === MEDICO) {
            const [[medico]] = await pool.query('SELECT id_medico FROM medicos WHERE id_usuario = ?', [req.user.id_usuario]);
            const [[cita]] = await pool.query('SELECT id_medico FROM citas WHERE id_cita = ?', [id]);
            if (!cita) return res.status(404).json({ message: 'Cita no encontrada.' });
            if (cita.id_medico !== medico.id_medico) {
                return res.status(403).json({ message: 'No puedes modificar citas de otro médico.' });
            }
        }

        await pool.query(
            'UPDATE citas SET estado = ?, notas_medico = COALESCE(?, notas_medico) WHERE id_cita = ?',
            [estado, notas_medico || null, id]
        );

        res.json({ message: 'Cita actualizada correctamente.' });
    } catch (error) {
        console.error('Error en PUT /citas/:id/estado:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.delete('/:id', verifyToken, requireRole([ADMIN]), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('CALL sp_eliminar_cita(?, ?)', [id, req.user.id_usuario]);
        res.json({ message: 'Cita eliminada y registrada en auditoría.' });
    } catch (error) {
        console.error('Error en DELETE /citas/:id:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
