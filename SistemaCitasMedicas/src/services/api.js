// ============================================================
// src/services/api.js - Cliente HTTP base (Axios)
// ============================================================
// RESPONSABLE: Equipo Frontend / Backend
// ESTADO: Completo. Agrega el JWT automáticamente en cada request.
//
// IMPORTANTE: Cambia BASE_URL a la IP de tu PC en red local
//             si necesitas probar en un dispositivo físico.
//             Ejemplo: 'http://192.168.1.100:3001/api'
// ============================================================

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Usa la IP absoluta de tu red local en lugar de 10.0.2.2 o localhost
// Esto garantiza que el emulador o celular físico pueda ver tu computadora.
const BASE_URL = 'http://192.168.0.7:3001/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor: agrega el token JWT en cada request
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor: manejo global de errores HTTP
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const mensaje = error.response?.data?.message || 'Error de conexión. Intenta de nuevo.';
        return Promise.reject(new Error(mensaje));
    }
);

// ── Servicios de Auth ─────────────────────────────────────
export const authService = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: (datos) => api.post('/auth/register', datos),
};

// ── Servicios de Citas ────────────────────────────────────
export const citasService = {
    getMisCitas: () => api.get('/citas'),
    crearCita: (datos) => api.post('/citas', datos),
    actualizarEstado: (id, estado, notas_medico) =>
        api.put(`/citas/${id}/estado`, { estado, notas_medico }),
    eliminarCita: (id) => api.delete(`/citas/${id}`),
};

// ── Servicios de Médicos ──────────────────────────────────
export const medicosService = {
    getLista: () => api.get('/medicos'),
    getDetalle: (id) => api.get(`/medicos/${id}`),
    registrar: (datos) => api.post('/medicos', datos),
    eliminar: (id) => api.delete(`/medicos/${id}`),
};

// ── Servicios de Especialidades ───────────────────────────
export const especialidadesService = {
    getLista: () => api.get('/especialidades'),
};

// ── Servicios de Clientes (Pacientes) ─────────────────────
export const clientesService = {
    getLista: () => api.get('/clientes'),
    eliminar: (id) => api.delete(`/clientes/${id}`),
};

export default api;
