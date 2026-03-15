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
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isAndroidEmulator = () => {
    if (Platform.OS !== 'android') return false;

    const androidInfo = Platform.constants || {};
    const fingerprint = [
        androidInfo.Fingerprint,
        androidInfo.Model,
        androidInfo.Brand,
        androidInfo.Device,
        androidInfo.Manufacturer,
        androidInfo.Hardware,
        androidInfo.Product,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return /generic|unknown|emulator|sdk|genymotion|x86|goldfish|ranchu|vbox|simulator/.test(fingerprint);
};

const getExpoHostIp = () => {
    const hostUri = Constants.expoConfig?.hostUri || '';
    const host = hostUri.split(':')[0];
    return host || null;
};

const resolveBaseUrl = () => {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    const envAndroidDeviceUrl = process.env.EXPO_PUBLIC_API_URL_ANDROID_DEVICE;
    const envAndroidEmulatorUrl = process.env.EXPO_PUBLIC_API_URL_ANDROID_EMULATOR;

    const expoHostIp = getExpoHostIp();

    if (Platform.OS === 'android') {
        if (isAndroidEmulator()) {
            return envAndroidEmulatorUrl || 'http://10.0.2.2:3001/api';
        }

        if (envAndroidDeviceUrl) return envAndroidDeviceUrl;
        if (envUrl) return envUrl;

        if (expoHostIp) {
            return `http://${expoHostIp}:3001/api`;
        }

        return 'http://10.0.2.2:3001/api';
    }

    if (envUrl) return envUrl;

    if (expoHostIp) {
        return `http://${expoHostIp}:3001/api`;
    }

    return 'http://localhost:3001/api';
};

const BASE_URL = resolveBaseUrl();
console.log('[API] BASE_URL:', BASE_URL);

const getAndroidFallbackBaseUrls = () => {
    const candidates = [
        process.env.EXPO_PUBLIC_API_URL_ANDROID_DEVICE,
        process.env.EXPO_PUBLIC_API_URL,
        getExpoHostIp() ? `http://${getExpoHostIp()}:3001/api` : null,
        process.env.EXPO_PUBLIC_API_URL_ANDROID_EMULATOR,
        'http://10.0.2.2:3001/api',
    ].filter(Boolean);

    return [...new Set(candidates)];
};

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

//  Servicios de Auth 
export const authService = {
    login: async (username, password) => {
        try {
            return await api.post('/auth/login', { username, password });
        } catch (error) {
            const isNetworkError = !error?.response;
            if (Platform.OS !== 'android' || !isNetworkError) {
                throw error;
            }

            const fallbacks = getAndroidFallbackBaseUrls();
            for (const baseUrl of fallbacks) {
                if (baseUrl === BASE_URL) continue;
                try {
                    const response = await axios.post(`${baseUrl}/auth/login`, { username, password }, {
                        timeout: 10000,
                        headers: { 'Content-Type': 'application/json' },
                    });
                    return response.data;
                } catch (fallbackError) {
                    const fallbackHasResponse = Boolean(fallbackError?.response);
                    if (fallbackHasResponse) {
                        const message = fallbackError.response?.data?.message || 'Error al iniciar sesión.';
                        throw new Error(message);
                    }
                }
            }

            throw new Error('Error de conexión. Verifica que el backend esté activo y que tu Android pueda acceder a la red local de tu PC.');
        }
    },
    register: (datos) => api.post('/auth/register', datos),
    updateMiCuenta: (datos) => api.put('/auth/me', datos),
    eliminarMiCuenta: (password) => api.delete('/auth/me', { data: { password } }),
};

//  Servicios de Citas 
export const citasService = {
    getMisCitas: () => api.get('/citas'),
    crearCita: (datos) => api.post('/citas', datos),
    actualizarEstado: (id, estado, notas_medico) =>
        api.put(`/citas/${id}/estado`, { estado, notas_medico }),
    eliminarCita: (id) => api.delete(`/citas/${id}`),
};

//  Servicios de Médicos 
export const medicosService = {
    getLista: () => api.get('/medicos'),
    getDetalle: (id) => api.get(`/medicos/${id}`),
    registrar: (datos) => api.post('/medicos', datos),
    editar: (id, datos) => api.put(`/medicos/${id}`, datos),
    restaurarPassword: (id) => api.put(`/medicos/${id}/restaurar-password`),
    eliminar: (id) => api.delete(`/medicos/${id}`),
};

//  Servicios de Especialidades 
export const especialidadesService = {
    getLista: () => api.get('/especialidades'),
};

//  Servicios de Clientes (Pacientes) 
export const clientesService = {
    getLista: () => api.get('/clientes'),
    editar: (id, datos) => api.put(`/clientes/${id}`, datos),
    restaurarPassword: (id) => api.put(`/clientes/${id}/restaurar-password`),
    eliminar: (id) => api.delete(`/clientes/${id}`),
};

export default api;
