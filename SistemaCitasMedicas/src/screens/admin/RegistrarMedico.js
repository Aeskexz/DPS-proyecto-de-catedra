// ============================================================
// src/screens/admin/RegistrarMedico.js
// ============================================================
// RESPONSABLE: Equipo Frontend
// ESTADO: Completo. Formulario optimizado.
// ============================================================

import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions
} from 'react-native';
import { medicosService, especialidadesService } from '../../services/api';
import { getResponsive } from '../../utils/responsive';

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
        password: '', telefono: '', numero_colegiado: '', id_especialidad: '',
    });
    const [especialidades, setEspecialidades] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        especialidadesService.getLista()
            .then(setEspecialidades)
            .catch((e) => Alert.alert('Error al cargar especialidades', e.message));
    }, []);

    const update = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

    const handleRegistrar = async () => {
        const { nombre, apellido, email, username, password, id_especialidad } = form;
        if (!nombre || !apellido || !email || !username || !password || !id_especialidad) {
            Alert.alert('Campos requeridos', 'Completa todos los campos obligatorios.');
            return;
        }
        setLoading(true);
        try {
            await medicosService.registrar({
                ...form,
                id_especialidad: parseInt(form.id_especialidad, 10),
            });
            if (Platform.OS === 'web') {
                window.alert(`Médico registrado: ${nombre} ${apellido} fue agregado al sistema.`);
                if (route.params?.onVolver) route.params.onVolver();
                navigation.goBack();
            } else {
                Alert.alert('Médico registrado', `${nombre} ${apellido} fue agregado al sistema.`, [
                    { text: 'OK', onPress: () => { if (route.params?.onVolver) route.params.onVolver(); navigation.goBack(); } },
                ]);
            }
        } catch (e) {
            if (Platform.OS === 'web') {
                window.alert('Error: ' + e.message);
            } else {
                Alert.alert('Error', e.message);
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
                    <Text style={styles.back}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.titulo}>Registrar Médico</Text>

                <Campo label="Nombre *" campo="nombre" placeholder="Ej. María" valor={form.nombre} onChange={update} />
                <Campo label="Apellido *" campo="apellido" placeholder="Ej. García" valor={form.apellido} onChange={update} />
                <Campo label="Email *" campo="email" placeholder="doctor@clinica.com" keyboardType="email-address" valor={form.email} onChange={update} />
                <Campo label="Usuario *" campo="username" placeholder="mgarcia" valor={form.username} onChange={update} />
                <Campo label="Contraseña inicial *" campo="password" placeholder="Mínimo 8 caracteres" secureTextEntry valor={form.password} onChange={update} />
                <Campo label="Teléfono" campo="telefono" placeholder="+503 XXXX-XXXX" keyboardType="phone-pad" valor={form.telefono} onChange={update} />
                <Campo label="Nº Colegiado" campo="numero_colegiado" placeholder="Ej. CM-00123" valor={form.numero_colegiado} onChange={update} />

                <Text style={styles.label}>ID Especialidad * (ver lista abajo)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingresa el número de especialidad"
                    keyboardType="numeric"
                    value={form.id_especialidad}
                    onChangeText={(v) => update('id_especialidad', v)}
                />

                <View style={styles.espCard}>
                    <Text style={styles.espTitulo}>Especialidades disponibles:</Text>
                    {especialidades.map((e) => (
                        <TouchableOpacity key={e.id_especialidad} onPress={() => update('id_especialidad', String(e.id_especialidad))}>
                            <Text style={[styles.espItem, form.id_especialidad === String(e.id_especialidad) && styles.espItemSel]}>
                                {e.id_especialidad}. {e.nombre}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.boton, loading && { opacity: 0.6 }]}
                    onPress={handleRegistrar}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Registrar Médico</Text>}
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
