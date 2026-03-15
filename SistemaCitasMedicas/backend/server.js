// ============================================================
// server.js - Servidor principal Express
// ============================================================
// RESPONSABLE: Equipo Backend
// ESTADO: Completo.
//
// Para arrancar:
//   1. cd backend
//   2. Copiar .env.example a .env y rellenar credenciales
//   3. npm install
//   4. node server.js  (o  npm run dev  con nodemon)
//
// El servidor escucha en http://localhost:3001
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

//  Middleware global 
app.use(cors());
app.use(express.json());

//  Rutas 
app.use('/api/auth', require('./routes/auth'));
app.use('/api/citas', require('./routes/citas'));
app.use('/api/medicos', require('./routes/medicos'));
app.use('/api/especialidades', require('./routes/especialidades'));
app.use('/api/clientes', require('./routes/clientes'));

//  Ruta de salud (health-check) 
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

//  Manejo de rutas no encontradas 
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

//  Manejo global de errores 
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
});

//  Iniciar servidor 
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
