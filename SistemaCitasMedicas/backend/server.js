require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/citas', require('./routes/citas'));
app.use('/api/medicos', require('./routes/medicos'));
app.use('/api/especialidades', require('./routes/especialidades'));
app.use('/api/clientes', require('./routes/clientes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
