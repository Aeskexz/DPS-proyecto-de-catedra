import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const Campo = ({ label, campo, placeholder, secureTextEntry, keyboardType, valor, onChange }) => (
    <View style={styles.campoContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType || 'default'}
            autoCapitalize="none"
            value={valor}
            onChangeText={(v) => onChange(campo, v)}
        />
    </View>
);

const RegisterScreen = ({ navigation }) => {
    const { register } = useAuth();
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

    const validarEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleRegister = async () => {
        const { nombre, apellido, email, username, password, confirmar_password } = form;

        if (!nombre || !apellido || !email || !username || !password) {
            return mostrarMensaje('Campos requeridos', 'Por favor, completa todos los campos marcados con (*).');
        }
        if (!validarEmail(email)) {
            return mostrarMensaje('Email invalido', 'Introduce una direccion de correo electronico real.');
        }
        if (password !== confirmar_password) {
            return mostrarMensaje('Error', 'Las contrasenas no coinciden.');
        }
        if (password.length < 8) {
            return mostrarMensaje('Contrasena debil', 'La contrasena debe tener al menos 8 caracteres.');
        }

        setLoading(true);
        try {
            const displayName = `${form.nombre.trim()} ${form.apellido.trim()}`;
            await register(form.email.trim().toLowerCase(), form.password, displayName, {
                nombre: form.nombre.trim(),
                apellido: form.apellido.trim(),
                username: form.username.trim(),
                telefono: form.telefono.trim() || '',
            });

            if (Platform.OS === 'web') {
                window.alert('Cuenta creada con exito! Bienvenido.');
                navigation.navigate('Login');
            } else {
                Alert.alert('Cuenta creada!', 'Tu registro fue exitoso.', [
                    { text: 'Ir al Login', onPress: () => navigation.navigate('Login') },
                ]);
            }
        } catch (error) {
            mostrarMensaje('Error al registrar', error.message);
        } finally {
            setLoading(false);
        }
    };

    const mostrarMensaje = (titulo, mensaje) => {
        if (Platform.OS === 'web') window.alert(`${titulo}: ${mensaje}`);
        else Alert.alert(titulo, mensaje);
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <RegisterScreen.FormWrapper>
                    <View style={styles.header}>
                        <Text style={styles.titulo}>Crear cuenta</Text>
                        <Text style={styles.subtitulo}>Registrate para gestionar tus citas medicas</Text>
                    </View>

                    <Campo label="Nombre *" campo="nombre" placeholder="Ej. Juan" valor={form.nombre} onChange={update} />
                    <Campo label="Apellido *" campo="apellido" placeholder="Ej. Perez" valor={form.apellido} onChange={update} />
                    <Campo label="Correo electronico *" campo="email" placeholder="juan@email.com" keyboardType="email-address" valor={form.email} onChange={update} />
                    <Campo label="Nombre de usuario *" campo="username" placeholder="juanperez123" valor={form.username} onChange={update} />
                    
                    <Campo label="Contrasena *" campo="password" placeholder="Minimo 8 caracteres" secureTextEntry valor={form.password} onChange={update} />
                    <Text style={[styles.pwdHint, form.password.length >= 8 ? {color: '#16A34A'} : {color: '#94A3B8'}]}>
                        {form.password.length >= 8 ? 'Contrasena valida' : 'Minimo 8 caracteres'}
                    </Text>

                    <Campo label="Confirmar contrasena *" campo="confirmar_password" placeholder="--------" secureTextEntry valor={form.confirmar_password} onChange={update} />
                    <Campo label="Telefono (opcional)" campo="telefono" placeholder="+503 XXXX-XXXX" keyboardType="phone-pad" valor={form.telefono} onChange={update} />

                    <TouchableOpacity
                        style={[styles.boton, loading && styles.botonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Finalizar Registro</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
                        <Text style={styles.linkBase}>Ya tienes cuenta? <Text style={styles.linkHighlight}>Inicia sesion</Text></Text>
                    </TouchableOpacity>
                </RegisterScreen.FormWrapper>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#F8FAFC', flexGrow: 1 },
    header: { marginBottom: 30, marginTop: Platform.OS === 'web' ? 0 : 20 },
    titulo: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#1E293B' },
    subtitulo: { textAlign: 'center', color: '#64748B', fontSize: 15, marginTop: 5 },
    
    campoContainer: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6, textTransform: 'uppercase' },
    input: {
        borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
        backgroundColor: '#fff', color: '#1E293B',
    },
    pwdHint: { fontSize: 11, marginTop: -10, marginBottom: 15, fontWeight: '600', marginLeft: 5 },
    
    boton: {
        backgroundColor: '#2563EB', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center', marginTop: 10,
        shadowColor: '#2563EB', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4
    },
    botonDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
    botonTexto: { color: '#fff', fontWeight: '800', fontSize: 16 },
    
    linkContainer: { marginTop: 25, marginBottom: 20 },
    linkBase: { textAlign: 'center', color: '#64748B', fontSize: 14 },
    linkHighlight: { color: '#2563EB', fontWeight: '700' },

    formWrapper: {
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
        marginVertical: 20
    }
});

RegisterScreen.FormWrapper = ({ children }) => {
    if (Platform.OS === 'web') {
        return <View style={styles.formWrapper}>{children}</View>
    }
    return <View style={{width: '100%'}}>{children}</View>;
}

export default RegisterScreen;