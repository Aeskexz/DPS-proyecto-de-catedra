import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, useWindowDimensions
} from 'react-native';
import { medicosService, citasService } from '../../services/api';
import { getResponsive } from '../../utils/responsive';

const NuevaCitaScreen = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const { horizontalPadding, contentMaxWidth } = getResponsive(width);
    const [medicos, setMedicos] = useState([]);
    const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);
    const [cargandoMedicos, setCargandoMedicos] = useState(true);

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
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            Alert.alert('Fecha inválida', 'Usa el formato YYYY-MM-DD (ej: 2025-06-15).');
            return;
        }
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
                    text: 'Entendido',
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
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.main} contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}> 
            <View style={[styles.wrapper, { maxWidth: contentMaxWidth }]}> 
            
            {/* Header Modernizado */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.titulo}>Agendar Cita</Text>
                    <Text style={styles.subtitulo}>Completa los datos del formulario</Text>
                </View>
            </View>

            {/* Selección de Médico */}
            <Text style={styles.seccionTitulo}>1. Elige tu especialista</Text>
            <View style={styles.medicoList}>
                {medicos.map((m) => (
                    <TouchableOpacity
                        key={m.id_medico}
                        activeOpacity={0.7}
                        style={[styles.medicoCard, medicoSeleccionado?.id_medico === m.id_medico && styles.medicoSeleccionado]}
                        onPress={() => setMedicoSeleccionado(m)}
                    >
                        <View style={styles.medicoInfo}>
                            <Text style={[styles.medicoNombre, medicoSeleccionado?.id_medico === m.id_medico && styles.textoBlanco]}>
                                {m.nombre_completo}
                            </Text>
                            <Text style={[styles.medicoEsp, medicoSeleccionado?.id_medico === m.id_medico && styles.textoAzulClaro]}>
                                {m.especialidad}
                            </Text>
                        </View>
                        {medicoSeleccionado?.id_medico === m.id_medico && (
                            <View style={styles.checkCircle}>
                                <Text style={styles.checkText}>✓</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Formulario */}
            <View style={styles.formCard}>
                <Text style={styles.seccionTitulo}>2. Detalles de la cita</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Fecha (Año-Mes-Día)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: 2025-06-15"
                        placeholderTextColor="#94A3B8"
                        value={fecha}
                        onChangeText={setFecha}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Hora (Formato 24h)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: 14:30"
                        placeholderTextColor="#94A3B8"
                        value={hora}
                        onChangeText={setHora}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Motivo de consulta</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe el síntoma o razón..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={4}
                        value={motivo}
                        onChangeText={setMotivo}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.boton, (loading || !medicoSeleccionado) && styles.botonDisabled]}
                onPress={handleCrearCita}
                disabled={loading || !medicoSeleccionado}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.botonTexto}>Confirmar Reservación</Text>
                )}
            </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    main: { backgroundColor: '#F8FAFC' },
    container: { paddingVertical: 20, flexGrow: 1 },
    wrapper: { width: '100%', alignSelf: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Header
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, marginTop: 20 },
    backBtn: { 
        width: 45, height: 45, borderRadius: 12, backgroundColor: '#fff', 
        justifyContent: 'center', alignItems: 'center', marginRight: 15,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
    },
    backText: { color: '#1E3A5F', fontSize: 24, fontWeight: 'bold' },
    titulo: { fontSize: 24, fontWeight: '800', color: '#1E3A5F' },
    subtitulo: { fontSize: 14, color: '#64748B' },

    seccionTitulo: { fontSize: 16, fontWeight: '700', color: '#1E3A5F', marginBottom: 15 },

    // Médicos
    medicoList: { marginBottom: 10 },
    medicoCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    medicoSeleccionado: { 
        backgroundColor: '#1E3A5F', 
        borderColor: '#1E3A5F',
        elevation: 4,
    },
    medicoInfo: { flex: 1 },
    medicoNombre: { fontWeight: '700', color: '#1E3A5F', fontSize: 16 },
    medicoEsp: { color: '#64748B', fontSize: 13, marginTop: 2 },
    textoBlanco: { color: '#fff' },
    textoAzulClaro: { color: '#93C5FD' },
    checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
    checkText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    // Formulario
    formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase' },
    input: {
        borderWidth: 1.5, borderColor: '#F1F5F9', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, backgroundColor: '#F8FAFC', color: '#1E293B'
    },
    textArea: { height: 100, textAlignVertical: 'top' },

    // Botón
    boton: {
        backgroundColor: '#2563EB', borderRadius: 16,
        paddingVertical: 18, alignItems: 'center', marginTop: 10, marginBottom: 40,
        elevation: 5, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8
    },
    botonDisabled: { backgroundColor: '#94A3B8', elevation: 0 },
    botonTexto: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default NuevaCitaScreen;
