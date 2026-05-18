const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const ADMIN = 1, MEDICO = 2, CLIENTE = 3;

const generateCodigoCita = async () => {
    for (let i = 0; i < 20; i++) {
        const random = Math.floor(100000 + Math.random() * 900000);
        const codigo = `C-${random}`;
        const [[existente]] = await pool.query('SELECT codigo_id FROM citas WHERE codigo_id = ? LIMIT 1', [codigo]);
        if (!existente) return codigo;
    }
    throw new Error('No se pudo generar codigo de cita.');
};

router.get('/', verifyToken, async (req, res) => {
    try {
        let rows;
        const { id_usuario, id_rol } = req.user;

        if (id_rol === ADMIN) {
            [rows] = await pool.query(
                `SELECT c.codigo_id AS id_cita, c.fecha AS fecha_cita, c.hora AS hora_cita, c.estado,
                        c.razon AS motivo_consulta,
                        d.codigo_id AS id_medico, d.nombre AS nombre_medico, d.especialidad,
                        p.codigo_id AS id_cliente, p.nombre AS nombre_paciente, p.email AS email_paciente
                 FROM citas c
                 JOIN doctores d ON d.codigo_id = c.doctor_id
                 JOIN pacientes p ON p.codigo_id = c.paciente_id
                 ORDER BY c.fecha DESC, c.hora DESC`
            );
        } else if (id_rol === MEDICO) {
            [rows] = await pool.query(
                `SELECT c.codigo_id AS id_cita, c.fecha AS fecha_cita, c.hora AS hora_cita, c.estado,
                        c.razon AS motivo_consulta,
                        p.codigo_id AS id_cliente, p.nombre AS nombre_paciente, p.email AS email_paciente,
                        d.codigo_id AS id_medico, d.nombre AS nombre_medico, d.especialidad
                 FROM citas c
                 JOIN pacientes p ON p.codigo_id = c.paciente_id
                 JOIN doctores d ON d.codigo_id = c.doctor_id
                 WHERE c.doctor_id = ?
                 ORDER BY c.fecha ASC, c.hora ASC`,
                [id_usuario]
            );
        } else {
            [rows] = await pool.query(
                `SELECT c.codigo_id AS id_cita, c.fecha AS fecha_cita, c.hora AS hora_cita, c.estado,
                        c.razon AS motivo_consulta,
                        d.codigo_id AS id_medico, CONCAT('Dr. ', d.nombre) AS nombre_medico,
                        d.especialidad
                 FROM citas c
                 JOIN doctores d ON d.codigo_id = c.doctor_id
                 WHERE c.paciente_id = ?
                 ORDER BY c.fecha DESC, c.hora DESC`,
                [id_usuario]
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
        const [[doctor]] = await pool.query('SELECT codigo_id FROM doctores WHERE codigo_id = ?', [id_medico]);
        if (!doctor) return res.status(404).json({ message: 'Médico no encontrado.' });

        const codigoId = await generateCodigoCita();

        await pool.query(
            `INSERT INTO citas (codigo_id, doctor_id, paciente_id, fecha, hora, razon, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
            [codigoId, id_medico, req.user.id_usuario, fecha_cita, hora_cita, motivo_consulta || 'Consulta general']
        );

        res.status(201).json({
            message: 'Cita creada exitosamente.',
            id_cita: codigoId,
        });
    } catch (error) {
        console.error('Error en POST /citas:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.put('/:id/estado', verifyToken, requireRole([ADMIN, MEDICO, CLIENTE]), async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'confirmada', 'completada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ message: 'Estado no válido.' });
    }

    try {
        const [[cita]] = await pool.query('SELECT codigo_id, doctor_id, paciente_id FROM citas WHERE codigo_id = ?', [id]);
        if (!cita) return res.status(404).json({ message: 'Cita no encontrada.' });

        if (req.user.id_rol === MEDICO) {
            if (cita.doctor_id !== req.user.id_usuario) {
                return res.status(403).json({ message: 'No puedes modificar citas de otro médico.' });
            }
        }

        if (req.user.id_rol === CLIENTE) {
            if (cita.paciente_id !== req.user.id_usuario) {
                return res.status(403).json({ message: 'No puedes modificar citas de otro paciente.' });
            }
            if (estado !== 'cancelada') {
                return res.status(403).json({ message: 'Como cliente, solo puedes cancelar tu cita.' });
            }
        }

        await pool.query(
            'UPDATE citas SET estado = ? WHERE codigo_id = ?',
            [estado, id]
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
        const [result] = await pool.query('DELETE FROM citas WHERE codigo_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cita no encontrada.' });
        }
        await pool.query(
            'INSERT INTO historial_cambios (tipo, descripcion) VALUES (?, ?)',
            ['ELIMINACION', `El administrador ${req.user.username} eliminó la cita ${id}.`]
        );
        res.json({ message: 'Cita eliminada y registrada en auditoría.' });
    } catch (error) {
        console.error('Error en DELETE /citas/:id:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
