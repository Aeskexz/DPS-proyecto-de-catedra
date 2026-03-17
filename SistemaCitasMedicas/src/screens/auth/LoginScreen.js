import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
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
        } catch (error) {
            Alert.alert('Error al iniciar sesión', error.message || 'Credenciales incorrectas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    {/* Header y Logo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconText}>✚</Text>
                        </View>
                        <Text style={styles.titulo}>CitasMéd</Text>
                        <Text style={styles.subtitulo}>Tu salud en buenas manos</Text>
                    </View>

                    {/* Formulario */}
                    <View style={styles.form}>
                        <Text style={styles.label}>Usuario o Correo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej. jperez"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="none"
                            value={username}
                            onChangeText={setUsername}
                        />

                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#94A3B8"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <TouchableOpacity 
                            onPress={() => Alert.alert('Recuperación', 'Próximamente: Se enviará un enlace a tu correo.')}
                            style={styles.forgotBtn}
                        >
                            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>

                        {/* Botón de Acción */}
                        <TouchableOpacity
                            style={[styles.boton, loading && styles.botonDesactivado]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.botonTexto}>Ingresar</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿Aún no tienes cuenta?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.link}>Regístrate aquí</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        // Sombras
        elevation: 8,
        shadowColor: '#1E3A5F',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 10 },
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconText: {
        color: '#fff',
        fontSize: 30,
        fontWeight: 'bold',
    },
    titulo: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -1,
    },
    subtitulo: {
        fontSize: 15,
        color: '#64748B',
        marginTop: 4,
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        height: 52,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#F8FAFC',
        color: '#1E293B',
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotText: {
        color: '#2563EB',
        fontSize: 13,
        fontWeight: '700',
    },
    boton: {
        backgroundColor: '#2563EB',
        borderRadius: 14,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    botonDesactivado: {
        backgroundColor: '#94A3B8',
        elevation: 0,
    },
    botonTexto: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 17,
    },
    footer: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    footerText: {
        color: '#64748B',
        fontSize: 14,
    },
    link: {
        color: '#2563EB',
        fontWeight: '800',
        fontSize: 14,
    },
});

export default LoginScreen;
