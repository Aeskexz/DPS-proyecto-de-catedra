import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { crearUsuario } from '../../services/firestore-crud';
import { getResponsive } from '../../utils/responsive';

const ESPECIALIDADES = [
    { id: '1', nombre: 'Medicina General' },
    { id: '2', nombre: 'Pediatria' },
    { id: '3', nombre: 'Ginecologia' },
    { id: '4', nombre: 'Cardiologia' },
    { id: '5', nombre: 'Dermatologia' },
    { id: '6', nombre: 'Traumatologia' },
    { id: '7', nombre: 'Oftalmologia' },
    { id: '8', nombre: 'Neurologia' },
];

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

const RegistrarMedico = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const { horizontalPadding, contentMaxWidth } = getResponsive(width);
    const [form, setForm] = useState({
        nombre: '', apellido: '', email: '', username: '',
        password: '', telefono: '', numero_colegiado: '', especialidad: '',
    });
    const [loading, setLoading] = useState(false);

    const update = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

    const handleRegistrar = async () => {
        const { nombre, apellido, email, username, password, especialidad } = form;
        if (!nombre || !apellido || !email || !username || !password || !especialidad) {
            Alert.alert('Campos requeridos', 'Completa todos los campos obligatorios.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Contrasena debil', 'La contrasena debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const result = await createUserWithEmailAndPassword(auth, email.trim(), password);

            await updateProfile(result.user, {
                displayName: `${nombre.trim()} ${apellido.trim()}`
            });

            await crearUsuario(result.user.uid, {
                email: email.trim(),
                displayName: `${nombre.trim()} ${apellido.trim()}`,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                username: username.trim(),
                telefono: form.telefono.trim() || '',
                numero_colegiado: form.numero_colegiado.trim() || '',
                especialidad: especialidad,
                rol: 'medico',
            });

            if (Platform.OS === 'web') {
                window.alert(`Medico registrado: ${nombre} ${apellido} fue agregado al sistema.`);
                if (route.params?.onVolver) route.params.onVolver();
                navigation.goBack();
            } else {
                Alert.alert('Medico registrado', `${nombre} ${apellido} fue agregado al sistema.`, [
                    { text: 'OK', onPress: () => { if (route.params?.onVolver) route.params.onVolver(); navigation.goBack(); } },
                ]);
            }
        } catch (e) {
            let msg = e.message;
            if (e.code === 'auth/email-already-in-use') msg = 'Este correo ya esta registrado.';
            if (Platform.OS === 'web') {
                window.alert('Error: ' + msg);
            } else {
                Alert.alert('Error', msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}> 
                <View style={[styles.wrapper, { maxWidth: contentMaxWidth }]}> 
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>{'<- Volver'}</Text>
                </TouchableOpacity>
                <Text style={styles.titulo}>Registrar Medico</Text>

                <Campo label="Nombre *" campo="nombre" placeholder="Ej. Maria" valor={form.nombre} onChange={update} />
                <Campo label="Apellido *" campo="apellido" placeholder="Ej. Garcia" valor={form.apellido} onChange={update} />
                <Campo label="Email *" campo="email" placeholder="doctor@clinica.com" keyboardType="email-address" valor={form.email} onChange={update} />
                <Campo label="Usuario *" campo="username" placeholder="mgarcia" valor={form.username} onChange={update} />
                <Campo label="Contrasena inicial *" campo="password" placeholder="Minimo 6 caracteres" secureTextEntry valor={form.password} onChange={update} />
                <Campo label="Telefono" campo="telefono" placeholder="+503 XXXX-XXXX" keyboardType="phone-pad" valor={form.telefono} onChange={update} />
                <Campo label="No. Colegiado" campo="numero_colegiado" placeholder="Ej. CM-00123" valor={form.numero_colegiado} onChange={update} />

                <Text style={styles.label}>Especialidad *</Text>
                <View style={styles.espCard}>
                    <Text style={styles.espTitulo}>Especialidades disponibles:</Text>
                    {ESPECIALIDADES.map((e) => (
                        <TouchableOpacity key={e.id} onPress={() => update('especialidad', e.nombre)}>
                            <Text style={[styles.espItem, form.especialidad === e.nombre && styles.espItemSel]}>
                                {e.id}. {e.nombre}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.boton, loading && { opacity: 0.6 }]}
                    onPress={handleRegistrar}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Registrar Medico</Text>}
                </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { paddingVertical: 20, backgroundColor: '#FAF5FF', flexGrow: 1 },
    wrapper: { width: '100%', alignSelf: 'center' },
    back: { color: '#7C3AED', fontWeight: '600', marginTop: 30, marginBottom: 8 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: '#4C1D95', marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4, marginTop: 10 },
    input: {
        borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff',
    },
    espCard: { backgroundColor: '#EDE9FE', borderRadius: 10, padding: 12, marginTop: 10 },
    espTitulo: { fontWeight: '700', color: '#4C1D95', marginBottom: 8 },
    espItem: { paddingVertical: 4, color: '#374151', fontSize: 14 },
    espItemSel: { color: '#7C3AED', fontWeight: '700' },
    boton: {
        backgroundColor: '#5B21B6', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 40,
    },
    botonTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default RegistrarMedico;
