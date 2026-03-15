// ============================================================
// src/screens/auth/LoginScreen.js
// ============================================================
// RESPONSABLE: Equipo Frontend
// ESTADO: Completo. Pantalla de login con validación básica.
//
// TODO PARA TUS COMPAÑEROS:
//   - Mejorar el diseño visual (colores corporativos, logo)
//   - Agregar "¿Olvidaste tu contraseña?" con ruta de recuperación
//   - Mostrar indicador de carga mientras se espera la respuesta
// ============================================================

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Campos requeridos', 'Por favor ingresa tu usuario y contraseña.');
            return;
        }

        setLoading(true);
        try {
            await login(username.trim(), password);
            // La navegación ocurre automáticamente en AppNavigator al cambiar user
        } catch (error) {
            Alert.alert('Error al iniciar sesión', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.card}>
                {/*  Logo / Título  */}
                {/* TODO (compañeros): reemplazar con logo de la clínica */}
                <Text style={styles.titulo}> CitasMéd</Text>
                <Text style={styles.subtitulo}>Inicia sesión en tu cuenta</Text>

                {/*  Campos  */}
                <Text style={styles.label}>Usuario</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. jperez"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                />

                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                {/*  Botón Login  */}
                <TouchableOpacity
                    style={[styles.boton, loading && styles.botonDesactivado]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.botonTexto}>Iniciar Sesión</Text>
                    )}
                </TouchableOpacity>

                {/*  Ir a Registro  */}
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.link}>¿No tienes cuenta? Regístrate como paciente</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 400, // Limita el ancho del formulario en PC
        alignSelf: 'center', // Centra la tarjeta horizontalmente
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    titulo: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1E3A5F',
        marginBottom: 4,
    },
    subtitulo: {
        textAlign: 'center',
        color: '#64748B',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#F8FAFC',
    },
    boton: {
        backgroundColor: '#2563EB',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    botonDesactivado: { opacity: 0.6 },
    botonTexto: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    link: {
        textAlign: 'center',
        color: '#2563EB',
        fontSize: 14,
    },
});

export default LoginScreen;
