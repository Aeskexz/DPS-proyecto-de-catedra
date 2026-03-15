// ============================================================
// src/context/AuthContext.js - Estado global de autenticación
// ============================================================
// RESPONSABLE: Equipo Frontend
// ESTADO: Completo. Provee user, token, login, logout a toda la app.
//
// Uso:
//   import { useAuth } from '../context/AuthContext';
//   const { user, login, logout } = useAuth();
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);       // objeto con id, nombre, rol, etc.
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true); // true mientras se valida sesión guardada

    // Al iniciar la app: verificar si hay sesión guardada en AsyncStorage
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                const storedUser = await AsyncStorage.getItem('user');
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.warn('No se pudo restaurar la sesión:', e);
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    /**
     * login — llama a la API, guarda token y user en estado y AsyncStorage.
     * @param {string} username
     * @param {string} password
     * @returns {Promise<{ user, token }>}
     */
    const login = async (username, password) => {
        const response = await authService.login(username, password);
        const { token: newToken, user: newUser } = response;

        await AsyncStorage.setItem('token', newToken);
        await AsyncStorage.setItem('user', JSON.stringify(newUser));

        setToken(newToken);
        setUser(newUser);

        return response;
    };

    /**
     * updateMiCuenta — actualiza perfil o contraseña y sincroniza user local.
     */
    const updateMiCuenta = async (datos) => {
        const response = await authService.updateMiCuenta(datos);
        if (response?.user) {
            await AsyncStorage.setItem('user', JSON.stringify(response.user));
            setUser(response.user);
        }
        return response;
    };

    /**
     * eliminarMiCuenta — elimina la cuenta actual y cierra sesión local.
     */
    const eliminarMiCuenta = async (password) => {
        const response = await authService.eliminarMiCuenta(password);
        await logout();
        return response;
    };

    /**
     * logout — limpia el estado y AsyncStorage.
     */
    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        } catch (e) {
            console.warn('Error borrando AsyncStorage:', e);
        }
        setToken(null);
        setUser(null);
    };

    /**
     * isRole — helper para verificar el rol del usuario.
     * @param {'administrador'|'medico'|'cliente'} rol
     */
    const isRole = (rol) => user?.rol === rol;

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, updateMiCuenta, eliminarMiCuenta, isRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    return ctx;
};
