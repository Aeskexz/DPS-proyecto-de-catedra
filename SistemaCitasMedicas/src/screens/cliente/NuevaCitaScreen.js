// ============================================================
// src/screens/cliente/NuevaCitaScreen.js
// ============================================================
// RESPONSABLE: Equipo Frontend
// ESTADO: Completo. Permite al cliente elegir médico, fecha, hora y motivo.
//
// TODO PARA TUS COMPAÑEROS:
//   - Reemplazar el TextInput de fecha con un DatePicker nativo
//   - Mostrar solo horarios disponibles del médico seleccionado
//     (requiere GET /api/medicos/:id/slots?fecha=YYYY-MM-DD)
//   - Agregar un Picker/Dropdown para la hora en vez de texto libre
// ============================================================

import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { medicosService, citasService } from '../../services/api';

const NuevaCitaScreen = ({ navigation, route }) => {
    const [medicos, setMedicos] = useState([]);
    const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);
    const [cargandoMedicos, setCargandoMedicos] = useState(true);

    // Cargar lista de médicos al montar
    useEffect(() => {
        medicosService.getLista()
            .then(setMedicos)
            .catch((e) => Alert.alert('Error', e.message))
            .finally(() => setCargandoMedicos(false));
    }, []);

    const handleCrearCita = async () => {
        if (!medicoSeleccionado || !fecha || !hora) {
            Alert.alert('Campos requeridos', 'Selecciona médico, fecha y hora.');
            return;
        }
        // Validación simple de formato fecha (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            Alert.alert('Fecha inválida', 'Usa el formato YYYY-MM-DD (ej: 2025-06-15).');
            return;
        }
        // Validación simple de formato hora (HH:MM)
        if (!/^\d{2}:\d{2}$/.test(hora)) {
            Alert.alert('Hora inválida', 'Usa el formato HH:MM (ej: 09:30).');
            return;
        }

        setLoading(true);
        try {
            await citasService.crearCita({
                id_medico: medicoSeleccionado.id_medico,
                fecha_cita: fecha,
                hora_cita: hora + ':00',
                motivo_consulta: motivo.trim() || undefined,
            });

            Alert.alert('¡Cita creada!', 'Tu cita fue registrada exitosamente.', [
                {
                    text: 'Volver',
                    onPress: () => {
                        if (route.params?.onVolver) route.params.onVolver();
                        navigation.goBack();
                    },
                },
            ]);
        } catch (error) {
            Alert.alert('Error al crear cita', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (cargandoMedicos) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563EB" />;
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* ── Header ─────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.titulo}>Nueva Cita</Text>
            </View>

            {/* ── Selección de Médico ──────────────────── */}
            <Text style={styles.seccionTitulo}>Selecciona un médico</Text>
            {medicos.map((m) => (
                <TouchableOpacity
                    key={m.id_medico}
                    style={[styles.medicoCard, medicoSeleccionado?.id_medico === m.id_medico && styles.medicoSeleccionado]}
                    onPress={() => setMedicoSeleccionado(m)}
                >
                    <Text style={styles.medicoNombre}>{m.nombre_completo}</Text>
                    <Text style={styles.medicoEsp}>{m.especialidad}</Text>
                </TouchableOpacity>
            ))}

            {/* ── Fecha ────────────────────────────────── */}
            <Text style={styles.label}>Fecha de la cita (YYYY-MM-DD)</Text>
            {/* TODO (compañeros): reemplazar con DatePicker  */}
            <TextInput
                style={styles.input}
                placeholder="Ej: 2025-06-15"
                value={fecha}
                onChangeText={setFecha}
                keyboardType="numeric"
            />

            {/* ── Hora ─────────────────────────────────── */}
            <Text style={styles.label}>Hora (HH:MM)</Text>
            {/* TODO (compañeros): reemplazar con TimePicker o slots disponibles */}
            <TextInput
                style={styles.input}
                placeholder="Ej: 09:30"
                value={hora}
                onChangeText={setHora}
                keyboardType="numeric"
            />

            {/* ── Motivo ───────────────────────────────── */}
            <Text style={styles.label}>Motivo de consulta (opcional)</Text>
            <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Describe brevemente tu motivo..."
                multiline
                value={motivo}
                onChangeText={setMotivo}
            />

            {/* ── Botón ────────────────────────────────── */}
            <TouchableOpacity
                style={[styles.boton, loading && { opacity: 0.6 }]}
                onPress={handleCrearCita}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Confirmar Cita</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#F1F5F9', flexGrow: 1 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 30 },
    back: { color: '#2563EB', fontWeight: '600', marginRight: 16 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: '#1E3A5F' },
    seccionTitulo: { fontSize: 15, fontWeight: '700', color: '#334155', marginBottom: 10 },
    medicoCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
        borderWidth: 2, borderColor: 'transparent', elevation: 1,
    },
    medicoSeleccionado: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
    medicoNombre: { fontWeight: '700', color: '#1E3A5F', fontSize: 15 },
    medicoEsp: { color: '#64748B', fontSize: 13 },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginTop: 14, marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff',
    },
    boton: {
        backgroundColor: '#2563EB', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 40,
    },
    botonTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default NuevaCitaScreen;
