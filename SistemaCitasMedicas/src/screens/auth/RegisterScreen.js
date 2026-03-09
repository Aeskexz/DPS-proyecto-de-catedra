// ============================================================
// src/screens/auth/RegisterScreen.js
// ============================================================
// RESPONSABLE: Equipo Frontend
// ESTADO: Completo. Registro de clientes (pacientes).
//
// TODO PARA TUS COMPAÑEROS:
//   - Agregar selector de fecha para fecha_nacimiento (DatePicker)
//   - Agregar validación de email con regex
//   - Mostrar requisitos de contraseña en tiempo real
// ============================================================

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { authService } from '../../services/api';

const Campo = ({ label, campo, placeholder, secureTextEntry, keyboardType, valor, onChange }) => (
    <>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType || 'default'}
            autoCapitalize="none"
            value={valor}
            onChangeText={(v) => onChange(campo, v)}
        />
    </>
);

const RegisterScreen = ({ navigation }) => {
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        email: '',
        username: '',
        password: '',
        confirmar_password: '',
        telefono: '',
    });
    const [loading, setLoading] = useState(false);

    const update = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

    const handleRegister = async () => {
        const { nombre, apellido, email, username, password, confirmar_password } = form;

        if (!nombre || !apellido || !email || !username || !password) {
            if (Platform.OS === 'web') window.alert('Completa todos los campos obligatorios.');
            else Alert.alert('Campos requeridos', 'Completa todos los campos obligatorios.');
            return;
        }
        if (password !== confirmar_password) {
            if (Platform.OS === 'web') window.alert('Las contraseñas no coinciden.');
            else Alert.alert('Error', 'Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 8) {
            if (Platform.OS === 'web') window.alert('La contraseña debe tener al menos 8 caracteres.');
            else Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await authService.register({
                nombre: form.nombre.trim(),
                apellido: form.apellido.trim(),
                email: form.email.trim().toLowerCase(),
                username: form.username.trim(),
                password: form.password,
                telefono: form.telefono.trim() || undefined,
            });

            if (Platform.OS === 'web') {
                window.alert('¡Cuenta creada! Ahora puedes iniciar sesión.');
                navigation.navigate('Login');
            } else {
                Alert.alert('¡Cuenta creada!', 'Ahora puedes iniciar sesión.', [
                    { text: 'Ir al Login', onPress: () => navigation.navigate('Login') },
                ]);
            }
        } catch (error) {
            if (Platform.OS === 'web') {
                window.alert('Error al registrar: ' + error.message);
            } else {
                Alert.alert('Error al registrar', error.message);
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container}>
                <RegisterScreen.FormWrapper>
                    <Text style={styles.titulo}>Crear cuenta</Text>
                    <Text style={styles.subtitulo}>Regístrate como paciente</Text>

                    <Campo label="Nombre *" campo="nombre" placeholder="Ej. Juan" valor={form.nombre} onChange={update} />
                    <Campo label="Apellido *" campo="apellido" placeholder="Ej. Pérez" valor={form.apellido} onChange={update} />
                    <Campo label="Correo electrónico *" campo="email" placeholder="juan@email.com" keyboardType="email-address" valor={form.email} onChange={update} />
                    <Campo label="Nombre de usuario *" campo="username" placeholder="juanperez123" valor={form.username} onChange={update} />
                    <Campo label="Contraseña *" campo="password" placeholder="Mínimo 8 caracteres" secureTextEntry valor={form.password} onChange={update} />
                    <Campo label="Confirmar contraseña *" campo="confirmar_password" placeholder="••••••••" secureTextEntry valor={form.confirmar_password} onChange={update} />
                    <Campo label="Teléfono (opcional)" campo="telefono" placeholder="+503 XXXX-XXXX" keyboardType="phone-pad" valor={form.telefono} onChange={update} />

                    <TouchableOpacity
                        style={[styles.boton, loading && { opacity: 0.6 }]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Crear cuenta</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
                    </TouchableOpacity>
                </RegisterScreen.FormWrapper>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 24, backgroundColor: '#EFF6FF', flexGrow: 1 },
    titulo: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#1E3A5F', marginTop: 32, marginBottom: 4 },
    subtitulo: { textAlign: 'center', color: '#64748B', marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 4 },
    input: {
        borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
        marginBottom: 14, backgroundColor: '#fff',
    },
    boton: {
        backgroundColor: '#2563EB', borderRadius: 10,
        paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 16,
    },
    botonTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
    botonTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
    link: { textAlign: 'center', color: '#2563EB', fontSize: 14 },

    /* ESTILOS PARA ADAPTAR A PANTALLA WEB (LAPTOPS) RESPONSIVE */
    formWrapper: {
        width: '100%',
        maxWidth: 500, // Limita el ancho del formulario en pantallas grandes
        alignSelf: 'center',
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginVertical: 40
    }
});

RegisterScreen.FormWrapper = ({ children }) => {
    if (Platform.OS === 'web') {
        return <View style={styles.formWrapper}>{children}</View>
    }
    return children;
}

export default RegisterScreen;
