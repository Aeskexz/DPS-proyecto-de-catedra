import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { crearUsuario, obtenerUsuario } from '../services/firestore-crud';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    let userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName || 'Usuario',
                        rol: 'cliente',
                    };

                    try {
                        const dbUser = await obtenerUsuario(firebaseUser.uid);
                        if (dbUser) {
                            userData = {
                                ...userData,
                                nombre: dbUser.displayName || dbUser.nombre || firebaseUser.displayName || 'Usuario',
                                apellido: dbUser.apellido || '',
                                rol: dbUser.rol || 'cliente',
                            };
                        }
                    } catch (dbErr) {
                        console.warn('No se pudieron cargar datos de BD:', dbErr.message);
                    }

                    setUser(userData);
                    await AsyncStorage.setItem('user', JSON.stringify(userData));
                } else {
                    setUser(null);
                    await AsyncStorage.removeItem('user');
                }
            } catch (e) {
                console.warn('Error en listener de autenticacion:', e);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        try {
            setError(null);
            const result = await signInWithEmailAndPassword(auth, email, password);

            let userData = {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName || 'Usuario',
                rol: 'cliente',
            };

            try {
                const dbUser = await obtenerUsuario(result.user.uid);
                if (dbUser) {
                    userData = {
                        ...userData,
                        nombre: dbUser.displayName || dbUser.nombre || result.user.displayName || 'Usuario',
                        apellido: dbUser.apellido || '',
                        rol: dbUser.rol || 'cliente',
                    };
                }
            } catch (dbErr) {
                console.warn('No se cargaron datos extra de BD:', dbErr.message);
            }

            setUser(userData);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            return result.user;
        } catch (err) {
            const mensaje = mapearError(err.code);
            setError(mensaje);
            throw new Error(mensaje);
        }
    };

    const register = async (email, password, displayName = '', extraData = {}) => {
        try {
            setError(null);
            const result = await createUserWithEmailAndPassword(auth, email, password);

            if (displayName) {
                await updateProfile(result.user, { displayName });
            }

            try {
                await crearUsuario(result.user.uid, {
                    email,
                    displayName: displayName || email.split('@')[0],
                    nombre: extraData.nombre || displayName || email.split('@')[0],
                    apellido: extraData.apellido || '',
                    username: extraData.username || email.split('@')[0],
                    telefono: extraData.telefono || '',
                    rol: 'cliente',
                });
            } catch (dbError) {
                console.warn('No se guardaron datos en BD:', dbError.message);
            }

            return result.user;
        } catch (err) {
            const mensaje = mapearError(err.code);
            setError(mensaje);
            throw new Error(mensaje);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
        } catch (e) {
            console.warn('Error cerrando sesion:', e);
        }
    };

    const mapearError = (code) => {
        const errores = {
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contrasena incorrecta',
            'auth/email-already-in-use': 'Este email ya esta registrado',
            'auth/weak-password': 'La contrasena debe tener al menos 6 caracteres',
            'auth/invalid-email': 'Email invalido',
            'auth/invalid-credential': 'Credenciales incorrectas',
            'auth/operation-not-allowed': 'Operacion no permitida',
            'auth/too-many-requests': 'Demasiados intentos. Intenta mas tarde',
        };
        return errores[code] || 'Error de autenticacion';
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    return ctx;
};