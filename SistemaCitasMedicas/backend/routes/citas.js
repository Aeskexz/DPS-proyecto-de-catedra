// ============================================================
// routes/citas.js - CRUD de citas médicas
// ============================================================
// RESPONSABLE: Equipo Backend
// ESTADO: Completo.
//
// ENDPOINTS:
//   GET  /api/citas              — Admin: todas las citas | Cliente: sus citas | Médico: sus citas
//   POST /api/citas              — Solo clientes: crear nueva cita
//   PUT  /api/citas/:id/estado   — Médico: confirmar/completar | Admin: cualquier cambio
//   DELETE /api/citas/:id        — Solo admin
//
// ================================================================
// TODO PARA TUS COMPAÑEROS:
//   - Agregar paginación en GET /api/citas (límite, página)
//   - Agregar filtros: por fecha, por estado, por médico
//   - Enviar notificación (email/push) al crear/cancelar cita
// ================================================================

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// ID de roles: 1=admin, 2=medico, 3=cliente
const ADMIN = 1, MEDICO = 2, CLIENTE = 3;

// -----------------------------------------------------------
// GET /api/citas
// Cada rol ve solo lo que le corresponde.
// -----------------------------------------------------------
router.get('/', verifyToken, async (req, res) => {
    try {
        let rows;
        const { id_usuario, id_rol } = req.user;

        if (id_rol === ADMIN) {
            // Admin ve todo usando la vista v_citas_detalle
            [rows] = await pool.query('SELECT * FROM v_citas_detalle ORDER BY fecha_cita DESC, hora_cita DESC');
        } else if (id_rol === MEDICO) {
            // Médico ve solo sus citas
            const [[medico]] = await pool.query('SELECT id_medico FROM medicos WHERE id_usuario = ?', [id_usuario]);
            if (!medico) return res.status(404).json({ message: 'Perfil de médico no encontrado.' });
            [rows] = await pool.query(
                'SELECT * FROM v_citas_por_medico WHERE id_medico = ? ORDER BY fecha_cita ASC, hora_cita ASC',
                [medico.id_medico]
            );
        } else {
            // Cliente ve solo sus citas
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

// -----------------------------------------------------------
// POST /api/citas
// Solo clientes. Body: { id_medico, fecha_cita, hora_cita, motivo_consulta }
// -----------------------------------------------------------
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

        // Llamar al stored procedure (valida que el slot no esté ocupado)
        const [result] = await pool.query(
            'CALL sp_crear_cita(?, ?, ?, ?, ?)',
            [cliente.id_cliente, id_medico, fecha_cita, hora_cita, motivo_consulta || null]
        );

        res.status(201).json({
            message: 'Cita creada exitosamente.',
            id_cita: result[0][0].nueva_cita_id,
        });
    } catch (error) {
        // El stored procedure lanza SIGNAL si ya hay cita en ese horario
        if (error.sqlState === '45000') {
            return res.status(409).json({ message: error.sqlMessage });
        }
        console.error('Error en POST /citas:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// -----------------------------------------------------------
// PUT /api/citas/:id/estado
// Médico: puede poner 'confirmada' o 'completada' y agregar notas.
// Admin: puede poner cualquier estado.
// Body: { estado, notas_medico? }
// -----------------------------------------------------------
router.put('/:id/estado', verifyToken, requireRole([ADMIN, MEDICO]), async (req, res) => {
    const { id } = req.params;
    const { estado, notas_medico } = req.body;

    const estadosValidos = ['pendiente', 'confirmada', 'completada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ message: 'Estado no válido.' });
    }

    try {
        // Si es médico, verificar que la cita le pertenece
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

// -----------------------------------------------------------
// DELETE /api/citas/:id
// Solo admin. Llama al stored procedure que registra en auditoría.
// -----------------------------------------------------------
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
